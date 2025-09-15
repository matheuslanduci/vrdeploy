package pubsub

type PtyOutputPayload struct {
	SessionID string `json:"session_id"`
	Output    []byte `json:"output"`
}

type PtyInputPayload struct {
	SessionID string `json:"session_id"`
	Input     []byte `json:"input"`
}

type PtySessionStartedPayload struct {
	SessionID string `json:"sessionId"`
}
