package ports

// Notifier publishes a human-facing alert (e.g. Slack via the alerting topic).
type Notifier interface {
	Notify(sourceDescription, content string) error
}
