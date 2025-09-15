package pubsub

type PtyOutputPayload struct {
	SessionID string `json:"session_id"`
	Output    []byte `json:"output"`
}

type PtyInputPayload struct {
	IdAgente int    `json:"idAgente"`
	Input    string `json:"input"`
}

type PtySessionStartedPayload struct {
	IdAgente int `json:"idAgente"`
}
