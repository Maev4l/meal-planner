# Slack Signup Approval — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin approve or reject a new signup directly from the Slack "Access Request" alert via Approve/Reject buttons.

**Architecture:** The existing signup-notification lambda (renamed `user-management` → `user-onboarding`) attaches interactive buttons to its Slack alert. The platform `alerter` responder handles the click (signature + operator allow-list) and republishes the decision to the `alerting-responses` SNS topic. A new `user-approval` lambda, subscribed to that topic (filtered by `source`), applies the decision: approve → set `custom:Approved=true`; reject → `AdminDeleteUser`; on failure → a Slack alert.

**Tech Stack:** Go (AWS Lambda, arm64), aws-sdk-go-v2 (cognitoidentityprovider, sns), `github.com/Maev4l/platform/notifications`, zerolog, Terraform (`Maev4l/terraform-modules` v1.8.0), DynamoDB/Cognito.

## Global Constraints

- Go only; no new third-party modules (all deps already in `packages/functions/go.mod`). Log with **zerolog**. Lambda **arm64**.
- All `terraform-modules` refs pinned to **`v1.8.0`** (purely additive vs v1.7.1 — no breaking change).
- Notification `source` for signups stays **`meal-planner-onboard-users`** (the responder echoes it; the consumer filters on it).
- Button action IDs are exactly **`approve`** and **`reject`** (the consumer switches on these).
- Button `callbackId` = **user email**; button `payload` = **Cognito username** (`event.UserName`).
- Consumer `source` (for its own failure alerts) = **`meal-planner-user-approval`**.
- Zip lambda hash uses the **binary** hash (`filebase64sha256(".../bin/bootstrap")`), never the zip.
- **Commits:** per user instruction, do NOT commit per task. All work lands in a **single final commit** (Task 7). Per-task "Commit" steps are intentionally omitted.

---

## File Structure

- `packages/functions/user-onboarding/` — renamed from `user-management/`. Cognito trigger lambda; `cmd/main.go` gains a testable `signupNotification` + the `Interactive` block; `cmd/main_test.go` new.
- `packages/functions/user-approval/cmd/` — NEW consumer lambda:
  - `main.go` — env + real clients + `lambda.Start`.
  - `decision.go` — wire contract (`decision`), interfaces (`approver`, `notifier`), pure `handleDecision`, SNS `makeHandler`.
  - `cognito.go` — Cognito adapter (`ApproveUser`, `DeleteUser`).
  - `notifier.go` — SNS failure-alert adapter (`Notify`).
  - `decision_test.go` — table tests with fakes.
- `packages/functions/Makefile` — rename user-management targets; add user-approval targets.
- `packages/infrastructure/{functions,iam,sns,cognito}.tf` — rename + module bump + new consumer resources.
- `.claude/backend.md` — docs.

---

### Task 1: Rename `user-management` → `user-onboarding` + bump modules to v1.8.0

Pure mechanical rename (no behavior change) plus the version bump, all in files that change together.

**Files:**
- Rename dir: `packages/functions/user-management/` → `packages/functions/user-onboarding/`
- Modify: `packages/functions/Makefile`
- Modify: `packages/infrastructure/functions.tf`
- Modify: `packages/infrastructure/iam.tf`
- Modify: `packages/infrastructure/cognito.tf`
- Modify: `packages/functions/user-onboarding/cmd/main.go` (header comment only)

**Interfaces:**
- Produces: Terraform `module.user_onboarding` (function `meal-planner-user-onboarding`), `module.user_onboarding_trigger`, `aws_iam_policy.user_onboarding`; Make targets `build-user-onboarding` / `package-user-onboarding`.

- [ ] **Step 1: Move the directory (preserves git history)**

Run:
```bash
git mv packages/functions/user-management packages/functions/user-onboarding
```

- [ ] **Step 2: Update the stale header comment** in `packages/functions/user-onboarding/cmd/main.go`

Replace line 1:
```go
// Alexandria Cognito Lambda - uses common cognito library with custom notification.
```
with:
```go
// meal-planner user-onboarding Cognito lambda — signup triggers (pre_sign_up,
// post_confirmation) using the shared platform users-management handler.
```

- [ ] **Step 3: Rename Make targets** in `packages/functions/Makefile`

Change the `.PHONY` line and every `user-management` occurrence to `user-onboarding`. Result:
```makefile
.PHONY: build build-api build-user-onboarding package package-api package-user-onboarding clean test run-api-local
```
```makefile
build: build-api build-user-onboarding
```
```makefile
package: package-api package-user-onboarding
```
```makefile
# User Onboarding function
build-user-onboarding:
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o user-onboarding/bin/bootstrap ./user-onboarding/cmd

package-user-onboarding: build-user-onboarding
	mkdir -p user-onboarding/dist
	cd user-onboarding/bin && zip ../dist/bootstrap.zip bootstrap
```
```makefile
clean:
	rm -rf api/bin api/dist
	rm -rf user-onboarding/bin user-onboarding/dist
```

- [ ] **Step 4: Update `packages/infrastructure/functions.tf`** — rename the local, the two modules, bump every module `ref` to `v1.8.0`.

Change the local:
```hcl
  user_onboarding_filename = "../functions/user-onboarding/dist/bootstrap.zip"
```
In `module "api"` and `module "api_trigger"`, change `?ref=v1.7.1` → `?ref=v1.8.0`.
Rename `module "user_management"` → `module "user_onboarding"` and set:
```hcl
module "user_onboarding" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-function?ref=v1.8.0"

  function_name = "meal-planner-user-onboarding"
  architecture  = "arm64"
  memory_size   = 128

  additional_policy_arns = [aws_iam_policy.user_onboarding.arn]

  zip = {
    filename = local.user_onboarding_filename
    runtime  = "provided.al2023"
    handler  = "bootstrap"
    hash     = filebase64sha256("../functions/user-onboarding/bin/bootstrap")
  }

  environment_variables = {
    REGION        = var.region
    SNS_TOPIC_ARN = data.aws_sns_topic.alerting.arn
  }
}
```
Rename `module "user_management_trigger"` → `module "user_onboarding_trigger"` and bump + repoint:
```hcl
module "user_onboarding_trigger" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-trigger-cognito?ref=v1.8.0"

  function_name = module.user_onboarding.function_name
  function_arn  = module.user_onboarding.function_arn

  user_pool_id = aws_cognito_user_pool.meal_planner.id
}
```

- [ ] **Step 5: Update `packages/infrastructure/iam.tf`** — rename the policy doc + resource.

Rename `data "aws_iam_policy_document" "user_management"` → `"user_onboarding"` (statements unchanged) and:
```hcl
resource "aws_iam_policy" "user_onboarding" {
  name   = "meal-planner-user-onboarding"
  policy = data.aws_iam_policy_document.user_onboarding.json
}
```

- [ ] **Step 6: Update `packages/infrastructure/cognito.tf`** — repoint the trigger ARNs.

In `lambda_config`:
```hcl
  lambda_config {
    pre_sign_up       = module.user_onboarding.function_arn
    post_confirmation = module.user_onboarding.function_arn
  }
```

- [ ] **Step 7: Verify the Go build still works**

Run:
```bash
make -C packages/functions build
```
Expected: PASS; `packages/functions/user-onboarding/bin/bootstrap` exists, no `user-management` path errors.

- [ ] **Step 8: Verify no `user-management` references remain in living code/config**

Run:
```bash
grep -rn "user-management\|user_management" packages/functions/Makefile packages/infrastructure/*.tf packages/functions/user-onboarding
```
Expected: no output.

- [ ] **Step 9: Verify Terraform parses (downloads v1.8.0 + validates)**

Run:
```bash
terraform -chdir=packages/infrastructure init -upgrade && terraform -chdir=packages/infrastructure validate
```
Expected: `Success! The configuration is valid.` (init pulls `?ref=v1.8.0`.)

---

### Task 2: Producer — Approve/Reject buttons on the signup notification

**Files:**
- Modify: `packages/functions/user-onboarding/cmd/main.go`
- Test: `packages/functions/user-onboarding/cmd/main_test.go` (create)

**Interfaces:**
- Produces: `func signupNotification(event *cognito.PreSignUpEvent) *cognito.NotificationPayload` — the notification now carries `Interactive{CallbackID: email, Payload: username, Actions: [approve, reject]}`.
- Consumes: `github.com/Maev4l/platform/notifications` (`NotificationPayload` is an alias for `notifications.Message`; `notifications.Interactive`, `notifications.Action`).

- [ ] **Step 1: Write the failing test** — `packages/functions/user-onboarding/cmd/main_test.go`

```go
package main

import (
	"strings"
	"testing"

	"github.com/Maev4l/platform/users-management/pkg/cognito"
)

func TestSignupNotification_HasApproveRejectButtons(t *testing.T) {
	msg := signupNotification(&cognito.PreSignUpEvent{Email: "a@b.c", UserName: "U9"})

	if msg.Source != "meal-planner-onboard-users" {
		t.Fatalf("source = %q, want meal-planner-onboard-users", msg.Source)
	}
	if !strings.Contains(msg.Content, "a@b.c") {
		t.Fatalf("content missing email: %q", msg.Content)
	}
	if msg.Interactive == nil {
		t.Fatal("expected Interactive block, got nil")
	}
	if msg.Interactive.CallbackID != "a@b.c" {
		t.Fatalf("callbackId = %q, want a@b.c", msg.Interactive.CallbackID)
	}
	if msg.Interactive.Payload != "U9" {
		t.Fatalf("payload = %q, want U9", msg.Interactive.Payload)
	}
	if len(msg.Interactive.Actions) != 2 {
		t.Fatalf("expected 2 actions, got %d", len(msg.Interactive.Actions))
	}
	if msg.Interactive.Actions[0].ID != "approve" || msg.Interactive.Actions[1].ID != "reject" {
		t.Fatalf("unexpected action ids: %+v", msg.Interactive.Actions)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd packages/functions && go test ./user-onboarding/... -run TestSignupNotification -v
```
Expected: FAIL — `undefined: signupNotification`.

- [ ] **Step 3: Refactor `main.go` to extract `signupNotification` and add the buttons**

Update imports to include `"github.com/Maev4l/platform/notifications"` (keep `context`, `fmt`, the cognito + lambda imports).

Add the named function:
```go
// signupNotification builds the Slack "Access Request" alert for a new signup,
// with Approve/Reject buttons. callbackId carries the email (human label echoed
// back for failure alerts); payload carries the Cognito username (what
// AdminUpdateUserAttributes / AdminDeleteUser need). Action IDs are the contract
// the user-approval consumer switches on.
func signupNotification(event *cognito.PreSignUpEvent) *cognito.NotificationPayload {
	return &cognito.NotificationPayload{
		Source:            "meal-planner-onboard-users",
		SourceDescription: "",
		Target:            "slack",
		Content:           fmt.Sprintf("# 🔐 Access Request\n\n- **User:** `%s`\n- **App:** Meal Planner", event.Email),
		Format:            "markdown",
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
```
Replace the inline hook body with a delegation:
```go
	handler.GetNotification = func(ctx context.Context, event *cognito.PreSignUpEvent, _ *cognito.AppConfig) (*cognito.NotificationPayload, bool) {
		return signupNotification(event), true
	}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
cd packages/functions && go test ./user-onboarding/... -run TestSignupNotification -v
```
Expected: PASS.

---

### Task 3: Consumer core — decision handling logic (TDD)

Pure logic, no AWS clients. This is the unit-tested heart of `user-approval`.

**Files:**
- Create: `packages/functions/user-approval/cmd/decision.go`
- Test: `packages/functions/user-approval/cmd/decision_test.go`

**Interfaces:**
- Produces:
  - `type decision struct { Source, CallbackID, Action, Payload string }` (json tags: `source`, `callbackId`, `action`, `payload`).
  - `type approver interface { ApproveUser(username string) error; DeleteUser(username string) error }`
  - `type notifier interface { Notify(sourceDescription, content string) error }`
  - `func handleDecision(a approver, n notifier, d decision) error`
  - `func makeHandler(a approver, n notifier) func(context.Context, events.SNSEvent) error`
  - consts `actionApprove = "approve"`, `actionReject = "reject"`, `appSource = "meal-planner-onboard-users"`.
- Consumes: `github.com/aws/aws-lambda-go/events`, zerolog.

- [ ] **Step 1: Write the failing tests** — `packages/functions/user-approval/cmd/decision_test.go`

```go
package main

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

type fakeApprover struct {
	approveErr   error
	deleteErr    error
	approvedUser string
	deletedUser  string
}

func (f *fakeApprover) ApproveUser(u string) error { f.approvedUser = u; return f.approveErr }
func (f *fakeApprover) DeleteUser(u string) error  { f.deletedUser = u; return f.deleteErr }

type fakeNotifier struct {
	alerts      int
	lastContent string
}

func (f *fakeNotifier) Notify(_ string, content string) error {
	f.alerts++
	f.lastContent = content
	return nil
}

func TestHandleDecision_Approve(t *testing.T) {
	a, n := &fakeApprover{}, &fakeNotifier{}
	if err := handleDecision(a, n, decision{Action: actionApprove, Payload: "U1", CallbackID: "x@y.z"}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if a.approvedUser != "U1" {
		t.Fatalf("approvedUser = %q, want U1", a.approvedUser)
	}
	if n.alerts != 0 {
		t.Fatalf("expected no alert on success, got %d", n.alerts)
	}
}

func TestHandleDecision_Reject(t *testing.T) {
	a, n := &fakeApprover{}, &fakeNotifier{}
	if err := handleDecision(a, n, decision{Action: actionReject, Payload: "U2", CallbackID: "x@y.z"}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if a.deletedUser != "U2" {
		t.Fatalf("deletedUser = %q, want U2", a.deletedUser)
	}
	if n.alerts != 0 {
		t.Fatalf("expected no alert on success, got %d", n.alerts)
	}
}

func TestHandleDecision_ApproveError_AlertsWithEmail(t *testing.T) {
	a, n := &fakeApprover{approveErr: errors.New("boom")}, &fakeNotifier{}
	err := handleDecision(a, n, decision{Action: actionApprove, Payload: "U3", CallbackID: "fail@y.z"})
	if err == nil {
		t.Fatal("expected error to propagate")
	}
	if n.alerts != 1 {
		t.Fatalf("expected 1 failure alert, got %d", n.alerts)
	}
	if !strings.Contains(n.lastContent, "fail@y.z") {
		t.Fatalf("alert content missing email: %q", n.lastContent)
	}
}

func TestHandleDecision_RejectError_Alerts(t *testing.T) {
	a, n := &fakeApprover{deleteErr: errors.New("boom")}, &fakeNotifier{}
	if err := handleDecision(a, n, decision{Action: actionReject, Payload: "U4", CallbackID: "x@y.z"}); err == nil {
		t.Fatal("expected error to propagate")
	}
	if n.alerts != 1 {
		t.Fatalf("expected 1 failure alert, got %d", n.alerts)
	}
}

func TestHandleDecision_UnknownAction_Ignored(t *testing.T) {
	a, n := &fakeApprover{}, &fakeNotifier{}
	if err := handleDecision(a, n, decision{Action: "nope", Payload: "U5"}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if a.approvedUser != "" || a.deletedUser != "" || n.alerts != 0 {
		t.Fatal("unknown action should be a no-op")
	}
}

func snsEvent(message string) events.SNSEvent {
	return events.SNSEvent{Records: []events.SNSEventRecord{{SNS: events.SNSEntity{Message: message}}}}
}

func TestMakeHandler_IgnoresForeignSource(t *testing.T) {
	a, n := &fakeApprover{}, &fakeNotifier{}
	h := makeHandler(a, n)
	msg := `{"source":"some-other-app","action":"approve","payload":"U1","callbackId":"x@y.z"}`
	if err := h(context.Background(), snsEvent(msg)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if a.approvedUser != "" {
		t.Fatalf("foreign source must be ignored, approved %q", a.approvedUser)
	}
}

func TestMakeHandler_ProcessesOwnSource(t *testing.T) {
	a, n := &fakeApprover{}, &fakeNotifier{}
	h := makeHandler(a, n)
	msg := `{"source":"meal-planner-onboard-users","action":"approve","payload":"U1","callbackId":"x@y.z"}`
	if err := h(context.Background(), snsEvent(msg)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if a.approvedUser != "U1" {
		t.Fatalf("own-source decision not processed, approvedUser = %q", a.approvedUser)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd packages/functions && go test ./user-approval/... -v
```
Expected: FAIL — build error (`decision`, `handleDecision`, `actionApprove` undefined).

- [ ] **Step 3: Implement `decision.go`**

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
	"github.com/rs/zerolog/log"
)

// Action IDs must match the buttons emitted by user-onboarding's signup
// notification (packages/functions/user-onboarding/cmd/main.go).
const (
	actionApprove = "approve"
	actionReject  = "reject"
)

// appSource is this application's notification source. The SNS subscription
// already filters on it (filter_policy), but we re-check in code so a
// misconfigured subscription can never make us act on another app's decision.
const appSource = "meal-planner-onboard-users"

// decision is the shape the platform alerter responder publishes onto the
// alerting-responses topic. The json tags ARE the wire contract with the
// responder; we consume only the fields we act on.
type decision struct {
	Source     string `json:"source"`
	CallbackID string `json:"callbackId"` // the user's email (human label)
	Action     string `json:"action"`     // "approve" | "reject"
	Payload    string `json:"payload"`    // the Cognito username
}

// approver applies an admin decision to a Cognito user.
type approver interface {
	ApproveUser(username string) error
	DeleteUser(username string) error
}

// notifier publishes a best-effort failure alert back to Slack.
type notifier interface {
	Notify(sourceDescription, content string) error
}

// handleDecision applies one decision. On a Cognito failure it emits a Slack
// alert (the responder already optimistically confirmed the click, so a silent
// failure would otherwise be invisible) and returns the error for logging.
func handleDecision(a approver, n notifier, d decision) error {
	switch d.Action {
	case actionApprove:
		if err := a.ApproveUser(d.Payload); err != nil {
			alertFailure(n, d, err)
			return err
		}
		log.Info().Str("email", d.CallbackID).Msg("User approved via Slack")
	case actionReject:
		if err := a.DeleteUser(d.Payload); err != nil {
			alertFailure(n, d, err)
			return err
		}
		log.Info().Str("email", d.CallbackID).Msg("User rejected (deleted) via Slack")
	default:
		log.Warn().Str("action", d.Action).Msg("Unknown decision action; ignoring")
	}
	return nil
}

// alertFailure publishes a Markdown failure alert. The email is fenced as inline
// code (may contain _). Best-effort: a failed alert is only logged.
func alertFailure(n notifier, d decision, cause error) {
	content := fmt.Sprintf(
		"# ⚠️ Signup Decision Failed\n\n- **Action:** %s\n- **User:** `%s`\n- **App:** Meal Planner\n- **Error:** %s",
		d.Action, d.CallbackID, cause.Error())
	if err := n.Notify("", content); err != nil {
		log.Error().Err(err).Msg("Failed to publish decision-failure alert")
	}
}

// makeHandler builds the SNS event handler. It always returns nil: failures are
// alerted + logged, and returning an error would make SNS retry and re-process
// (double-alert). Records are independent, so one bad record never blocks others.
func makeHandler(a approver, n notifier) func(context.Context, events.SNSEvent) error {
	return func(ctx context.Context, e events.SNSEvent) error {
		for _, rec := range e.Records {
			var d decision
			if err := json.Unmarshal([]byte(rec.SNS.Message), &d); err != nil {
				log.Error().Err(err).Msg("Failed to unmarshal decision; skipping record")
				continue
			}
			// Defensive: only act on this app's decisions (the SNS filter policy
			// should already guarantee this).
			if d.Source != appSource {
				log.Warn().Str("source", d.Source).Msg("Decision for a different app; ignoring")
				continue
			}
			if err := handleDecision(a, n, d); err != nil {
				log.Error().Err(err).Str("action", d.Action).Msg("Decision failed")
			}
		}
		return nil
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd packages/functions && go test ./user-approval/... -v
```
Expected: PASS (all 7 tests).

---

### Task 4: Consumer wiring — adapters + entrypoint + Make targets

Thin AWS adapters and the lambda entrypoint (compile-verified; logic already tested in Task 3).

**Files:**
- Create: `packages/functions/user-approval/cmd/cognito.go`
- Create: `packages/functions/user-approval/cmd/notifier.go`
- Create: `packages/functions/user-approval/cmd/main.go`
- Modify: `packages/functions/Makefile`

**Interfaces:**
- Consumes: `approver`, `notifier` from Task 3.
- Produces: `func newCognito(region, userPoolId string) *cognito` (implements `approver`), `func newNotifier(region, topicArn string) *snsNotifier` (implements `notifier`).

- [ ] **Step 1: Implement `cognito.go`**

```go
package main

import (
	"context"
	"errors"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
)

type cognito struct {
	client     *cognitoidentityprovider.Client
	userPoolId string
}

func newCognito(region, userPoolId string) *cognito {
	cfg, _ := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	return &cognito{client: cognitoidentityprovider.NewFromConfig(cfg), userPoolId: userPoolId}
}

// ApproveUser flips custom:Approved to "true". Idempotent: a no-op on an
// already-approved user.
func (c *cognito) ApproveUser(username string) error {
	_, err := c.client.AdminUpdateUserAttributes(context.TODO(), &cognitoidentityprovider.AdminUpdateUserAttributesInput{
		UserPoolId: aws.String(c.userPoolId),
		Username:   aws.String(username),
		UserAttributes: []types.AttributeType{
			{Name: aws.String("custom:Approved"), Value: aws.String("true")},
		},
	})
	return err
}

// DeleteUser removes the pending Cognito user. A reject of an already-deleted
// user is treated as success — the desired end state (user gone) already holds,
// which keeps the action idempotent under Slack re-delivery.
func (c *cognito) DeleteUser(username string) error {
	_, err := c.client.AdminDeleteUser(context.TODO(), &cognitoidentityprovider.AdminDeleteUserInput{
		UserPoolId: aws.String(c.userPoolId),
		Username:   aws.String(username),
	})
	var notFound *types.UserNotFoundException
	if errors.As(err, &notFound) {
		return nil
	}
	return err
}
```

- [ ] **Step 2: Implement `notifier.go`**

(The API's notifier lives under `api/internal/…` and is not importable here, so this small adapter is self-contained — same `notifications.Message` contract.)
```go
package main

import (
	"context"
	"encoding/json"

	"github.com/Maev4l/platform/notifications"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/rs/zerolog/log"
)

type snsNotifier struct {
	client   *sns.Client
	topicArn string
}

func newNotifier(region, topicArn string) *snsNotifier {
	cfg, _ := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	return &snsNotifier{client: sns.NewFromConfig(cfg), topicArn: topicArn}
}

// Notify publishes a Slack-targeted Markdown alert on the shared alerting topic
// using the shared notifications.Message contract.
func (n *snsNotifier) Notify(sourceDescription, content string) error {
	if n.topicArn == "" {
		log.Warn().Msg("SNS_TOPIC_ARN not configured, skipping notification")
		return nil
	}
	body, err := json.Marshal(notifications.Message{
		Target:            "slack",
		Source:            "meal-planner-user-approval",
		SourceDescription: sourceDescription,
		Content:           content,
		Format:            "markdown",
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
```

- [ ] **Step 3: Implement `main.go`**

```go
// meal-planner user-approval lambda — consumes Slack approve/reject decisions
// from the alerting-responses SNS topic and applies them to the Cognito user.
package main

import (
	"os"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	region := os.Getenv("REGION")
	userPoolId := os.Getenv("USER_POOL_ID")
	topicArn := os.Getenv("SNS_TOPIC_ARN")

	a := newCognito(region, userPoolId)
	n := newNotifier(region, topicArn)

	lambda.Start(makeHandler(a, n))
}
```

- [ ] **Step 4: Add Make targets** in `packages/functions/Makefile`

Append `user-approval` to `.PHONY`, the `build` aggregate, and the `package` aggregate:
```makefile
build: build-api build-user-onboarding build-user-approval
```
```makefile
package: package-api package-user-onboarding package-user-approval
```
Add the targets (after the user-onboarding block):
```makefile
# User Approval function
build-user-approval:
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build -ldflags="$(LDFLAGS)" -o user-approval/bin/bootstrap ./user-approval/cmd

package-user-approval: build-user-approval
	mkdir -p user-approval/dist
	cd user-approval/bin && zip ../dist/bootstrap.zip bootstrap
```
Add its artifacts to `clean`:
```makefile
	rm -rf user-approval/bin user-approval/dist
```

- [ ] **Step 5: Tidy modules (in case events subpkg needs recording) and build**

Run:
```bash
cd packages/functions && go mod tidy && make -C . build
```
Expected: PASS; `packages/functions/user-approval/bin/bootstrap` exists.

- [ ] **Step 6: Run the full test suite**

Run:
```bash
cd packages/functions && go test ./...
```
Expected: PASS (Task 2 + Task 3 tests included).

---

### Task 5: Infrastructure — user-approval lambda, SNS trigger, IAM

**Files:**
- Modify: `packages/infrastructure/sns.tf`
- Modify: `packages/infrastructure/functions.tf`
- Modify: `packages/infrastructure/iam.tf`

**Interfaces:**
- Consumes: `data.aws_sns_topic.alerting` (exists), `aws_cognito_user_pool.meal_planner` (exists), the built zip `../functions/user-approval/dist/bootstrap.zip` (Task 4).
- Produces: `module.user_approval`, `module.user_approval_trigger`, `aws_iam_policy.user_approval`, `data.aws_sns_topic.alerting_responses`.

- [ ] **Step 1: Add the responses-topic data source** to `packages/infrastructure/sns.tf`

```hcl
data "aws_sns_topic" "alerting_responses" {
  name = "alerting-responses"
}
```

- [ ] **Step 2: Add the lambda + trigger** to `packages/infrastructure/functions.tf`

Add the local (next to `user_onboarding_filename`):
```hcl
  user_approval_filename = "../functions/user-approval/dist/bootstrap.zip"
```
Append the modules:
```hcl
module "user_approval" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-function?ref=v1.8.0"

  function_name = "meal-planner-user-approval"
  architecture  = "arm64"
  memory_size   = 128

  additional_policy_arns = [aws_iam_policy.user_approval.arn]

  zip = {
    filename = local.user_approval_filename
    runtime  = "provided.al2023"
    handler  = "bootstrap"
    hash     = filebase64sha256("../functions/user-approval/bin/bootstrap")
  }

  environment_variables = {
    REGION        = var.region
    USER_POOL_ID  = aws_cognito_user_pool.meal_planner.id
    SNS_TOPIC_ARN = data.aws_sns_topic.alerting.arn
  }
}

# Subscribes user-approval to the alerter's alerting-responses topic. The filter
# policy matches the "source" message attribute the responder sets, so this
# lambda only sees decisions originating from meal-planner signup alerts.
module "user_approval_trigger" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-trigger-sns?ref=v1.8.0"

  function_name = module.user_approval.function_name
  function_arn  = module.user_approval.function_arn
  topic_arn     = data.aws_sns_topic.alerting_responses.arn
  filter_policy = jsonencode({ source = ["meal-planner-onboard-users"] })
}
```

- [ ] **Step 3: Add the IAM policy** to `packages/infrastructure/iam.tf`

```hcl
#
# User Approval Policy (applies Slack approve/reject decisions)
#
data "aws_iam_policy_document" "user_approval" {
  statement {
    effect    = "Allow"
    actions   = ["cognito-idp:AdminUpdateUserAttributes", "cognito-idp:AdminDeleteUser"]
    resources = [aws_cognito_user_pool.meal_planner.arn]
  }

  statement {
    effect    = "Allow"
    actions   = ["sns:Publish"]
    resources = [data.aws_sns_topic.alerting.arn]
  }
}

resource "aws_iam_policy" "user_approval" {
  name   = "meal-planner-user-approval"
  policy = data.aws_iam_policy_document.user_approval.json
}
```

- [ ] **Step 4: Validate Terraform**

Run:
```bash
cd packages/functions && make -C . package && \
terraform -chdir=../infrastructure init -upgrade && \
terraform -chdir=../infrastructure validate && \
terraform -chdir=../infrastructure fmt -check
```
Expected: `Success! The configuration is valid.` and `fmt -check` prints nothing (run `terraform fmt` if it flags files).

---

### Task 6: Documentation

**Files:**
- Modify: `.claude/backend.md`

- [ ] **Step 1: Rename the trigger reference** in `.claude/backend.md`

Change:
```
- Lambda triggers: `user-management` (pre_sign_up, post_confirmation)
```
to:
```
- Lambda triggers: `user-onboarding` (pre_sign_up, post_confirmation)
```

- [ ] **Step 2: Document the Slack approve/reject flow.** Add this subsection under "### Cognito Configuration" (after the Lambda-triggers line's surrounding block):

```markdown
### Slack signup approval

Self-registration raises a Slack "🔐 Access Request" alert (from the
`user-onboarding` lambda) that now carries **Approve** and **Reject** buttons:

- The alert's `notifications.Message` includes an `Interactive` block —
  `callbackId` = the user's email, `payload` = the Cognito username, actions
  `approve` / `reject`. `source` stays `meal-planner-onboard-users`.
- The platform `alerter` **responder** handles the click (Slack signature +
  operator allow-list), strips the buttons, and republishes the decision to the
  **`alerting-responses`** SNS topic (with a `source` message attribute).
- The new **`user-approval`** lambda subscribes to `alerting-responses`
  (`filter_policy` on `source = ["meal-planner-onboard-users"]`) and applies the
  decision: `approve` → `AdminUpdateUserAttributes custom:Approved=true`;
  `reject` → `AdminDeleteUser` (a fresh signup has no DynamoDB data, so no table
  cleanup). A Cognito failure publishes a "⚠️ Signup Decision Failed" alert to
  `alerting-events`; success is silent (the responder already confirmed the
  click). Reject of an already-deleted user is treated as success.
- **Prereq:** the platform `alerter` responder is deployed with the Slack
  **Interactivity → Request URL** set to the CloudFront custom domain
  `https://platform-slack-responder.isnan.eu/` (NOT the raw `*.lambda-url` URL), the
  responder Function URL at **`AuthType NONE`** (CloudFront OAC cannot SigV4-sign a POST
  body to a Lambda Function URL → every Slack POST 403s with `InvalidSignatureException`;
  fixed in `platform/alerter`), and SSM signing-secret + operator allow-list populated.
- **Known edge (accepted):** for email/password signups the alert fires at
  `pre_sign_up` while `custom:Approved=false` is written at `post_confirmation`;
  an approval clicked in the seconds before the user confirms their email would
  be overwritten back to false. Realistically the admin approves later.
```

- [ ] **Step 3: Verify no stale living-doc references remain**

Run:
```bash
grep -rn "user-management\|user_management" .claude/
```
Expected: no output (historical `docs/superpowers/**` are intentionally left as-is and not scanned here).

---

### Task 7: Final verification + single commit

**Files:** none new — verifies the whole change and lands it in one commit (per user).

- [ ] **Step 1: Full build + test + Terraform validate**

Run:
```bash
cd packages/functions && make -C . package && go test ./... && \
terraform -chdir=../infrastructure validate && terraform -chdir=../infrastructure fmt -check
```
Expected: build OK, all tests PASS, `Success! The configuration is valid.`, `fmt -check` clean.

- [ ] **Step 2: Review the working tree**

Run:
```bash
git -C /Users/jrsue/dev/repos/meal-planner status && git -C /Users/jrsue/dev/repos/meal-planner add -A && git -C /Users/jrsue/dev/repos/meal-planner status
```
Expected: the renamed dir (as renames), new `user-approval/` files, modified `.tf`, Makefile, `.claude/backend.md`, and the spec/plan docs are all staged.

- [ ] **Step 3: Single commit** (the user authorized one commit at the end)

```bash
git -C /Users/jrsue/dev/repos/meal-planner commit -m "feat: Slack approve/reject buttons for signups

Rename user-management lambda -> user-onboarding; add Approve/Reject
buttons to the signup Slack alert; add user-approval lambda consuming
the alerter responses topic to apply the decision (approve => Cognito
custom:Approved=true, reject => AdminDeleteUser). Bump terraform-modules
to v1.8.0.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 4: Confirm**

Run:
```bash
git -C /Users/jrsue/dev/repos/meal-planner log --oneline -1 && git -C /Users/jrsue/dev/repos/meal-planner status
```
Expected: the new commit is HEAD; working tree clean.

---

## Self-Review

- **Spec coverage:** buttons (Task 2), platform responder reuse (docs Task 6, no code), consumer approve/reject/failure-alert (Task 3), reject-deletes-Cognito-only + not-found idempotency (Task 4), infra module+trigger+IAM+filter (Task 5), rename across code/TF/docs (Tasks 1,6), module bump v1.8.0 (Task 1,5), `post_confirmation` race documented (Task 6). All covered.
- **Placeholder scan:** none — every code/step is concrete.
- **Type consistency:** `approver`/`notifier`/`decision`/`handleDecision`/`makeHandler` and consts defined in Task 3; adapters in Task 4 implement the same method sets (`ApproveUser`, `DeleteUser`, `Notify`); `signupNotification` signature consistent between Task 2 impl and test. Action IDs `approve`/`reject` match producer (Task 2) and consumer consts (Task 3). `source` value `meal-planner-onboard-users` matches producer, filter policy (Task 5), and docs.
