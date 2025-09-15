package pty

import "context"

type PtySession struct {
	ctx        context.Context
	cancel     context.CancelFunc
	inputChan  chan []byte
	outputChan chan []byte
	closeChan  chan struct{}
	sessionID  string
}
