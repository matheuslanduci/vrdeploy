package secret

import "github.com/zalando/go-keyring"

const (
	service = "br.com.vrsoft.vrdeploy"
	user    = "agent"
)

func Get() (string, error) {
	return keyring.Get(service, user)
}

func Set(secret string) error {
	return keyring.Set(service, user, secret)
}

func Delete() error {
	return keyring.Delete(service, user)
}
