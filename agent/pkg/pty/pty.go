package pty

import (
	"context"
	"log"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
)

func Start(
	ctx context.Context,
	inputChan chan []byte,
	outputChan chan []byte,
	closeChan chan struct{},
) {
	shell := os.Getenv("SHELL")

	if shell == "" {
		if _, err := exec.LookPath("bash"); err == nil {
			shell = "bash"
		} else {
			shell = "sh"
		}
	}

	cmd := exec.Command(shell)

	ptmx, err := pty.Start(cmd)

	if err != nil {
		log.Fatalf("Erro ao iniciar o pty: %v", err)
	}

	defer func() { _ = ptmx.Close() }()

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
				if _, err := ptmx.Write(data); err != nil {
					return
				}
			}
		}
	}()

	go func() {
		defer safeClose()

		buf := make([]byte, 1024)

		for {
			n, err := ptmx.Read(buf)
			if err != nil {
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
		_ = cmd.Wait()
	}()

	<-closeChan
}
