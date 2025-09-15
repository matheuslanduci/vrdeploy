package system

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func AddToStartup() error {
	executable, err := os.Executable()

	if err != nil {
		return err
	}

	switch runtime.GOOS {
	case "windows":
		return addToStartupWindows(executable)
	case "linux":
		return addToStartupLinux(executable)
	default:
		return fmt.Errorf("sistema operacional não suportado: %s", runtime.GOOS)
	}
}

func RemoveFromStartup() error {
	executable, err := os.Executable()

	if err != nil {
		return err
	}

	switch runtime.GOOS {
	case "windows":
		return removeFromStartupWindows(executable)
	case "linux":
		return removeFromStartupLinux(executable)
	default:
		return fmt.Errorf("sistema operacional não suportado: %s", runtime.GOOS)
	}
}

func addToStartupWindows(executable string) error {
	appName := filepath.Base(executable)

	appName = strings.TrimSuffix(appName, filepath.Ext(appName))

	cmd := exec.Command("reg", "add",
		"HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
		"/v", appName,
		"/t", "REG_SZ",
		"/d", executable,
		"/f")

	return cmd.Run()
}

func addToStartupLinux(executable string) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	appName := filepath.Base(executable)
	serviceName := fmt.Sprintf("%s.service", appName)
	servicePath := filepath.Join(homeDir, ".config", "systemd", "user", serviceName)

	serviceContent := fmt.Sprintf(`[Unit]
Description=%s
After=graphical-session.target

[Service]
Type=simple
ExecStart=%s
Restart=on-failure

[Install]
WantedBy=default.target
`, appName, executable)

	systemdDir := filepath.Dir(servicePath)
	if err := os.MkdirAll(systemdDir, 0755); err != nil {
		return err
	}

	if err := os.WriteFile(servicePath, []byte(serviceContent), 0644); err != nil {
		return err
	}

	if err := exec.Command("systemctl", "--user", "daemon-reload").Run(); err != nil {
		return err
	}

	return exec.Command("systemctl", "--user", "enable", serviceName).Run()
}

func removeFromStartupWindows(executable string) error {
	appName := filepath.Base(executable)

	appName = strings.TrimSuffix(appName, filepath.Ext(appName))

	cmd := exec.Command("reg", "delete",
		"HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
		"/v", appName, "/f")

	return cmd.Run()
}

func removeFromStartupLinux(executable string) error {
	appName := filepath.Base(executable)
	serviceName := fmt.Sprintf("%s.service", appName)

	exec.Command("systemctl", "--user", "disable", serviceName).Run()
	exec.Command("systemctl", "--user", "stop", serviceName).Run()

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	servicePath := filepath.Join(homeDir, ".config", "systemd", "user", serviceName)
	return os.Remove(servicePath)
}
