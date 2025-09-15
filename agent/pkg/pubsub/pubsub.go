package pubsub

import (
	"agent/pkg/secret"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type EventHandler func(data string)

type PubSub struct {
	SubscribedEvents []string
	handlers         map[string][]EventHandler
	conn             *websocket.Conn
	mu               sync.RWMutex
	connected        bool
}

func New(events []string) *PubSub {
	return &PubSub{
		SubscribedEvents: events,
		handlers:         make(map[string][]EventHandler),
	}
}

func (p *PubSub) Subscribe(event string, handler EventHandler) {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.handlers[event] = append(p.handlers[event], handler)

	if p.connected && p.conn != nil {
		eventSubscription := NewEventSubscription(event)

		if err := p.conn.WriteMessage(websocket.TextMessage, eventSubscription); err != nil {
			log.Printf("Erro ao enviar mensagem de inscrição: %v", err)
		}
	}
}

func (p *PubSub) Connect() error {
	dialer := websocket.Dialer{}

	token, err := secret.Get()

	if err != nil {
		return err
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

	p.mu.Lock()
	p.conn = conn
	p.connected = true
	p.mu.Unlock()

	for _, event := range p.SubscribedEvents {
		eventSubscription := NewEventSubscription(event)

		err := conn.WriteMessage(websocket.TextMessage, eventSubscription)

		if err != nil {
			log.Println("Erro ao enviar mensagem de inscrição:", err)
			return err
		}
	}

	done := make(chan struct{})

	go func() {
		defer close(done)
		defer conn.Close()

		for {
			_, message, err := conn.ReadMessage()

			if err != nil {
				log.Println("Erro ao ler mensagem:", err)
				return
			}

			parsed, err := ParseEventMessage(message)

			if err != nil {
				log.Println("Erro ao parsear mensagem:")
				continue
			}

			if parsed.Type != "event" {
				continue
			}

			p.dispatch(parsed.Event, parsed.Data)
		}
	}()

	go func() {
		ticker := time.NewTicker(1 * time.Minute)

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

	p.mu.Lock()
	p.connected = false
	p.conn = nil
	p.mu.Unlock()

	return nil
}

func (p *PubSub) dispatch(event string, data string) {
	p.mu.RLock()
	handlers := p.handlers[event]
	p.mu.RUnlock()

	for _, handler := range handlers {
		go func(h EventHandler) {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Recovered in handler for event %s: %v", event, r)
				}
			}()
			h(data)
		}(handler)
	}
}

func (p *PubSub) Publish(event string, data string) error {
	p.mu.RLock()
	conn := p.conn
	connected := p.connected
	p.mu.RUnlock()

	if !connected || conn == nil {
		return fmt.Errorf("not connected")
	}

	publishMsg := NewEventPublish(event, data)
	return conn.WriteMessage(websocket.TextMessage, publishMsg)
}
