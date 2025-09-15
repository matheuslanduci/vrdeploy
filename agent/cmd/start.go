/*
Copyright © 2025 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"agent/pkg/pty"
	"agent/pkg/pubsub"
	"fmt"
	"time"

	"github.com/charmbracelet/lipgloss"
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Realiza a inicialização do serviço do vrdeploy",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Print("\033[H\033[2J")

		foregroundStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color("#FF9200"))

		for _, line := range []string{
			"",
			"██╗   ██╗██████╗ ██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗",
			"██║   ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝",
			"██║   ██║██████╔╝██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝ ",
			"╚██╗ ██╔╝██╔══██╗██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝  ",
			" ╚████╔╝ ██║  ██║██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║   ",
			"  ╚═══╝  ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝   ",
			"",
		} {
			fmt.Println(foregroundStyle.Render(line))
			time.Sleep(200 * time.Millisecond)
		}

		ps := pubsub.New(
			[]string{pubsub.AgenteUpdatedEvent, pubsub.PtySessionStartedEvent, pubsub.PtyInputEvent},
		)

		ptyManager := pty.NewPtyManager(ps)

		ps.Subscribe(
			pubsub.PtySessionStartedEvent,
			ptyManager.HandleSessionStarted(cmd.Context()),
		)
		ps.Subscribe(
			pubsub.PtyInputEvent,
			ptyManager.HandleInput(),
		)

		tries := 0

		for {
			err := ps.Connect()

			if err != nil {
				fmt.Println("Erro ao conectar ao serviço de pubsub:", err)
				return
			}

			if err == nil {
				// A conexão foi bem-sucedida mas ocorreu algo inesperado (ex: falha do servidor)
				tries = 0
			}

			tries++

			if tries >= 5 {
				fmt.Println("Não foi possível conectar ao serviço de pubsub após várias tentativas:", err)
				return
			}

			time.Sleep(5 * time.Second)
		}
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
}
