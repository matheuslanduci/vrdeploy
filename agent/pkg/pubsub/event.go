package pubsub

import "encoding/json"

const (
	AgenteUpdatedEvent = "agente:updated"
)

type EventMessage struct {
	Type  string          `json:"type"`
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data"`
}

type SubscribeToEvent struct {
	Type  string `json:"type"`
	Event string `json:"event"`
}

func NewEventSubscription(event string) []byte {
	eventSubscription := SubscribeToEvent{
		Type:  "subscribe",
		Event: event,
	}

	data, err := json.Marshal(eventSubscription)

	if err != nil {
		return nil
	}

	return data
}

func ParseEventMessage(message []byte) (*EventMessage, error) {
	var eventMessage EventMessage

	err := json.Unmarshal(message, &eventMessage)

	if err != nil {
		return nil, err
	}

	return &eventMessage, nil
}
