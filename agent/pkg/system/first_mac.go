package system

import (
	"errors"
	"net"
)

func MacAddress() (string, error) {
	ifaces, err := net.Interfaces()

	if err != nil {
		return "", err
	}

	for _, ifi := range ifaces {
		if ifi.Flags&net.FlagUp == 0 || ifi.Flags&net.FlagLoopback != 0 {
			continue
		}

		mac := ifi.HardwareAddr.String()

		if mac != "" {
			return mac, nil
		}
	}

	return "", errors.New("no non-loopback MAC found")
}
