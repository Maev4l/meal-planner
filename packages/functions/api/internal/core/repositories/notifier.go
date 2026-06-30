package repositories

import (
	"context"
	"encoding/json"

	"github.com/Maev4l/platform/notifications"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/rs/zerolog/log"
)

type notifier struct {
	client   *sns.Client
	topicArn string
}

func NewNotifier() *notifier {
	cfg, _ := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	return &notifier{
		client:   sns.NewFromConfig(cfg),
		topicArn: snsTopicArn,
	}
}

// Notify publishes a Slack-targeted alert onto the shared alerting topic using
// the shared notifications.Message contract (so the wire shape can't drift from
// the alerter consumer). Source/Target are fixed for this producer.
func (n *notifier) Notify(sourceDescription, content string) error {
	if n.topicArn == "" {
		log.Warn().Msg("SNS_TOPIC_ARN not configured, skipping notification")
		return nil
	}
	body, err := json.Marshal(notifications.Message{
		Target:            "slack",
		Source:            "meal-planner-api",
		SourceDescription: sourceDescription,
		Content:           content,
		// Pin plain rendering: this content is literal text, and the alerter
		// now defaults to Markdown.
		Format: "plain",
	})
	if err != nil {
		return err
	}
	_, err = n.client.Publish(context.TODO(), &sns.PublishInput{
		TargetArn: aws.String(n.topicArn),
		Message:   aws.String(string(body)),
	})
	return err
}
