package cmd

import (
	"agent/pkg/api"
	"agent/pkg/pubsub"
	"agent/pkg/secret"
	"agent/pkg/system"
	"encoding/json"
	"fmt"
	"time"

	"github.com/briandowns/spinner"
	"github.com/charmbracelet/lipgloss"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/spf13/cobra"
)

var setupCmd = &cobra.Command{
	Use:   "setup",
	Short: "Realiza a configuração inicial do vrdeploy",
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

		mac, err := system.MacAddress()

		if err != nil {
			fmt.Println("Erro ao obter o MAC address:", err)
			return
		}

		info, err := host.Info()

		if err != nil {
			fmt.Println("Erro ao obter informações do sistema:", err)
			return
		}

		boxStyle := lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("#FF9200")).
			Padding(1, 2).
			Margin(1, 0)

		fmt.Println(
			boxStyle.Render(
				"Endereço MAC:", foregroundStyle.Render(mac),
				"\nSistema Operacional:", foregroundStyle.Render(info.Platform+" "+info.PlatformVersion),
			),
		)

		cadastroAgenteSpinner := spinner.New(spinner.CharSets[14], 100*time.Millisecond)
		cadastroAgenteSpinner.Suffix = " Cadastrando agente..."
		cadastroAgenteSpinner.FinalMSG = "✔  Agente cadastrado com sucesso!\n"
		cadastroAgenteSpinner.Color("#FF9200")
		cadastroAgenteSpinner.Start()

		resp, err := api.CadastrarAgente(api.CadastrarAgenteRequest{
			EnderecoMac:        mac,
			SistemaOperacional: info.Platform + " " + info.PlatformVersion,
		})

		if err != nil {
			fmt.Println("Erro ao cadastrar agente:", err)
			return
		}

		err = secret.Set(resp.ChaveSecreta)

		if err != nil {
			fmt.Println("Erro ao salvar chave secreta:", err)
			return
		}

		cadastroAgenteSpinner.Stop()

		agentePendenteSpinner := spinner.New(spinner.CharSets[14], 100*time.Millisecond)
		agentePendenteSpinner.Suffix = " Aguardando aprovação do agente..."
		agentePendenteSpinner.FinalMSG = "✔  Agente aprovado com sucesso!"
		agentePendenteSpinner.Color("#FF9200")
		agentePendenteSpinner.Start()

		ps := pubsub.New(
			[]string{pubsub.AgenteUpdatedEvent},
		)

		ps.Subscribe(pubsub.AgenteUpdatedEvent, func(data string) {
			var payload pubsub.AgenteUpdatedPayload

			err := json.Unmarshal([]byte(data), &payload)

			if err != nil {
				fmt.Println("Erro ao parsear payload:", err)
				return
			}

			if payload.DeletedAt != nil {
				err := secret.Delete()

				if err != nil {
					fmt.Println("Erro ao remover chave secreta:", err)
					return
				}

				agentePendenteSpinner.FinalMSG = "✘  Agente removido!\n"
				agentePendenteSpinner.Stop()

				fmt.Println(
					boxStyle.Render(
						"O agente foi removido pelo administrador do sistema.\n" +
							"Você pode tentar cadastrar o agente novamente usando o comando `vrdeploy setup`.",
					),
				)
				return
			}

			switch payload.Situacao {
			case "aprovado":
				agentePendenteSpinner.Stop()
				fmt.Println(
					boxStyle.Render(
						"Você já pode cancelar este processo (Ctrl+C) e usar o comando `vrdeploy start`.",
					),
				)

				return
			case "rejeitado":
				err := secret.Delete()

				if err != nil {
					fmt.Println("Erro ao remover chave secreta:", err)
					return
				}

				agentePendenteSpinner.FinalMSG = "✘  Agente rejeitado!\n"
				agentePendenteSpinner.Stop()
				fmt.Println(
					boxStyle.Render(
						"O agente foi rejeitado pelo administrador do sistema.\n" +
							"Você pode tentar cadastrar o agente novamente usando o comando `vrdeploy setup`.",
					),
				)
				return
			}
		})

		err = ps.Connect()

		if err != nil {
			fmt.Println("Erro ao conectar ao serviço de pubsub:", err)
			return
		}
	},
}

func init() {
	rootCmd.AddCommand(setupCmd)
}
