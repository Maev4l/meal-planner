// meal-planner user-onboarding Cognito lambda — signup triggers (pre_sign_up,
// post_confirmation) using the shared platform users-management handler.
package main

import (
	"context"
	"fmt"

	"github.com/Maev4l/platform/notifications"
	"github.com/Maev4l/platform/users-management/pkg/cognito"
	"github.com/aws/aws-lambda-go/lambda"
)

// signupNotification builds the Slack "Access Request" alert for a new signup,
// with Approve/Reject buttons. callbackId carries the email (human label echoed
// back for failure alerts); payload carries the Cognito username (what
// AdminUpdateUserAttributes / AdminDeleteUser need). Action IDs are the contract
// the user-approval consumer switches on.
func signupNotification(event *cognito.PreSignUpEvent) *cognito.NotificationPayload {
	return &cognito.NotificationPayload{
		Source: "meal-planner-onboard-users",
		// Empty: the Markdown header already carries the app name, so a context
		// line would just duplicate it.
		SourceDescription: "",
		Target:            "slack",
		// The email is fenced as inline code (may contain _).
		Content: fmt.Sprintf("# 🔐 Access Request\n\n- **User:** `%s`\n- **App:** Meal Planner", event.Email),
		Format:  "markdown",
		Interactive: &notifications.Interactive{
			CallbackID: event.Email,
			Payload:    event.UserName,
			Actions: []notifications.Action{
				{ID: "approve", Label: "Approve", Style: "primary"},
				{ID: "reject", Label: "Reject", Style: "danger"},
			},
		},
	}
}

func main() {
	handler := cognito.NewHandler()

	// Configure meal-planner-specific notification
	handler.GetNotification = func(ctx context.Context, event *cognito.PreSignUpEvent, _ *cognito.AppConfig) (*cognito.NotificationPayload, bool) {
		return signupNotification(event), true
	}

	handler.GetCustomAttributes = func(ctx context.Context, event *cognito.PostConfirmationEvent) ([]cognito.Attribute, error) {
		attrs := []cognito.Attribute{
			{Name: "custom:Approved", Value: "false"},
		}
		return attrs, nil
	}

	lambda.Start(handler.Handle)
}
