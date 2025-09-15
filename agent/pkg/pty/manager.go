package pty

import (
	"agent/pkg/pubsub"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
)

type PtyManager struct {
	sessions map[int]*PtySession
	mu       sync.RWMutex
	ps       *pubsub.PubSub
}

func NewPtyManager(ps *pubsub.PubSub) *PtyManager {
	return &PtyManager{
		sessions: make(map[int]*PtySession),
		ps:       ps,
	}
}

// TODO: Change to use sessionId instead of idAgente
func (pm *PtyManager) HandleSessionStarted(ctx context.Context) pubsub.EventHandler {
	return func(data string) {
		fmt.Println("Iniciando nova sessão pty com dados:", data)

		var payload pubsub.PtySessionStartedPayload

		err := json.Unmarshal([]byte(data), &payload)

		if err != nil {
			fmt.Println("Erro ao parsear payload:", err)
			return
		}

		pm.mu.Lock()
		defer pm.mu.Unlock()

		if _, exists := pm.sessions[payload.IdAgente]; exists {
			fmt.Println("Sessão já existe:", payload.IdAgente)
			return
		}

		ctx, cancel := context.WithCancel(ctx)

		session := &PtySession{
			ctx:        ctx,
			cancel:     cancel,
			inputChan:  make(chan []byte, 100),
			outputChan: make(chan []byte, 100),
			closeChan:  make(chan struct{}),
			idAgente:   payload.IdAgente,
		}

		pm.sessions[payload.IdAgente] = session

		go pm.handleOutput(session)

		go func() {
			defer func() {
				pm.mu.Lock()
				delete(pm.sessions, payload.IdAgente)
				pm.mu.Unlock()

				log.Println("Sessão pty encerrada:", payload.IdAgente)

				pm.ps.Publish(pubsub.PtySessionEndedEvent, fmt.Sprintf("%d", payload.IdAgente))
			}()

			Start(ctx, session.inputChan, session.outputChan, session.closeChan)
		}()
	}
}

func (pm *PtyManager) HandleInput() pubsub.EventHandler {
	return func(data string) {
		var payload pubsub.PtyInputPayload

		err := json.Unmarshal([]byte(data), &payload)

		if err != nil {
			fmt.Println("Erro ao parsear payload:", err, data)
			return
		}

		pm.mu.RLock()
		session, exists := pm.sessions[payload.IdAgente]
		pm.mu.RUnlock()

		if !exists {
			fmt.Println("Sessão não encontrada:", payload.IdAgente)
			return
		}

		log.Printf("Recebido input: %s", payload.Input)

		select {
		case session.inputChan <- []byte(payload.Input):
		case <-session.ctx.Done():
			fmt.Println("Sessão fechada:", payload.IdAgente)
		default:
			fmt.Println(
				"Canal de input cheio, descartando dados para sessão:",
				payload.IdAgente,
			)
		}
	}
}

func (pm *PtyManager) handleOutput(session *PtySession) {
	for {
		select {
		case <-session.closeChan:
			return
		case output := <-session.outputChan:
			err := pm.ps.Publish(pubsub.PtyOutputEvent, string(output))

			if err != nil {
				fmt.Println("Erro ao publicar saída do pty:", err)
				return
			}
		}
	}
}
