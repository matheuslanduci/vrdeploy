package api

import (
	"bytes"
	"encoding/json"
	"net/http"
)

type CadastrarAgenteRequest struct {
	EnderecoMac        string `json:"enderecoMac"`
	SistemaOperacional string `json:"sistemaOperacional"`
}

type CadastrarAgenteResponse struct {
	ID           int    `json:"id"`
	ChaveSecreta string `json:"chaveSecreta"`
}

func CadastrarAgente(req CadastrarAgenteRequest) (CadastrarAgenteResponse, error) {
	var resp CadastrarAgenteResponse

	data, err := json.Marshal(req)

	if err != nil {
		return resp, err
	}

	httpClient := http.Client{}

	request, err := http.NewRequest(
		http.MethodPost,
		"http://localhost:3000/api/agente",
		bytes.NewBuffer(data),
	)

	if err != nil {
		return resp, err
	}

	request.Header.Set("Content-Type", "application/json")

	response, err := httpClient.Do(request)

	if err != nil {
		return resp, err
	}

	defer response.Body.Close()

	err = json.NewDecoder(response.Body).Decode(&resp)

	return resp, err
}
