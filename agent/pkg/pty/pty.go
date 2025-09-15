package pty

import (
	"context"
	"log"
	"os"
	"runtime"
	"sync"

	"github.com/runletapp/go-console"
)

func Start(
	ctx context.Context,
	inputChan chan []byte,
	outputChan chan []byte,
	closeChan chan struct{},
) {
	proc, err := console.New(120, 60)

	if err != nil {
		log.Fatalf("Erro ao criar console: %v", err)
	}

	defer proc.Close()

	var args []string

	if runtime.GOOS == "windows" {
		// powershell has some issues like clearing the screen
		// args = []string{"powershell.exe"}
		args = []string{"cmd.exe"}
	} else {
		shell := os.Getenv("SHELL")

		if shell == "" {
			shell = "bash"
		}

		args = []string{shell}
	}

	if err := proc.Start(args); err != nil {
		log.Fatalf("Erro ao iniciar processo: %v", err)
	}

	var closeOnce sync.Once

	safeClose := func() {
		closeOnce.Do(func() {
			close(closeChan)
		})
	}

	go func() {
		defer safeClose()
		for {
			select {
			case <-ctx.Done():
				return
			case data := <-inputChan:
				if len(data) == 0 {
					continue
				}
				if _, err := proc.Write(data); err != nil {
					println("Erro ao escrever no processo:", err)
					return
				}
			}
		}
	}()

	go func() {
		defer safeClose()
		buf := make([]byte, 1024)
		for {
			n, err := proc.Read(buf)
			if err != nil {
				println("Erro ao ler do processo:", err)
				return
			}
			if n > 0 {
				select {
				case outputChan <- buf[:n]:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	go func() {
		defer safeClose()
		if _, err := proc.Wait(); err != nil {
			log.Printf("Process wait error: %v", err)
		}
	}()

	<-closeChan
}
