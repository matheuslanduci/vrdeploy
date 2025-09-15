package pubsub

import "encoding/json"

type HeartbeatMessage struct {
	Type string `json:"type"`
}

func Heartbeat() []byte {
	data, err := json.Marshal(HeartbeatMessage{Type: "heartbeat"})

	if err != nil {
		return nil
	}

	return data
}
