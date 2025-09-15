package pty

import (
	"agent/pkg/pubsub"
	"context"
	"encoding/json"
	"fmt"
	"sync"
)

type PtyManager struct {
	sessions map[string]*PtySession
	mu       sync.RWMutex
	ps       *pubsub.PubSub
}

func NewPtyManager(ps *pubsub.PubSub) *PtyManager {
	return &PtyManager{
		sessions: make(map[string]*PtySession),
		ps:       ps,
	}
}

func (pm *PtyManager) HandleSessionStarted(ctx context.Context) pubsub.EventHandler {
	return func(data string) {
		var payload pubsub.PtySessionStartedPayload

		err := json.Unmarshal([]byte(data), &payload)

		if err != nil {
			fmt.Println("Erro ao parsear payload:", err)
			return
		}

		pm.mu.Lock()
		defer pm.mu.Unlock()

		if _, exists := pm.sessions[payload.SessionID]; exists {
			fmt.Println("Sessão já existe:", payload.SessionID)
			return
		}

		ctx, cancel := context.WithCancel(ctx)

		session := &PtySession{
			ctx:        ctx,
			cancel:     cancel,
			inputChan:  make(chan []byte, 100),
			outputChan: make(chan []byte, 100),
			closeChan:  make(chan struct{}),
			sessionID:  payload.SessionID,
		}

		pm.sessions[payload.SessionID] = session

		go pm.handleOutput(session)

		go func() {
			defer func() {
				pm.mu.Lock()
				delete(pm.sessions, payload.SessionID)
				pm.mu.Unlock()

				pm.ps.Publish(pubsub.PtySessionEndedEvent, payload.SessionID)
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
			fmt.Println("Erro ao parsear payload:", err)
			return
		}

		pm.mu.RLock()
		session, exists := pm.sessions[payload.SessionID]
		pm.mu.RUnlock()

		if !exists {
			fmt.Println("Sessão não encontrada:", payload.SessionID)
			return
		}

		select {
		case session.inputChan <- []byte(payload.Input):
		case <-session.ctx.Done():
			fmt.Println("Sessão fechada:", payload.SessionID)
		default:
			fmt.Println("Canal de input cheio, descartando dados para sessão:", payload.SessionID)
		}
	}
}

func (pm *PtyManager) handleOutput(session *PtySession) {
	for {
		select {
		case <-session.closeChan:
			return
		case output := <-session.outputChan:
			payload := pubsub.PtyOutputPayload{
				SessionID: session.sessionID,
				Output:    output,
			}

			outputJSON, _ := json.Marshal(payload)

			err := pm.ps.Publish(pubsub.PtyOutputEvent, string(outputJSON))

			if err != nil {
				fmt.Println("Erro ao publicar saída do pty:", err)
				return
			}
		}
	}
}
