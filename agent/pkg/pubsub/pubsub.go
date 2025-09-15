package pubsub

import (
	"agent/pkg/secret"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

type PubSub struct {
	SubscribedEvents []string
}

func New(events []string) *PubSub {
	return &PubSub{
		SubscribedEvents: events,
	}
}

func (p *PubSub) Connect(
	onMessage func(event string, payload json.RawMessage),
) {
	dialer := websocket.Dialer{}

	token, err := secret.Get()

	if err != nil {
		return
	}

	url := "ws://localhost:3000/pubsub/agente"

	requestHeader := http.Header{}
	requestHeader.Add("X-Agente-Token", token)

	conn, resp, err := dialer.Dial(url, requestHeader)

	if err != nil {
		if resp != nil {
			log.Printf("Código HTTP: %d", resp.StatusCode)
			log.Fatalf("Erro ao conectar ao WebSocket: %s (código HTTP: %d)", err, resp.StatusCode)
		}

		log.Fatalf("Erro ao conectar ao WebSocket: %s", err)
	}

	defer conn.Close()

	done := make(chan struct{})

	for _, event := range p.SubscribedEvents {
		eventSubscription := NewEventSubscription(event)

		err := conn.WriteMessage(websocket.TextMessage, eventSubscription)

		if err != nil {
			log.Println("Erro ao enviar mensagem de inscrição:", err)
			return
		}
	}

	go func() {
		defer close(done)

		for {
			_, message, err := conn.ReadMessage()

			if err != nil {
				log.Println("Erro ao ler mensagem:", err)
				return
			}

			parsed, err := ParseEventMessage(message)

			if err != nil {
				log.Println("Erro ao parsear mensagem:", err)
				return
			}

			onMessage(parsed.Event, parsed.Data)

		}
	}()

	go func() {
		ticker := time.NewTicker(15 * time.Second)

		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if err := conn.WriteMessage(websocket.TextMessage, Heartbeat()); err != nil {
					log.Println("Erro ao enviar ping:", err)
					return
				}
			case <-done:
				return
			}
		}
	}()

	<-done
}
