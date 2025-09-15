package pubsub

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
)

type ReadyGrep struct {
	Type string `json:"type"`
	Expr string `json:"expr"`
}

type Dependency struct {
	Path         string       `json:"path"`
	Ready        ReadyGrep    `json:"ready"`
	Dependencies []Dependency `json:"dependencies"`
}

type ImplantacaoCreatedPayload struct {
	Url      string   `json:"url"`
	Manifest Manifest `json:"manifest"`
}

type Manifest struct {
	Version      string       `json:"version"`
	Dependencies []Dependency `json:"dependencies"`
}

func HandleImplantacaoCreated() EventHandler {
	return func(data string) {
		var payload ImplantacaoCreatedPayload

		err := json.Unmarshal([]byte(data), &payload)

		if err != nil {
			fmt.Println("Erro ao parsear payload:", err)
			return
		}

		// TODO: Implementar manager para impedir múltiplas implantações simultâneas

		// Steps:
		// 1. Download do arquivo
		// 2. Extrair o arquivo para uma pasta temporária
		// 3. Ler o manifest e validar
		// 4. Executar os scripts na ordem correta
		// 5. Limpar a pasta temporária

		fmt.Println("Iniciando implantação com URL:", payload.Url)

		dataBytes, err := downloadUrl(payload.Url)

		if err != nil {
			fmt.Println("Erro ao baixar o arquivo:", err)
			return
		}

		fmt.Println("Arquivo baixado com sucesso, tamanho:", len(dataBytes))

		tempDir, err := extractArchive(dataBytes)

		if err != nil {
			fmt.Println("Erro ao extrair o arquivo:", err)
			return
		}

		fmt.Println("Arquivo extraído para:", tempDir)

		fmt.Println("Manifest lido com sucesso, versão:", payload.Manifest.Version)

		err = executeDependencies(payload.Manifest.Dependencies, tempDir)

		if err != nil {
			fmt.Println("Erro ao executar dependências:", err)
			return
		}
	}
}

func downloadUrl(url string) ([]byte, error) {
	resp, err := http.Get(url)

	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to download file: %s", resp.Status)
	}

	return io.ReadAll(resp.Body)
}

func extractArchive(data []byte) (string, error) {
	tempDir, err := os.MkdirTemp(
		"",
		"implantacao"+"-"+fmt.Sprintf("%d", rand.Intn(1000)),
	)

	if err != nil {
		return "", err
	}

	err = os.MkdirAll(tempDir, 0755)

	if err != nil {
		return "", err
	}

	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))

	if err != nil {
		return "", err
	}

	for _, file := range reader.File {
		filePath := tempDir + string(os.PathSeparator) + file.Name

		if file.FileInfo().IsDir() {
			err := os.MkdirAll(filePath, file.Mode())

			if err != nil {
				return "", err
			}

			continue
		}

		err := os.MkdirAll(
			filePath[:len(filePath)-len(file.Name)],
			0755,
		)

		if err != nil {
			return "", err
		}

		destFile, err := os.OpenFile(
			filePath,
			os.O_WRONLY|os.O_CREATE|os.O_TRUNC,
			file.Mode(),
		)

		if err != nil {
			return "", err
		}

		srcFile, err := file.Open()

		if err != nil {
			destFile.Close()
			return "", err
		}

		_, err = io.Copy(destFile, srcFile)

		destFile.Close()
		srcFile.Close()

		if err != nil {
			return "", err
		}
	}

	return tempDir, nil
}

func executeDependencies(deps []Dependency, basePath string) error {
	for _, dep := range deps {
		depPath := basePath + string(os.PathSeparator) + dep.Path

		info, err := os.Stat(depPath)

		if os.IsNotExist(err) || info.IsDir() {
			return fmt.Errorf("dependency path does not exist or is a directory: %s", depPath)
		}

		// Executar dependências recursivamente
		err = executeDependencies(dep.Dependencies, basePath)

		if err != nil {
			return err
		}

		cmd := exec.Command(depPath)

		// Ler linha por linha da saída padrão para detectar o padrão de "ready"
		stdoutPipe, err := cmd.StdoutPipe()

		if err != nil {
			return err
		}

		stderrPipe, err := cmd.StderrPipe()

		if err != nil {
			return err
		}

		err = cmd.Start()

		if err != nil {
			return err
		}

		// Channel to signal when ready expression is found
		readyFound := make(chan bool, 1)

		// If no ready expression is specified, consider it immediately ready
		if dep.Ready.Expr == "" {
			readyFound <- true
		}

		go func() {
			buf := make([]byte, 1024)
			for {
				n, err := stdoutPipe.Read(buf)
				if n > 0 {
					output := string(buf[:n])
					fmt.Print(output)
					if dep.Ready.Expr != "" && containsReadyExpr(output, dep.Ready.Expr) {
						fmt.Printf("Dependency %s is ready (stdout)\n", dep.Path)
						select {
						case readyFound <- true:
						default:
						}
					}
				}
				if err != nil {
					break
				}
			}
		}()

		go func() {
			buf := make([]byte, 1024)
			for {
				n, err := stderrPipe.Read(buf)
				if n > 0 {
					output := string(buf[:n])
					fmt.Print(output)
					if dep.Ready.Expr != "" && containsReadyExpr(output, dep.Ready.Expr) {
						fmt.Printf("Dependency %s is ready (stderr)\n", dep.Path)
						select {
						case readyFound <- true:
						default:
						}
					}
				}
				if err != nil {
					break
				}
			}
		}()

		// Wait for either the process to complete or ready signal
		processFinished := make(chan error, 1)
		go func() {
			processFinished <- cmd.Wait()
		}()

		// Wait for ready signal first
		select {
		case <-readyFound:
			// Ready expression found, continue
		case err := <-processFinished:
			// Process finished without ready signal
			if dep.Ready.Expr != "" {
				return fmt.Errorf("dependency %s finished without ready expression '%s' being found", dep.Path, dep.Ready.Expr)
			}
			if err != nil {
				return fmt.Errorf("failed to execute dependency %s: %v", dep.Path, err)
			}
		}

		// Now wait for the process to actually finish
		err = <-processFinished
		if err != nil {
			return fmt.Errorf("failed to execute dependency %s: %v", dep.Path, err)
		}

		fmt.Printf("Dependency %s executed successfully\n", dep.Path)
	}

	return nil
}

func containsReadyExpr(output string, expr string) bool {
	return bytes.Contains([]byte(output), []byte(expr))
}
