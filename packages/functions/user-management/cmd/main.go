// Alexandria Cognito Lambda - uses common cognito library with custom notification.
package main

import (
	"context"
	"fmt"

	"github.com/Maev4l/platform/users-management/pkg/cognito"
	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	handler := cognito.NewHandler()

	// Configure meal-planner-specific notification
	handler.GetNotification = func(ctx context.Context, event *cognito.PreSignUpEvent) (*cognito.NotificationPayload, bool) {
		return &cognito.NotificationPayload{
			Source:            "meal-planner-onboard-users",
			SourceDescription: "Meal Planner user sign up (pre)",
			Target:            "slack",
			Content:           fmt.Sprintf("Awaiting registration for %s", event.Email),
		}, true
	}

	lambda.Start(handler.Handle)
}
