package pubsub

import "encoding/json"

const (
	// Subscriptions
	AgenteUpdatedEvent      = "agente:updated"
	PtySessionStartedEvent  = "pty:session_started"
	PtyInputEvent           = "pty:input"
	ImplantacaoCreatedEvent = "implantacao:created"
	// Publishes
	PtyOutputEvent       = "pty:output"
	PtySessionEndedEvent = "pty:session_ended"
)

type EventMessage struct {
	Type  string `json:"type"`
	Event string `json:"event"`
	Data  string `json:"data"`
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

func NewEventPublish(event string, data string) []byte {
	eventPublish := EventMessage{
		Type:  "publish",
		Event: event,
		Data:  data,
	}

	msg, err := json.Marshal(eventPublish)

	if err != nil {
		return nil
	}

	return msg
}

func ParseEventMessage(message []byte) (*EventMessage, error) {
	var eventMessage EventMessage

	err := json.Unmarshal(message, &eventMessage)

	if err != nil {
		return nil, err
	}

	return &eventMessage, nil
}
