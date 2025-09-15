package pubsub

type AgenteUpdatedPayload struct {
	Situacao  string  `json:"situacao"`
	DeletedAt *string `json:"deletedAt"`
}
