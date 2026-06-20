# Invite Auto-Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-approve any unapproved user who redeems a valid invite (skipping the manual admin gate), while keeping the gate for uninvited self-registrants.

**Architecture:** Open the two invite redeem-side endpoints to authenticated-but-unapproved callers; on a validated redeem the API flips Cognito `custom:Approved=true` and publishes a 2nd Slack alert via the shared `notifications` module. The frontend force-refreshes its token after redeem so the new approval claim takes effect immediately.

**Tech Stack:** Go (Gin, AWS SDK v2 — Cognito + SNS), React 18 + Amplify, Terraform.

**Spec:** `docs/superpowers/specs/2026-06-20-invite-auto-approval-design.md`.

**Prerequisite:** Plan A (`platform` repo) released `notifications/v1.0.0`. Task 1 below consumes it.

**Module:** single Go module `isnan.eu/meal-planner/functions` at `packages/functions/`. Build/test: `make -C packages/functions test` (`go test ./...`). All Go paths below are relative to `packages/functions/`.

---

## File Structure

- **Modify** `api/internal/core/ports/idp.go` — add `ApproveUser` to `PlannerIdP`.
- **Create** `api/internal/core/ports/notifier.go` — new `Notifier` port.
- **Modify** `api/internal/core/repositories/cognito.go` — implement `ApproveUser`.
- **Create** `api/internal/core/repositories/notifier.go` — SNS adapter over `notifications.Message`.
- **Modify** `api/internal/core/repositories/env.go` — add `snsTopicArn`.
- **Modify** `api/internal/core/services/service.go` — add `notifier` field + 3rd `New` param.
- **Modify** `api/internal/core/services/invites.go` — auto-approval in `RedeemInvite`.
- **Modify** `api/internal/core/ports/services.go` — extend `RedeemInvite` signature.
- **Modify** `api/internal/core/handlers/invites.go` — pass username + approved into the service.
- **Modify** `api/internal/core/handlers/helper.go` — add `RequireAuthenticated`.
- **Create** `api/internal/core/handlers/middleware_test.go` — middleware regression tests.
- **Modify** `api/cmd/api/main.go` — wire notifier; regroup the two redeem routes.
- **Modify** `api/internal/core/services/fakes_test.go` — `fakeIdP.ApproveUser`, `fakeNotifier`.
- **Modify** `api/internal/core/services/invites_test.go` — update calls + new approval tests.
- **Modify** `web-client-v2/src/contexts/AuthContext.jsx` — `refreshSession`.
- **Modify** `web-client-v2/src/pages/InvitePage.jsx` — refresh after redeem; retire "awaiting".
- **Modify** `infrastructure/iam.tf`, `infrastructure/functions.tf` — IAM + env.
- **Modify** `.claude/backend.md`, `.claude/ui.md` — docs.

---

### Task 1: Consume the shared `notifications` module

**Files:** `packages/functions/go.mod`, `go.sum`

- [ ] **Step 1: Add the dependency**

```bash
cd /Users/jrsue/dev/repos/meal-planner/packages/functions
go get github.com/Maev4l/platform/notifications@v1.0.0
go get github.com/Maev4l/platform/users-management@v1.3.0   # optional: align on aliased version
go mod tidy
```
Expected: `go.mod` requires `github.com/Maev4l/platform/notifications v1.0.0`.

- [ ] **Step 2: Verify build**

Run: `make -C /Users/jrsue/dev/repos/meal-planner/packages/functions build`
Expected: PASS (no code uses it yet; this just locks the dep).

- [ ] **Step 3: Commit**

```bash
git add packages/functions/go.mod packages/functions/go.sum
git commit -m "build(api): add shared notifications module dependency"
```

---

### Task 2: Add `ApproveUser` to the IdP port + Cognito adapter + fake

**Files:**
- Modify: `api/internal/core/ports/idp.go`
- Modify: `api/internal/core/repositories/cognito.go`
- Modify: `api/internal/core/services/fakes_test.go`

- [ ] **Step 1: Extend the port**

`api/internal/core/ports/idp.go` — add the method:
```go
type PlannerIdP interface {
	GetUser(name string) (*domain.User, error)
	ApproveUser(username string) error
}
```

- [ ] **Step 2: Implement in the Cognito adapter**

Append to `api/internal/core/repositories/cognito.go` (imports `aws`, `cognitoidentityprovider`, `types`, `log` already present):
```go
// ApproveUser flips custom:Approved to "true". Called only from the invite-redeem
// path, so possessing a valid invite is what grants approval. Idempotent: setting
// "true" on an already-approved user is a harmless no-op.
func (i *idp) ApproveUser(username string) error {
	_, err := i.client.AdminUpdateUserAttributes(context.TODO(), &cognitoidentityprovider.AdminUpdateUserAttributesInput{
		UserPoolId: aws.String(userPoolId),
		Username:   aws.String(username),
		UserAttributes: []types.AttributeType{
			{Name: aws.String("custom:Approved"), Value: aws.String("true")},
		},
	})
	if err != nil {
		log.Error().Msgf("Failed to approve user '%s': %s", username, err.Error())
		return err
	}
	return nil
}
```

- [ ] **Step 3: Implement in the fake**

In `api/internal/core/services/fakes_test.go`, replace the `fakeIdP` block:
```go
// fakeIdP satisfies ports.PlannerIdP.
type fakeIdP struct {
	users    map[string]*domain.User
	approved []string // usernames passed to ApproveUser
}

func (f *fakeIdP) GetUser(name string) (*domain.User, error) { return f.users[name], nil }
func (f *fakeIdP) ApproveUser(username string) error {
	f.approved = append(f.approved, username)
	return nil
}
```

- [ ] **Step 4: Verify build + existing tests**

Run: `make -C /Users/jrsue/dev/repos/meal-planner/packages/functions test`
Expected: PASS (nothing calls `ApproveUser` yet; the fake satisfies the wider interface).

- [ ] **Step 5: Commit**

```bash
git add packages/functions/api/internal/core/ports/idp.go packages/functions/api/internal/core/repositories/cognito.go packages/functions/api/internal/core/services/fakes_test.go
git commit -m "feat(api): add ApproveUser to IdP port and Cognito adapter"
```

---

### Task 3: Add the `Notifier` port, SNS adapter, and wire it into the service

**Files:**
- Create: `api/internal/core/ports/notifier.go`
- Create: `api/internal/core/repositories/notifier.go`
- Modify: `api/internal/core/repositories/env.go`
- Modify: `api/internal/core/services/service.go`
- Modify: `api/internal/core/services/fakes_test.go`
- Modify: all `New(repo, &fakeIdP{})` call sites in `*_test.go`
- Modify: `api/cmd/api/main.go`

- [ ] **Step 1: Create the port**

`api/internal/core/ports/notifier.go`:
```go
package ports

// Notifier publishes a human-facing alert (e.g. Slack via the alerting topic).
type Notifier interface {
	Notify(sourceDescription, content string) error
}
```

- [ ] **Step 2: Create the SNS adapter**

`api/internal/core/repositories/notifier.go`:
```go
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

- [ ] **Step 3: Add the env var**

`api/internal/core/repositories/env.go` — add:
```go
var snsTopicArn string = os.Getenv("SNS_TOPIC_ARN")
```

- [ ] **Step 4: Extend the service constructor**

`api/internal/core/services/service.go` — replace the struct + `New`:
```go
type service struct {
	repo     ports.PlannerRepository
	idp      ports.PlannerIdP
	notifier ports.Notifier
}

func New(repo ports.PlannerRepository, idp ports.PlannerIdP, notifier ports.Notifier) *service {
	return &service{
		repo:     repo,
		idp:      idp,
		notifier: notifier,
	}
}
```

- [ ] **Step 5: Add the fake notifier**

In `api/internal/core/services/fakes_test.go`, add:
```go
// fakeNotifier satisfies ports.Notifier.
type fakeNotifier struct{ sent []string }

func (f *fakeNotifier) Notify(sourceDescription, content string) error {
	f.sent = append(f.sent, content)
	return nil
}
```

- [ ] **Step 6: Update all existing `New(...)` call sites in tests**

Run:
```bash
cd /Users/jrsue/dev/repos/meal-planner/packages/functions
grep -rl 'New(repo, &fakeIdP{})' api/internal/core/services/ | xargs sed -i '' 's/New(repo, &fakeIdP{})/New(repo, \&fakeIdP{}, \&fakeNotifier{})/g'
```
Then verify none remain:
```bash
grep -rn 'New(repo, &fakeIdP{})' api/internal/core/services/ ; echo "exit: $?"
```
Expected: no matches.

- [ ] **Step 7: Wire the notifier in main**

`api/cmd/api/main.go` — update the construction block:
```go
	r := repositories.NewDynamoDB()
	c := repositories.NewCognito()
	n := repositories.NewNotifier()
	s := services.New(r, c, n)
	h := handlers.NewHTTPHandler(s)
```

- [ ] **Step 8: Verify build + tests**

Run: `make -C /Users/jrsue/dev/repos/meal-planner/packages/functions test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/functions/api packages/functions/go.mod packages/functions/go.sum
git commit -m "feat(api): add SNS Notifier port/adapter and wire into service"
```

---

### Task 4: Auto-approve on redeem (TDD)

**Files:**
- Modify: `api/internal/core/ports/services.go`
- Modify: `api/internal/core/services/invites.go:116-171`
- Modify: `api/internal/core/handlers/invites.go:58-71`
- Modify: `api/internal/core/services/invites_test.go`

- [ ] **Step 1: Extend the service-interface signature**

`api/internal/core/ports/services.go` — change the `RedeemInvite` line to:
```go
	RedeemInvite(requesterId string, requesterName string, requesterUsername string, code string, approved bool) (*domain.Group, bool, error)
```

- [ ] **Step 2: Refactor the signature in impl + handler (no behavior yet)**

In `api/internal/core/services/invites.go`, change the function signature only:
```go
func (s *service) RedeemInvite(requesterId, requesterName, requesterUsername, code string, approved bool) (*domain.Group, bool, error) {
```
(Leave the body as-is for now; the two new params are unused — Go allows unused params.)

In `api/internal/core/handlers/invites.go`, update the `RedeemInvite` handler call:
```go
	group, already, err := hdl.svc.RedeemInvite(info.userId, info.name, info.userName, code, info.approved)
```
(`info.userName` is `cognito:username` — the Cognito Username for `ApproveUser`; `info.approved` is the token claim.)

Update the four existing redeem calls in `api/internal/core/services/invites_test.go` to the new signature (all join cases use `approved=false`, a placeholder username):
- `TestRedeemInvite_NewMemberJoins` (line ~114): `svc.RedeemInvite("BOB", "Bob", "bob-user", "C1", false)`
- `TestRedeemInvite_ExpiredRejected` (line ~132): `svc.RedeemInvite("BOB", "Bob", "bob-user", "C1", false)`
- `TestRedeemInvite_UnknownIsNotFound` (line ~139): `svc.RedeemInvite("BOB", "Bob", "bob-user", "NOPE", false)`
- `TestRedeemInvite_AdminRedeemingOwnLinkKeepsAdmin` (line ~152): `svc.RedeemInvite("ADMIN", "Admin", "admin-user", "C1", false)`

Verify it still builds + passes: `make -C /Users/jrsue/dev/repos/meal-planner/packages/functions test` → PASS.

- [ ] **Step 3: Write the failing approval tests**

Append to `api/internal/core/services/invites_test.go`:
```go
func TestRedeemInvite_UnapprovedIsApprovedAndAlerted(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	now := time.Now().UTC()
	exp := now.Add(time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &exp})
	idp := &fakeIdP{}
	notif := &fakeNotifier{}
	svc := New(repo, idp, notif)

	group, already, err := svc.RedeemInvite("BOB", "Bob", "bob-user", "C1", false)
	if err != nil || already {
		t.Fatalf("expected fresh join, got already=%v err=%v", already, err)
	}
	if group.Id != "G1" {
		t.Fatalf("bad group: %+v", group)
	}
	if len(idp.approved) != 1 || idp.approved[0] != "bob-user" {
		t.Fatalf("expected ApproveUser('bob-user'), got %v", idp.approved)
	}
	if len(notif.sent) != 1 {
		t.Fatalf("expected one alert, got %v", notif.sent)
	}
}

func TestRedeemInvite_AlreadyApprovedNoApproveNoAlert(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	now := time.Now().UTC()
	exp := now.Add(time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &exp})
	idp := &fakeIdP{}
	notif := &fakeNotifier{}
	svc := New(repo, idp, notif)

	if _, _, err := svc.RedeemInvite("BOB", "Bob", "bob-user", "C1", true); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(idp.approved) != 0 {
		t.Fatalf("approved caller must not be re-approved, got %v", idp.approved)
	}
	if len(notif.sent) != 0 {
		t.Fatalf("approved caller must not alert, got %v", notif.sent)
	}
}

func TestRedeemInvite_AlreadyMemberUnapprovedStillApproved(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	repo.SaveMember(&domain.Member{Id: "BOB", Name: "Bob", Role: roles.Member, GroupId: "G1", GroupName: "Family"})
	now := time.Now().UTC()
	exp := now.Add(time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &exp})
	idp := &fakeIdP{}
	notif := &fakeNotifier{}
	svc := New(repo, idp, notif)

	_, already, err := svc.RedeemInvite("BOB", "Bob", "bob-user", "C1", false)
	if err != nil || !already {
		t.Fatalf("expected already=true, got already=%v err=%v", already, err)
	}
	if len(idp.approved) != 1 {
		t.Fatalf("unapproved existing member must still be approved, got %v", idp.approved)
	}
}
```

- [ ] **Step 4: Run to verify they fail**

Run: `cd /Users/jrsue/dev/repos/meal-planner/packages/functions && go test ./api/internal/core/services/ -run TestRedeemInvite_ -v`
Expected: the three new tests FAIL (no approval/alert happens yet).

- [ ] **Step 5: Implement auto-approval**

Replace the whole `RedeemInvite` function body in `api/internal/core/services/invites.go` with:
```go
func (s *service) RedeemInvite(requesterId, requesterName, requesterUsername, code string, approved bool) (*domain.Group, bool, error) {
	// Capture once so expiry check and CreatedAt timestamps are consistent.
	now := time.Now().UTC()

	inv, err := s.repo.GetInvite(code)
	if err != nil {
		return nil, false, err
	}
	if inv == nil || inv.IsExpired(now) {
		return nil, false, domain.ErrNotFound
	}

	group, err := s.repo.GetGroup(inv.GroupId)
	if err != nil {
		return nil, false, err
	}
	if group == nil {
		// Valid invite but its group is gone — data inconsistency, warn and surface as not-found.
		log.Warn().Msgf("Invite '%s' references missing group '%s'.", code, inv.GroupId)
		return nil, false, domain.ErrNotFound
	}

	// Ensure membership (idempotent; never rewrites an existing record, so an
	// admin redeeming their own link is never downgraded).
	existing, err := s.repo.GetMember(group.Id, requesterId)
	if err != nil {
		return nil, false, err
	}
	alreadyMember := existing != nil
	if !alreadyMember {
		member := &domain.Member{
			Id: requesterId, Name: requesterName, CreatedAt: &now,
			Role: roles.Member, GroupId: group.Id, GroupName: group.Name,
		}
		created, err := s.repo.CreateMemberIfNotExists(member)
		if err != nil {
			return nil, false, err
		}
		if created {
			schedule := &domain.MemberDefaultSchedule{
				ScheduleBase: domain.ScheduleBase{
					MemberId: member.Id, MemberName: member.Name,
					GroupId: group.Id, GroupName: group.Name, CreatedAt: &now,
				},
				WeeklySchedule: domain.SystemDefaultWeeklySchedule,
			}
			if err := s.repo.SaveMemberDefaultSchedule(group, member, schedule); err != nil {
				return nil, false, err
			}
		} else {
			// Raced with another redeem; treat as already a member.
			alreadyMember = true
		}
	}

	// Auto-approval: a server-validated redeem IS the authorization. Gate on the
	// caller's token-approval state so we flip + alert only on a genuine gate-skip
	// (false→true); an already-approved member joining another group makes no noise.
	if !approved {
		// Membership is already persisted, so on failure the client can safely
		// retry the (idempotent) redeem — surface the error.
		if err := s.idp.ApproveUser(requesterUsername); err != nil {
			return nil, false, err
		}
		// Best-effort: a missed Slack ping must never fail the join.
		if err := s.notifier.Notify(
			"Meal Planner — invite auto-approval",
			fmt.Sprintf("%s auto-approved via invite to %s", requesterName, group.Name),
		); err != nil {
			log.Warn().Msgf("Failed to publish auto-approval alert for '%s': %s", requesterName, err.Error())
		}
	}

	return group, alreadyMember, nil
}
```
Add `"fmt"` to the imports of `invites.go`.

- [ ] **Step 6: Run to verify all pass**

Run: `make -C /Users/jrsue/dev/repos/meal-planner/packages/functions test`
Expected: PASS (new + existing).

- [ ] **Step 7: Commit**

```bash
git add packages/functions/api/internal/core/ports/services.go packages/functions/api/internal/core/services/invites.go packages/functions/api/internal/core/services/invites_test.go packages/functions/api/internal/core/handlers/invites.go
git commit -m "feat(api): auto-approve unapproved users on valid invite redeem"
```

---

### Task 5: `RequireAuthenticated` middleware + route regroup

**Files:**
- Modify: `api/internal/core/handlers/helper.go`
- Create: `api/internal/core/handlers/middleware_test.go`
- Modify: `api/cmd/api/main.go:44-51`

- [ ] **Step 1: Write the failing middleware tests**

`api/internal/core/handlers/middleware_test.go`:
```go
package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/lestrrat-go/jwx/jwa"
	"github.com/lestrrat-go/jwx/jwt"
)

func signedToken(t *testing.T, approved bool) string {
	t.Helper()
	tok := jwt.New()
	_ = tok.Set("custom:Id", "U1")
	_ = tok.Set("cognito:username", "user-1")
	approvedStr := "false"
	if approved {
		approvedStr = "true"
	}
	_ = tok.Set("custom:Approved", approvedStr)
	signed, err := jwt.Sign(tok, jwa.HS256, []byte("test-secret"))
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	return string(signed)
}

func runMiddleware(mw gin.HandlerFunc, authHeader string) *httptest.ResponseRecorder {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/x", mw, func(c *gin.Context) { c.Status(http.StatusOK) })
	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestRequireApproved_BlocksUnapproved(t *testing.T) {
	if w := runMiddleware(RequireApproved(), signedToken(t, false)); w.Code != http.StatusForbidden {
		t.Fatalf("want 403, got %d", w.Code)
	}
}

func TestRequireApproved_AllowsApproved(t *testing.T) {
	if w := runMiddleware(RequireApproved(), signedToken(t, true)); w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d", w.Code)
	}
}

func TestRequireAuthenticated_AllowsUnapproved(t *testing.T) {
	if w := runMiddleware(RequireAuthenticated(), signedToken(t, false)); w.Code != http.StatusOK {
		t.Fatalf("want 200 (approval not required), got %d", w.Code)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /Users/jrsue/dev/repos/meal-planner/packages/functions && go test ./api/internal/core/handlers/ -v`
Expected: FAIL to compile — `undefined: RequireAuthenticated`.

- [ ] **Step 3: Implement the middleware**

Append to `api/internal/core/handlers/helper.go`:
```go
// RequireAuthenticated allows any caller through WITHOUT the approval check.
// Used only by the invite lookup/redeem endpoints so an unapproved invitee can
// redeem (and thereby earn approval). Authentication itself is still enforced at
// the edge by the API Gateway JWT authorizer — a tokenless request never reaches
// the Lambda. This is intentionally a pass-through that documents that intent.
func RequireAuthenticated() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd /Users/jrsue/dev/repos/meal-planner/packages/functions && go test ./api/internal/core/handlers/ -v`
Expected: PASS (all three).

- [ ] **Step 5: Regroup the two redeem routes**

In `api/cmd/api/main.go`, remove the redeem pair from the `api` (approved) group and register them on a separate authenticated-only group. Delete these two lines from under the `api` group:
```go
	// Invite redemption (no groupId in path — user arrives via link)
	api.GET("/invites/:code", h.GetInvite)
	api.POST("/invites/:code/redeem", h.RedeemInvite)
```
And add, after the `api` group's route registrations (before the PORT block):
```go
	// Invite lookup + redemption: authenticated but NOT approval-gated, so an
	// invited newcomer can redeem and be auto-approved on the spot. (API Gateway's
	// JWT authorizer still enforces authentication for every /api route.)
	authed := router.Group("/api")
	authed.Use(handlers.RequireAuthenticated())
	authed.GET("/invites/:code", h.GetInvite)
	authed.POST("/invites/:code/redeem", h.RedeemInvite)
```

- [ ] **Step 6: Build + manual route check**

Run: `make -C /Users/jrsue/dev/repos/meal-planner/packages/functions build` → PASS.

Manual (optional, requires local run per `make run-api-local` with an **unapproved** user's token in `$T`):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: $T" localhost:8080/api/invites/SOMECODE   # expect 404 (reachable, not 403)
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: $T" localhost:8080/api/schedules/2026-01   # expect 403 (still gated)
```
This confirms the gate split: redeem-side reachable while unapproved, everything else still 403.

- [ ] **Step 7: Commit**

```bash
git add packages/functions/api/internal/core/handlers/helper.go packages/functions/api/internal/core/handlers/middleware_test.go packages/functions/api/cmd/api/main.go
git commit -m "feat(api): open invite redeem endpoints to authenticated-but-unapproved users"
```

---

### Task 6: Frontend — refresh token after redeem; retire "awaiting"

**Files:**
- Modify: `web-client-v2/src/contexts/AuthContext.jsx`
- Modify: `web-client-v2/src/pages/InvitePage.jsx`

- [ ] **Step 1: Add `refreshSession` to AuthContext**

In `web-client-v2/src/contexts/AuthContext.jsx`, add this `useCallback` right after `checkAuth` is defined:
```jsx
  // After the API flips custom:Approved server-side, the in-hand idToken still
  // says approved=false. Force a refresh so the new claim takes effect before
  // any approval-gated request runs. custom:Approved is in the pool's
  // read_attributes, so the refreshed token carries it.
  const refreshSession = useCallback(async () => {
    await fetchAuthSession({ forceRefresh: true });
    await checkAuth();
  }, [checkAuth]);
```
Then add `refreshSession` to the object passed to `AuthContext.Provider value={{ ... }}` (alongside `signIn`, `signOut`, etc.). Confirm `fetchAuthSession` is already imported from `aws-amplify/auth` (it is — `checkAuth` uses it).

- [ ] **Step 2: Use it in InvitePage.join + drop "awaiting"**

In `web-client-v2/src/pages/InvitePage.jsx`:

(a) Pull `refreshSession` from the auth hook — change:
```jsx
  const { isAuthenticated, isLoading } = useAuth();
```
to:
```jsx
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
```

(b) Replace the `join` function with (refresh between redeem-success and any gated call; 403 is no longer an approval state):
```jsx
  const join = async () => {
    setState('joining');
    try {
      const res = await api.redeemInvite(code);
      await refreshSession();      // new idToken carries approved:true
      clearPendingInvite();
      await fetchSchedules(true);
      if (res.alreadyMember) { setGroupName(res.groupName); setState('already'); return; }
      navigate(`/groups/${res.groupId}/${encodeURIComponent(res.groupName)}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) { clearPendingInvite(); setState('expired'); return; }
      setState('error');
    }
  };
```

(c) In `load`, change the 403 branch (line ~34) — approval is no longer a reason for 403 here, so treat any error like a generic one:
```jsx
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) { clearPendingInvite(); setState('expired'); return; }
      setState('error');
    }
```

(d) Update the states comment (line ~12) to drop `awaiting`:
```jsx
// States: loading | anon | confirm | joining | already | expired | error
```

(e) Delete the entire `if (state === 'awaiting') return wrap(...)` block (the "Awaiting / approval" screen, ~lines 103-108).

- [ ] **Step 3: Lint**

Run: `yarn --cwd /Users/jrsue/dev/repos/meal-planner/packages/web-client-v2 lint`
Expected: PASS (no unused `awaiting` references).

- [ ] **Step 4: Commit**

```bash
git add packages/web-client-v2/src/contexts/AuthContext.jsx packages/web-client-v2/src/pages/InvitePage.jsx
git commit -m "feat(web): force token refresh after redeem; invited users skip approval wait"
```

---

### Task 7: Terraform — IAM + SNS env var

**Files:**
- Modify: `infrastructure/iam.tf:36-40`
- Modify: `infrastructure/functions.tf:35-44`

- [ ] **Step 1: Add Cognito + SNS permissions to the API policy**

In `infrastructure/iam.tf`, replace the existing API Cognito statement:
```hcl
  statement {
    effect    = "Allow"
    actions   = ["cognito-idp:AdminGetUser"]
    resources = [aws_cognito_user_pool.meal_planner.arn]
  }
```
with (adds `AdminUpdateUserAttributes`, scoped to the same pool):
```hcl
  statement {
    effect    = "Allow"
    actions   = ["cognito-idp:AdminGetUser", "cognito-idp:AdminUpdateUserAttributes"]
    resources = [aws_cognito_user_pool.meal_planner.arn]
  }

  statement {
    effect    = "Allow"
    actions   = ["sns:Publish"]
    resources = [data.aws_sns_topic.alerting.arn]
  }
```

- [ ] **Step 2: Inject the topic ARN into the API Lambda**

In `infrastructure/functions.tf`, add to `module.api`'s `environment_variables` map (alongside `USER_POOL_ID`):
```hcl
    SNS_TOPIC_ARN       = data.aws_sns_topic.alerting.arn
```

- [ ] **Step 3: Validate**

Run:
```bash
cd /Users/jrsue/dev/repos/meal-planner/packages/infrastructure
terraform fmt && terraform validate
```
Expected: `Success! The configuration is valid.`

- [ ] **Step 4: Commit**

```bash
git add packages/infrastructure/iam.tf packages/infrastructure/functions.tf
git commit -m "feat(infra): grant API Lambda AdminUpdateUserAttributes + sns:Publish"
```

- [ ] **Step 5: Deploy (manual, when ready)**

`yarn backend:deploy` (rebuilds the zip + `terraform apply`). Requires `notifications/v1.0.0` to be resolvable (Plan A released).

---

### Task 8: Docs

**Files:** `.claude/backend.md`, `.claude/ui.md`

- [ ] **Step 1: Update backend.md**

In `.claude/backend.md`, under API Endpoints / Invites and Invite Flow:
- Note `GET /api/invites/{code}` and `POST /api/invites/{code}/redeem` are **authenticated-only** (not approval-gated).
- Under "Redeem Invite", add: on a validated redeem, an unapproved caller (per token claim) is auto-approved via `AdminUpdateUserAttributes` and a Slack alert ("auto-approved via invite") is published to the `alerting-events` topic using the shared `notifications.Message` contract.
- Under Cognito/IAM, note the API role now holds `cognito-idp:AdminUpdateUserAttributes` + `sns:Publish`, and the `SNS_TOPIC_ARN` env var.

- [ ] **Step 2: Update ui.md**

In `.claude/ui.md`, under InvitePage and AuthContext:
- `AuthContext` exposes `refreshSession` (force token refresh).
- `InvitePage` no longer has an "awaiting approval" state; an invited user reaches `confirm` and joins immediately, with a token refresh applied post-redeem.

- [ ] **Step 3: Commit**

```bash
git add .claude/backend.md .claude/ui.md
git commit -m "docs: invite auto-approval (gate split, redeem flow, refreshSession)"
```

---

## Self-Review

**Spec coverage:** §4.1 gate split (Task 5) ✓; §4.2 auto-approval gated on token claim (Task 4) ✓; §4.3 ApproveUser port/adapter (Task 2) + Notifier over shared struct (Task 3) ✓; §5 frontend refresh + retire awaiting (Task 6) ✓; §6 IAM + env (Task 7) ✓; §8 tests — service approval cases + middleware regression (Tasks 4, 5) ✓; docs (Task 8) ✓. Shared-module consumption (Task 1) bridges Plan A.

**Placeholder scan:** none — every code/command step is complete. Line-number references (`~`) are approximate anchors; the surrounding code is quoted.

**Type consistency:** `RedeemInvite(requesterId, requesterName, requesterUsername, code string, approved bool)` is identical in `ports/services.go`, `services/invites.go`, the handler call, and all test calls. `Notify(sourceDescription, content string)` matches port, adapter, fake, and the service call. `ApproveUser(username string)` matches port, adapter, fake. `New(repo, idp, notifier)` updated everywhere (sed + main.go).

**Sequencing:** interface-widening tasks (2, 3) land green before behavior (4); 4 before route change (5). Each task ends build-green and commits.
