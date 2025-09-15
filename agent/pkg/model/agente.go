package model

type Agente struct {
	ID           int    `json:"id"`
	ChaveSecreta string `json:"chaveSecreta"`
	Situacao     string `json:"situacao"`
}
