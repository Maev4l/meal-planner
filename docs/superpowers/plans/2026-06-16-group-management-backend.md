# Group Management — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Go/Lambda API for group management — invite (create/list/get/redeem/revoke), rename group, kick member, leave group, delete group — with the security hardening from the spec.

**Architecture:** Hexagonal, as in the existing code. New `domain.Invite` entity; repository methods on the DynamoDB adapter (single-table, GSI1); business logic in `services` (authorization, idempotency, cascades); thin Gin handlers; routes under the approved `/api` group. Security-critical service logic is TDD'd against the `ports.PlannerRepository` interface using an in-memory fake; DynamoDB methods and handlers are verified with curl against a local run.

**Tech Stack:** Go 1.x, Gin (behind Lambda Web Adapter), AWS SDK v2 (DynamoDB), `google/uuid`, `rs/zerolog`. Spec: `docs/superpowers/specs/2026-06-16-group-management-design.md`.

**Conventions to follow (from the existing code):**
- All commands run from `packages/functions/api` (the Go module root). Build/lint: `go build ./... && go vet ./...`. Tests: `go test ./...`.
- Repository record structs + key builders live in `internal/core/repositories/models.go`; DynamoDB ops in `dynamodb.go`.
- Services are methods on `*service` (`internal/core/services/`); they take primitive args + domain types and call `s.repo` / `s.idp`.
- Handlers are methods on `*HTTPHandler` (`internal/core/handlers/http.go`); request/response DTOs in `handlers/models.go`. Auth via `parseAuthHeader(c.Request.Header.Get("Authorization"))` → `info.userId`, `info.userName`.
- IDs are uppercase, dash-stripped (`helper.NewId()` / `helper.Normalize()`).

**Commit after every task.** Per project rule, work on `master` (do not create feature branches), and these commits are local — pushing is a separate, user-initiated step.

---

### Task 1: Invite code generator

**Files:**
- Modify: `internal/helper/id.go`
- Test: `internal/helper/id_test.go` (create)

- [ ] **Step 1: Write the failing test**

```go
package helper

import (
	"regexp"
	"testing"
)

func TestNewInviteCode(t *testing.T) {
	code := NewInviteCode()

	// 128-bit, reusing the UUID source, normalized like the app's other ids:
	// 32 uppercase hex characters, no dashes.
	if !regexp.MustCompile(`^[0-9A-F]{32}$`).MatchString(code) {
		t.Fatalf("code %q is not 32 uppercase hex chars", code)
	}
}

func TestNewInviteCodeIsUnique(t *testing.T) {
	seen := map[string]bool{}
	for i := 0; i < 1000; i++ {
		c := NewInviteCode()
		if seen[c] {
			t.Fatalf("duplicate code generated: %q", c)
		}
		seen[c] = true
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/helper/ -run TestNewInviteCode -v`
Expected: FAIL — `undefined: NewInviteCode`.

- [ ] **Step 3: Add the generator**

In `internal/helper/id.go`, add (the file already imports `github.com/google/uuid` and defines `Normalize`):

```go
// NewInviteCode returns a crypto-strong, ~128-bit invite code.
// We reuse google/uuid (crypto-strong) and normalize like our other ids
// (uppercase, no dashes). Invite links are shared by copy/Web Share, never
// typed, so length is not a UX concern; entropy defeats enumeration.
func NewInviteCode() string {
	return Normalize(uuid.NewString())
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/helper/ -run TestNewInviteCode -v`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add internal/helper/id.go internal/helper/id_test.go
git commit -m "feat(api): add NewInviteCode generator"
```

---

### Task 2: Invite domain entity + service sentinel errors

**Files:**
- Modify: `internal/core/domain/entities.go`
- Create: `internal/core/domain/errors.go`

- [ ] **Step 1: Add the `Invite` entity**

Append to `internal/core/domain/entities.go`:

```go
type Invite struct {
	Code      string
	GroupId   string
	GroupName string
	CreatedBy string
	CreatedAt *time.Time
	ExpiresAt *time.Time
}

// IsExpired reports whether the invite is past its TTL. DynamoDB TTL deletion
// is lazy (can lag hours), so callers MUST check this in code and never rely
// on the row having been physically removed.
func (i *Invite) IsExpired(now time.Time) bool {
	return i.ExpiresAt != nil && now.After(*i.ExpiresAt)
}
```

- [ ] **Step 2: Add sentinel errors for handler status mapping**

Create `internal/core/domain/errors.go`:

```go
package domain

import "errors"

// Sentinel errors returned by services so handlers can map to HTTP status codes.
var (
	ErrForbidden = errors.New("forbidden")     // -> 403
	ErrNotFound  = errors.New("not found")     // -> 404
	ErrExpired   = errors.New("expired")       // -> 404 (invalid/expired/revoked are indistinguishable)
	ErrConflict  = errors.New("conflict")      // -> 409
	ErrSoleAdmin = errors.New("sole admin")    // -> 409 (admin cannot leave)
)
```

- [ ] **Step 3: Build**

Run: `go build ./...`
Expected: success (no usages yet).

- [ ] **Step 4: Commit**

```bash
git add internal/core/domain/entities.go internal/core/domain/errors.go
git commit -m "feat(api): add Invite entity and service sentinel errors"
```

---

### Task 3: Extend repository port + in-memory fake for tests

This defines the new repository contract and a fake implementing it, so service logic can be TDD'd without DynamoDB.

**Files:**
- Modify: `internal/core/ports/` (the `PlannerRepository` interface file)
- Create: `internal/core/services/fakes_test.go`

- [ ] **Step 1: Extend the `PlannerRepository` interface**

In the ports file defining `PlannerRepository`, add these methods to the interface:

```go
	// Invites
	SaveInvite(inv *domain.Invite) error
	GetInvite(code string) (*domain.Invite, error)
	ListGroupInvites(groupId string) ([]*domain.Invite, error)
	DeleteInvite(code string) error

	// Membership / group lifecycle
	CreateMemberIfNotExists(m *domain.Member) (created bool, err error)
	ListGroupMembers(groupId string) ([]*domain.Member, error)
	UpdateGroupName(groupId string, name string) error
	DeleteMemberGroupData(memberId string, groupId string) error
	DeleteGroupCascade(groupId string) error
```

- [ ] **Step 2: Create the in-memory fake repository (test-only)**

Create `internal/core/services/fakes_test.go`:

```go
package services

import (
	"time"

	"isnan.eu/meal-planner/functions/api/internal/core/domain"
	"isnan.eu/meal-planner/functions/api/internal/core/domain/roles"
)

// memberKey identifies a membership uniquely.
type memberKey struct{ groupId, memberId string }

// fakeRepo is an in-memory ports.PlannerRepository for service unit tests.
type fakeRepo struct {
	groups   map[string]*domain.Group   // groupId -> group
	members  map[memberKey]*domain.Member
	invites  map[string]*domain.Invite  // code -> invite
	deleted  []string                   // groupIds passed to DeleteGroupCascade
}

func newFakeRepo() *fakeRepo {
	return &fakeRepo{
		groups:  map[string]*domain.Group{},
		members: map[memberKey]*domain.Member{},
		invites: map[string]*domain.Invite{},
	}
}

func (f *fakeRepo) SaveGroup(g *domain.Group) error { f.groups[g.Id] = g; return nil }
func (f *fakeRepo) GetGroup(groupId string) (*domain.Group, error) { return f.groups[groupId], nil }
func (f *fakeRepo) SaveMember(m *domain.Member) error {
	f.members[memberKey{m.GroupId, m.Id}] = m
	return nil
}
func (f *fakeRepo) GetMember(groupId, memberId string) (*domain.Member, error) {
	return f.members[memberKey{groupId, memberId}], nil
}
func (f *fakeRepo) CreateMemberIfNotExists(m *domain.Member) (bool, error) {
	k := memberKey{m.GroupId, m.Id}
	if _, ok := f.members[k]; ok {
		return false, nil
	}
	f.members[k] = m
	return true, nil
}
func (f *fakeRepo) ListGroupMembers(groupId string) ([]*domain.Member, error) {
	out := []*domain.Member{}
	for k, m := range f.members {
		if k.groupId == groupId {
			out = append(out, m)
		}
	}
	return out, nil
}
func (f *fakeRepo) UpdateGroupName(groupId, name string) error {
	if g := f.groups[groupId]; g != nil {
		g.Name = name
	}
	return nil
}
func (f *fakeRepo) DeleteMemberGroupData(memberId, groupId string) error {
	delete(f.members, memberKey{groupId, memberId})
	return nil
}
func (f *fakeRepo) DeleteGroupCascade(groupId string) error {
	delete(f.groups, groupId)
	for k := range f.members {
		if k.groupId == groupId {
			delete(f.members, k)
		}
	}
	f.deleted = append(f.deleted, groupId)
	return nil
}
func (f *fakeRepo) SaveInvite(inv *domain.Invite) error { f.invites[inv.Code] = inv; return nil }
func (f *fakeRepo) GetInvite(code string) (*domain.Invite, error) { return f.invites[code], nil }
func (f *fakeRepo) ListGroupInvites(groupId string) ([]*domain.Invite, error) {
	out := []*domain.Invite{}
	for _, inv := range f.invites {
		if inv.GroupId == groupId {
			out = append(out, inv)
		}
	}
	return out, nil
}
func (f *fakeRepo) DeleteInvite(code string) error { delete(f.invites, code); return nil }

// Unused-by-these-tests repository methods (no-op stubs to satisfy the interface).
func (f *fakeRepo) SaveMemberDefaultSchedule(*domain.Group, *domain.Member, *domain.MemberDefaultSchedule) error {
	return nil
}
func (f *fakeRepo) SaveMemberSchedule(*domain.Group, *domain.Member, *domain.MemberSchedule) error {
	return nil
}
func (f *fakeRepo) SaveMemberComments(*domain.Group, *domain.Member, *domain.MemberComments) error {
	return nil
}
func (f *fakeRepo) GetMemberData(string, int, int) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, []*domain.MemberComments, []*domain.Notice, error) {
	return nil, nil, nil, nil, nil
}
func (f *fakeRepo) SaveNotice(*domain.Group, *domain.Member, *domain.Notice) error { return nil }
func (f *fakeRepo) DeleteNotice(*domain.Group, *domain.Member, int, int) error      { return nil }

// fakeIdP satisfies ports.PlannerIdP.
type fakeIdP struct{ users map[string]*domain.User }

func (f *fakeIdP) GetUser(name string) (*domain.User, error) { return f.users[name], nil }

// --- test helpers ---

func ptr(t time.Time) *time.Time { return &t }

// seedGroupWithAdmin sets up a group whose admin is adminId.
func seedGroupWithAdmin(f *fakeRepo, groupId, groupName, adminId string) {
	f.SaveGroup(&domain.Group{Id: groupId, Name: groupName})
	f.SaveMember(&domain.Member{Id: adminId, Name: "Admin", Role: roles.GroupAdmin, GroupId: groupId, GroupName: groupName})
}
```

- [ ] **Step 3: Verify it does not yet compile (service methods/real repo missing)**

Run: `go vet ./internal/core/services/`
Expected: FAIL — the real `*dynamo` does not yet implement the new interface methods, and service methods under test don't exist. This is expected; Task 4 makes the real repo compile, Tasks 5–12 add the service methods. (If you prefer a green tree between tasks, do Task 4 before running service tests.)

- [ ] **Step 4: Commit**

```bash
git add internal/core/ports/ internal/core/services/fakes_test.go
git commit -m "test(api): extend repository port and add in-memory fake"
```

---

### Task 4: DynamoDB repository — implement the new methods

No unit tests (require AWS); verified by curl in Task 16. Implement mirroring existing patterns in `dynamodb.go`/`models.go`.

**Files:**
- Modify: `internal/core/repositories/models.go`
- Modify: `internal/core/repositories/dynamodb.go`

- [ ] **Step 1: Add the `Invite` record + key builders**

Append to `internal/core/repositories/models.go`:

```go
type Invite struct {
	PK        string     `dynamodbav:"PK"`     // invite#<code>
	SK        string     `dynamodbav:"SK"`     // invite#<code>
	GSI1PK    string     `dynamodbav:"GSI1PK"` // group#<groupId>
	GSI1SK    string     `dynamodbav:"GSI1SK"` // invite#<code>
	Code      string     `dynamodbav:"Code"`
	GroupId   string     `dynamodbav:"GroupId"`
	GroupName string     `dynamodbav:"GroupName"`
	CreatedBy string     `dynamodbav:"CreatedBy"`
	CreatedAt *time.Time `dynamodbav:"CreatedAt"`
	ExpiresAt *time.Time `dynamodbav:"ExpiresAt,unixtime"`
}

func createInvitePK(code string) string { return fmt.Sprintf("invite#%s", code) }
func createInviteSK(code string) string { return fmt.Sprintf("invite#%s", code) }
func createInviteSecondary1PK(groupId string) string { return fmt.Sprintf("group#%s", groupId) }
func createInviteSecondary1SK(code string) string { return fmt.Sprintf("invite#%s", code) }
```

- [ ] **Step 2: Add invite CRUD to `dynamodb.go`**

```go
func (d *dynamo) SaveInvite(inv *domain.Invite) error {
	record := Invite{
		PK:        createInvitePK(inv.Code),
		SK:        createInviteSK(inv.Code),
		GSI1PK:    createInviteSecondary1PK(inv.GroupId),
		GSI1SK:    createInviteSecondary1SK(inv.Code),
		Code:      inv.Code,
		GroupId:   inv.GroupId,
		GroupName: inv.GroupName,
		CreatedBy: inv.CreatedBy,
		CreatedAt: inv.CreatedAt,
		ExpiresAt: inv.ExpiresAt,
	}
	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Msgf("Failed to marshal invite '%s': %s", inv.Code, err.Error())
		return err
	}
	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		log.Error().Msgf("Failed to put invite '%s': %s", inv.Code, err.Error())
	}
	return err
}

func (d *dynamo) GetInvite(code string) (*domain.Invite, error) {
	pk, _ := attributevalue.Marshal(createInvitePK(code))
	sk, _ := attributevalue.Marshal(createInviteSK(code))
	result, err := d.client.GetItem(context.TODO(), &dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key:       map[string]types.AttributeValue{"PK": pk, "SK": sk},
	})
	if err != nil {
		log.Error().Msgf("Failed to get invite '%s': %s", code, err.Error())
		return nil, err
	}
	if result.Item == nil {
		return nil, nil
	}
	var record Invite
	if err := attributevalue.UnmarshalMap(result.Item, &record); err != nil {
		log.Error().Msgf("Failed to unmarshal invite '%s': %s", code, err.Error())
		return nil, err
	}
	return &domain.Invite{
		Code: record.Code, GroupId: record.GroupId, GroupName: record.GroupName,
		CreatedBy: record.CreatedBy, CreatedAt: record.CreatedAt, ExpiresAt: record.ExpiresAt,
	}, nil
}

func (d *dynamo) ListGroupInvites(groupId string) ([]*domain.Invite, error) {
	query := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("GSI1"),
		KeyConditionExpression: aws.String("#pk = :groupId and begins_with(#sk,:invite_prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":groupId":       &types.AttributeValueMemberS{Value: createInviteSecondary1PK(groupId)},
			":invite_prefix": &types.AttributeValueMemberS{Value: "invite#"},
		},
		ExpressionAttributeNames: map[string]string{"#pk": "GSI1PK", "#sk": "GSI1SK"},
	}
	out := []*domain.Invite{}
	p := dynamodb.NewQueryPaginator(d.client, &query)
	for p.HasMorePages() {
		result, err := p.NextPage(context.TODO())
		if err != nil {
			log.Error().Msgf("Failed to list group '%s' invites: %s", groupId, err.Error())
			return nil, err
		}
		for _, item := range result.Items {
			var r Invite
			if err := attributevalue.UnmarshalMap(item, &r); err != nil {
				log.Warn().Msgf("Failed to unmarshal invite: %s", err.Error())
				continue
			}
			out = append(out, &domain.Invite{
				Code: r.Code, GroupId: r.GroupId, GroupName: r.GroupName,
				CreatedBy: r.CreatedBy, CreatedAt: r.CreatedAt, ExpiresAt: r.ExpiresAt,
			})
		}
	}
	return out, nil
}

func (d *dynamo) DeleteInvite(code string) error {
	pk, _ := attributevalue.Marshal(createInvitePK(code))
	sk, _ := attributevalue.Marshal(createInviteSK(code))
	_, err := d.client.DeleteItem(context.TODO(), &dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key:       map[string]types.AttributeValue{"PK": pk, "SK": sk},
	})
	if err != nil {
		log.Error().Msgf("Failed to delete invite '%s': %s", code, err.Error())
	}
	return err
}
```

- [ ] **Step 3: Add conditional member create**

```go
// CreateMemberIfNotExists writes the member only if no item with the same
// PK/SK exists. Returns created=false (no error) when the membership already
// exists, so redeem stays idempotent and concurrent/double redeems can't
// create duplicate or partial state.
func (d *dynamo) CreateMemberIfNotExists(m *domain.Member) (bool, error) {
	record := Member{
		PK: createMemberPK(m.Id), SK: createMemberSK(m.GroupId),
		GSI1PK: createMemberSecondary1PK(m.GroupId), GSI1SK: createMemberSecondary1SK(m.Id),
		Id: m.Id, Name: m.Name, GroupName: m.GroupName, GroupId: m.GroupId,
		CreatedAt: m.CreatedAt, Role: string(m.Role),
	}
	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		return false, err
	}
	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName:           aws.String(tableName),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(PK) AND attribute_not_exists(SK)"),
	})
	if err != nil {
		var cfe *types.ConditionalCheckFailedException
		if errors.As(err, &cfe) {
			return false, nil // already a member
		}
		log.Error().Msgf("Failed to conditionally create member '%s': %s", m.Name, err.Error())
		return false, err
	}
	return true, nil
}
```

Add `"errors"` to the `dynamodb.go` import block.

- [ ] **Step 4: Add `ListGroupMembers`, `UpdateGroupName`**

```go
func (d *dynamo) ListGroupMembers(groupId string) ([]*domain.Member, error) {
	query := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("GSI1"),
		KeyConditionExpression: aws.String("#pk = :groupId and begins_with(#sk,:member_prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":groupId":       &types.AttributeValueMemberS{Value: createMemberSecondary1PK(groupId)},
			":member_prefix": &types.AttributeValueMemberS{Value: "member#"},
		},
		ExpressionAttributeNames: map[string]string{"#pk": "GSI1PK", "#sk": "GSI1SK"},
	}
	out := []*domain.Member{}
	p := dynamodb.NewQueryPaginator(d.client, &query)
	for p.HasMorePages() {
		result, err := p.NextPage(context.TODO())
		if err != nil {
			log.Error().Msgf("Failed to list group '%s' members: %s", groupId, err.Error())
			return nil, err
		}
		for _, item := range result.Items {
			var r Member
			if err := attributevalue.UnmarshalMap(item, &r); err != nil {
				continue
			}
			out = append(out, &domain.Member{
				Id: r.Id, Name: r.Name, Role: roles.GROUP_ROLE(r.Role),
				CreatedAt: r.CreatedAt, GroupId: r.GroupId, GroupName: r.GroupName,
			})
		}
	}
	return out, nil
}

// UpdateGroupName updates only the Group record's name. Denormalized GroupName
// on member/schedule records is intentionally left stale (out of scope) — the
// app reads the live name from the Group record / schedules payload.
func (d *dynamo) UpdateGroupName(groupId, name string) error {
	pk, _ := attributevalue.Marshal(createGroupPK(groupId))
	sk, _ := attributevalue.Marshal(createGroupSK(groupId))
	_, err := d.client.UpdateItem(context.TODO(), &dynamodb.UpdateItemInput{
		TableName:                 aws.String(tableName),
		Key:                       map[string]types.AttributeValue{"PK": pk, "SK": sk},
		UpdateExpression:          aws.String("SET #n = :name"),
		ExpressionAttributeNames:  map[string]string{"#n": "GroupName"},
		ExpressionAttributeValues: map[string]types.AttributeValue{":name": &types.AttributeValueMemberS{Value: name}},
	})
	if err != nil {
		log.Error().Msgf("Failed to rename group '%s': %s", groupId, err.Error())
	}
	return err
}
```

- [ ] **Step 5: Add cascade deletes with a batch helper**

```go
// deleteKeys deletes items in batches of 25 (BatchWriteItem limit).
func (d *dynamo) deleteKeys(keys []map[string]types.AttributeValue) error {
	for i := 0; i < len(keys); i += 25 {
		end := i + 25
		if end > len(keys) {
			end = len(keys)
		}
		reqs := make([]types.WriteRequest, 0, end-i)
		for _, k := range keys[i:end] {
			reqs = append(reqs, types.WriteRequest{DeleteRequest: &types.DeleteRequest{Key: k}})
		}
		_, err := d.client.BatchWriteItem(context.TODO(), &dynamodb.BatchWriteItemInput{
			RequestItems: map[string][]types.WriteRequest{tableName: reqs},
		})
		if err != nil {
			log.Error().Msgf("Batch delete failed: %s", err.Error())
			return err
		}
	}
	return nil
}

// keyOnly is the minimal projection needed to delete an item.
type keyOnly struct {
	PK string `dynamodbav:"PK"`
	SK string `dynamodbav:"SK"`
}

func avKey(pk, sk string) map[string]types.AttributeValue {
	return map[string]types.AttributeValue{
		"PK": &types.AttributeValueMemberS{Value: pk},
		"SK": &types.AttributeValueMemberS{Value: sk},
	}
}

// DeleteGroupCascade removes every item belonging to the group (members,
// schedules, comments, notices, invites — all share GSI1PK=group#<id>) plus
// the Group record itself (which has no GSI1PK).
func (d *dynamo) DeleteGroupCascade(groupId string) error {
	query := dynamodb.QueryInput{
		TableName:                 aws.String(tableName),
		IndexName:                 aws.String("GSI1"),
		KeyConditionExpression:    aws.String("#pk = :groupId"),
		ExpressionAttributeValues: map[string]types.AttributeValue{":groupId": &types.AttributeValueMemberS{Value: createGroupPK(groupId)}},
		ExpressionAttributeNames:  map[string]string{"#pk": "GSI1PK"},
	}
	keys := []map[string]types.AttributeValue{}
	p := dynamodb.NewQueryPaginator(d.client, &query)
	for p.HasMorePages() {
		result, err := p.NextPage(context.TODO())
		if err != nil {
			log.Error().Msgf("Failed to query group '%s' items: %s", groupId, err.Error())
			return err
		}
		for _, item := range result.Items {
			var k keyOnly
			if err := attributevalue.UnmarshalMap(item, &k); err != nil {
				continue
			}
			keys = append(keys, avKey(k.PK, k.SK))
		}
	}
	// The Group record itself (PK=SK=group#<id>) is not on GSI1.
	keys = append(keys, avKey(createGroupPK(groupId), createGroupSK(groupId)))
	return d.deleteKeys(keys)
}

// DeleteMemberGroupData removes one member's items within a single group:
// query the member partition and keep items whose SK references the group.
func (d *dynamo) DeleteMemberGroupData(memberId, groupId string) error {
	query := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("#pk = :memberId"),
		FilterExpression:       aws.String("contains(#sk, :group)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":memberId": &types.AttributeValueMemberS{Value: createMemberPK(memberId)},
			":group":    &types.AttributeValueMemberS{Value: fmt.Sprintf("group#%s", groupId)},
		},
		ExpressionAttributeNames: map[string]string{"#pk": "PK", "#sk": "SK"},
	}
	keys := []map[string]types.AttributeValue{}
	p := dynamodb.NewQueryPaginator(d.client, &query)
	for p.HasMorePages() {
		result, err := p.NextPage(context.TODO())
		if err != nil {
			log.Error().Msgf("Failed to query member '%s' data: %s", memberId, err.Error())
			return err
		}
		for _, item := range result.Items {
			var k keyOnly
			if err := attributevalue.UnmarshalMap(item, &k); err != nil {
				continue
			}
			keys = append(keys, avKey(k.PK, k.SK))
		}
	}
	return d.deleteKeys(keys)
}
```

- [ ] **Step 6: Build & vet**

Run: `go build ./... && go vet ./...`
Expected: success. The real `*dynamo` now satisfies the extended interface. (Service methods still missing — added next; `go vet ./internal/core/services/` may still fail until Task 5+.)

- [ ] **Step 7: Commit**

```bash
git add internal/core/repositories/
git commit -m "feat(api): repository methods for invites, conditional member create, cascades"
```

---

### Task 5: Service — CreateInvite

**Files:**
- Create: `internal/core/services/invites.go`
- Test: `internal/core/services/invites_test.go`

- [ ] **Step 1: Write the failing test**

```go
package services

import (
	"testing"

	"isnan.eu/meal-planner/functions/api/internal/core/domain"
	"isnan.eu/meal-planner/functions/api/internal/core/domain/roles"
)

func TestCreateInvite_AdminSucceeds(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	svc := New(repo, &fakeIdP{})

	inv, err := svc.CreateInvite("ADMIN", "G1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if inv.Code == "" || inv.GroupId != "G1" || inv.GroupName != "Family" {
		t.Fatalf("bad invite: %+v", inv)
	}
	if inv.ExpiresAt == nil || !inv.ExpiresAt.After(*inv.CreatedAt) {
		t.Fatalf("expiry must be after creation: %+v", inv)
	}
	if repo.invites[inv.Code] == nil {
		t.Fatalf("invite not persisted")
	}
}

func TestCreateInvite_NonAdminForbidden(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	repo.SaveMember(&domain.Member{Id: "BOB", Role: roles.Member, GroupId: "G1", GroupName: "Family"})
	svc := New(repo, &fakeIdP{})

	_, err := svc.CreateInvite("BOB", "G1")
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

func TestCreateInvite_NotAMemberForbidden(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	svc := New(repo, &fakeIdP{})

	_, err := svc.CreateInvite("STRANGER", "G1")
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `go test ./internal/core/services/ -run TestCreateInvite -v`
Expected: FAIL — `svc.CreateInvite undefined`.

- [ ] **Step 3: Implement CreateInvite + a shared admin guard**

Create `internal/core/services/invites.go`:

```go
package services

import (
	"time"

	"isnan.eu/meal-planner/functions/api/internal/core/domain"
	"isnan.eu/meal-planner/functions/api/internal/core/domain/roles"
	"isnan.eu/meal-planner/functions/api/internal/helper"
)

const inviteTTL = 7 * 24 * time.Hour

// requireGroupAdmin returns the group when memberId is its admin, else ErrForbidden.
func (s *service) requireGroupAdmin(groupId, memberId string) (*domain.Group, error) {
	group, member, err := s.validateGroupOperation(groupId, memberId)
	if err != nil {
		return nil, err
	}
	if group == nil || member == nil {
		return nil, domain.ErrForbidden
	}
	if member.Role != roles.GroupAdmin {
		return nil, domain.ErrForbidden
	}
	return group, nil
}

func (s *service) CreateInvite(requesterId, groupId string) (*domain.Invite, error) {
	group, err := s.requireGroupAdmin(groupId, requesterId)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	expiresAt := now.Add(inviteTTL)

	// Get-before-save retry guards the (negligible) code collision.
	var code string
	for i := 0; i < 5; i++ {
		code = helper.NewInviteCode()
		existing, err := s.repo.GetInvite(code)
		if err != nil {
			return nil, err
		}
		if existing == nil {
			break
		}
	}

	inv := &domain.Invite{
		Code: code, GroupId: group.Id, GroupName: group.Name,
		CreatedBy: requesterId, CreatedAt: &now, ExpiresAt: &expiresAt,
	}
	if err := s.repo.SaveInvite(inv); err != nil {
		return nil, err
	}
	return inv, nil
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `go test ./internal/core/services/ -run TestCreateInvite -v`
Expected: PASS (all three).

- [ ] **Step 5: Commit**

```bash
git add internal/core/services/invites.go internal/core/services/invites_test.go
git commit -m "feat(api): CreateInvite service with admin guard"
```

---

### Task 6: Service — GetInvite & ListInvites (expiry handling)

**Files:**
- Modify: `internal/core/services/invites.go`
- Modify: `internal/core/services/invites_test.go`

- [ ] **Step 1: Write the failing tests**

Append to `invites_test.go`:

```go
import "time" // ensure imported (merge with existing import block)

func TestGetInvite_ValidReturnsIt(t *testing.T) {
	repo := newFakeRepo()
	now := time.Now().UTC()
	exp := now.Add(time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &exp})
	svc := New(repo, &fakeIdP{})

	inv, err := svc.GetInvite("C1")
	if err != nil || inv == nil || inv.GroupName != "Family" {
		t.Fatalf("expected valid invite, got inv=%+v err=%v", inv, err)
	}
}

func TestGetInvite_ExpiredIsNotFound(t *testing.T) {
	repo := newFakeRepo()
	now := time.Now().UTC()
	past := now.Add(-time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &past})
	svc := New(repo, &fakeIdP{})

	_, err := svc.GetInvite("C1")
	if err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound for expired, got %v", err)
	}
}

func TestGetInvite_UnknownIsNotFound(t *testing.T) {
	svc := New(newFakeRepo(), &fakeIdP{})
	if _, err := svc.GetInvite("NOPE"); err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestListInvites_AdminFiltersExpired(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	now := time.Now().UTC()
	future := now.Add(time.Hour)
	past := now.Add(-time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "LIVE", GroupId: "G1", ExpiresAt: &future})
	repo.SaveInvite(&domain.Invite{Code: "DEAD", GroupId: "G1", ExpiresAt: &past})
	svc := New(repo, &fakeIdP{})

	list, err := svc.ListInvites("ADMIN", "G1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(list) != 1 || list[0].Code != "LIVE" {
		t.Fatalf("expected only LIVE invite, got %+v", list)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `go test ./internal/core/services/ -run "TestGetInvite|TestListInvites" -v`
Expected: FAIL — `GetInvite`/`ListInvites` undefined.

- [ ] **Step 3: Implement**

Append to `invites.go`:

```go
func (s *service) GetInvite(code string) (*domain.Invite, error) {
	inv, err := s.repo.GetInvite(code)
	if err != nil {
		return nil, err
	}
	// Treat missing AND expired identically (don't leak which codes existed).
	if inv == nil || inv.IsExpired(time.Now().UTC()) {
		return nil, domain.ErrNotFound
	}
	return inv, nil
}

func (s *service) ListInvites(requesterId, groupId string) ([]*domain.Invite, error) {
	if _, err := s.requireGroupAdmin(groupId, requesterId); err != nil {
		return nil, err
	}
	all, err := s.repo.ListGroupInvites(groupId)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	live := []*domain.Invite{}
	for _, inv := range all {
		if !inv.IsExpired(now) {
			live = append(live, inv)
		}
	}
	return live, nil
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `go test ./internal/core/services/ -run "TestGetInvite|TestListInvites" -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/core/services/invites.go internal/core/services/invites_test.go
git commit -m "feat(api): GetInvite and ListInvites with code-level expiry checks"
```

---

### Task 7: Service — RedeemInvite (idempotent, atomic, no downgrade)

**Files:**
- Modify: `internal/core/services/invites.go`
- Modify: `internal/core/services/invites_test.go`

- [ ] **Step 1: Write the failing tests**

Append to `invites_test.go`:

```go
func TestRedeemInvite_NewMemberJoins(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	now := time.Now().UTC()
	exp := now.Add(time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &exp})
	svc := New(repo, &fakeIdP{})

	group, already, err := svc.RedeemInvite("BOB", "Bob", "C1")
	if err != nil || group.Id != "G1" || already {
		t.Fatalf("expected join (already=false), got group=%+v already=%v err=%v", group, already, err)
	}
	m, _ := repo.GetMember("G1", "BOB")
	if m == nil || m.Role != roles.Member {
		t.Fatalf("expected BOB to be a regular member, got %+v", m)
	}
}

func TestRedeemInvite_ExpiredRejected(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	now := time.Now().UTC()
	past := now.Add(-time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &past})
	svc := New(repo, &fakeIdP{})

	if _, _, err := svc.RedeemInvite("BOB", "Bob", "C1"); err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestRedeemInvite_AdminRedeemingOwnLinkKeepsAdmin(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	now := time.Now().UTC()
	exp := now.Add(time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &exp})
	svc := New(repo, &fakeIdP{})

	group, already, err := svc.RedeemInvite("ADMIN", "Admin", "C1")
	if err != nil || !already || group.Id != "G1" {
		t.Fatalf("expected idempotent already=true, got group=%+v already=%v err=%v", group, already, err)
	}
	m, _ := repo.GetMember("G1", "ADMIN")
	if m == nil || m.Role != roles.GroupAdmin {
		t.Fatalf("ADMIN must remain admin, got %+v", m)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `go test ./internal/core/services/ -run TestRedeemInvite -v`
Expected: FAIL — `RedeemInvite` undefined.

- [ ] **Step 3: Implement**

Append to `invites.go`:

```go
// RedeemInvite joins the requester to the invite's group as a regular Member.
// Idempotent: if already a member, returns the group with already=true and
// performs ZERO writes (so an existing admin redeeming their own link is never
// downgraded). The membership write is conditional, so concurrent/double
// redeems cannot create duplicate or partial state.
func (s *service) RedeemInvite(requesterId, requesterName, code string) (*domain.Group, bool, error) {
	inv, err := s.repo.GetInvite(code)
	if err != nil {
		return nil, false, err
	}
	if inv == nil || inv.IsExpired(time.Now().UTC()) {
		return nil, false, domain.ErrNotFound
	}

	group, err := s.repo.GetGroup(inv.GroupId)
	if err != nil {
		return nil, false, err
	}
	if group == nil {
		return nil, false, domain.ErrNotFound
	}

	// Idempotent no-op for existing members (never rewrite the record).
	existing, err := s.repo.GetMember(group.Id, requesterId)
	if err != nil {
		return nil, false, err
	}
	if existing != nil {
		return group, true, nil
	}

	now := time.Now().UTC()
	member := &domain.Member{
		Id: requesterId, Name: requesterName, CreatedAt: &now,
		Role: roles.Member, GroupId: group.Id, GroupName: group.Name,
	}
	created, err := s.repo.CreateMemberIfNotExists(member)
	if err != nil {
		return nil, false, err
	}
	if !created {
		// Raced with another redeem; treat as already a member.
		return group, true, nil
	}

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
	return group, false, nil
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `go test ./internal/core/services/ -run TestRedeemInvite -v`
Expected: PASS (all three).

- [ ] **Step 5: Commit**

```bash
git add internal/core/services/invites.go internal/core/services/invites_test.go
git commit -m "feat(api): RedeemInvite (idempotent, atomic, no admin downgrade)"
```

---

### Task 8: Service — RevokeInvite (IDOR-safe)

**Files:**
- Modify: `internal/core/services/invites.go`
- Modify: `internal/core/services/invites_test.go`

- [ ] **Step 1: Write the failing tests**

Append to `invites_test.go`:

```go
func TestRevokeInvite_AdminDeletes(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family"})
	svc := New(repo, &fakeIdP{})

	if err := svc.RevokeInvite("ADMIN", "G1", "C1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.invites["C1"] != nil {
		t.Fatalf("invite should be deleted")
	}
}

func TestRevokeInvite_CrossGroupRejected(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")   // requester admins G1
	seedGroupWithAdmin(repo, "G2", "Other", "OTHERADM")
	repo.SaveInvite(&domain.Invite{Code: "C2", GroupId: "G2", GroupName: "Other"}) // belongs to G2
	svc := New(repo, &fakeIdP{})

	// Admin of G1 passes their own group in the path but a G2 code: must be rejected.
	if err := svc.RevokeInvite("ADMIN", "G1", "C2"); err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden on group mismatch, got %v", err)
	}
	if repo.invites["C2"] == nil {
		t.Fatalf("G2 invite must NOT be deleted")
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `go test ./internal/core/services/ -run TestRevokeInvite -v`
Expected: FAIL — `RevokeInvite` undefined.

- [ ] **Step 3: Implement**

Append to `invites.go`:

```go
// RevokeInvite deletes an invite. Authorizes on the invite's STORED GroupId
// and asserts it matches the path groupId, preventing a cross-group IDOR
// (admin of A cannot revoke B's invite by passing A in the path).
func (s *service) RevokeInvite(requesterId, groupId, code string) error {
	inv, err := s.repo.GetInvite(code)
	if err != nil {
		return err
	}
	if inv == nil {
		return domain.ErrNotFound
	}
	if inv.GroupId != groupId {
		return domain.ErrForbidden
	}
	if _, err := s.requireGroupAdmin(inv.GroupId, requesterId); err != nil {
		return err
	}
	return s.repo.DeleteInvite(code)
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `go test ./internal/core/services/ -run TestRevokeInvite -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/core/services/invites.go internal/core/services/invites_test.go
git commit -m "feat(api): RevokeInvite with IDOR guard (stored vs path group)"
```

---

### Task 9: Service — RenameGroup

**Files:**
- Create: `internal/core/services/group_admin.go`
- Test: `internal/core/services/group_admin_test.go`

- [ ] **Step 1: Write the failing tests**

```go
package services

import (
	"testing"

	"isnan.eu/meal-planner/functions/api/internal/core/domain"
	"isnan.eu/meal-planner/functions/api/internal/core/domain/roles"
)

func TestRenameGroup_AdminSucceeds(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Old", "ADMIN")
	svc := New(repo, &fakeIdP{})

	g, err := svc.RenameGroup("ADMIN", "G1", "New Name")
	if err != nil || g.Name != "New Name" {
		t.Fatalf("expected rename, got g=%+v err=%v", g, err)
	}
	if repo.groups["G1"].Name != "New Name" {
		t.Fatalf("group not renamed in repo")
	}
}

func TestRenameGroup_NonAdminForbidden(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Old", "ADMIN")
	repo.SaveMember(&domain.Member{Id: "BOB", Role: roles.Member, GroupId: "G1", GroupName: "Old"})
	svc := New(repo, &fakeIdP{})

	if _, err := svc.RenameGroup("BOB", "G1", "Hax"); err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

func TestRenameGroup_EmptyNameConflict(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Old", "ADMIN")
	svc := New(repo, &fakeIdP{})

	if _, err := svc.RenameGroup("ADMIN", "G1", "   "); err != domain.ErrConflict {
		t.Fatalf("expected ErrConflict for blank name, got %v", err)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `go test ./internal/core/services/ -run TestRenameGroup -v`
Expected: FAIL — `RenameGroup` undefined.

- [ ] **Step 3: Implement**

Create `internal/core/services/group_admin.go`:

```go
package services

import (
	"strings"

	"isnan.eu/meal-planner/functions/api/internal/core/domain"
	"isnan.eu/meal-planner/functions/api/internal/core/domain/roles"
)

func (s *service) RenameGroup(requesterId, groupId, name string) (*domain.Group, error) {
	group, err := s.requireGroupAdmin(groupId, requesterId)
	if err != nil {
		return nil, err
	}
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return nil, domain.ErrConflict
	}
	if err := s.repo.UpdateGroupName(groupId, trimmed); err != nil {
		return nil, err
	}
	group.Name = trimmed
	return group, nil
}
```

(The `roles` import is used by the next two tasks in this same file.)

- [ ] **Step 4: Run to verify it passes**

Run: `go test ./internal/core/services/ -run TestRenameGroup -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/core/services/group_admin.go internal/core/services/group_admin_test.go
git commit -m "feat(api): RenameGroup service (admin only, non-blank)"
```

---

### Task 10: Service — KickMember

**Files:**
- Modify: `internal/core/services/group_admin.go`
- Modify: `internal/core/services/group_admin_test.go`

- [ ] **Step 1: Write the failing tests**

Append to `group_admin_test.go`:

```go
func TestKickMember_AdminRemovesMember(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	repo.SaveMember(&domain.Member{Id: "BOB", Role: roles.Member, GroupId: "G1", GroupName: "Family"})
	svc := New(repo, &fakeIdP{})

	if err := svc.KickMember("ADMIN", "G1", "BOB"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if m, _ := repo.GetMember("G1", "BOB"); m != nil {
		t.Fatalf("BOB should be removed")
	}
}

func TestKickMember_NonAdminForbidden(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	repo.SaveMember(&domain.Member{Id: "BOB", Role: roles.Member, GroupId: "G1", GroupName: "Family"})
	repo.SaveMember(&domain.Member{Id: "EVE", Role: roles.Member, GroupId: "G1", GroupName: "Family"})
	svc := New(repo, &fakeIdP{})

	if err := svc.KickMember("BOB", "G1", "EVE"); err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

func TestKickMember_CannotKickSelf(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	svc := New(repo, &fakeIdP{})

	if err := svc.KickMember("ADMIN", "G1", "ADMIN"); err != domain.ErrConflict {
		t.Fatalf("expected ErrConflict kicking self, got %v", err)
	}
}

func TestKickMember_TargetNotMember(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	svc := New(repo, &fakeIdP{})

	if err := svc.KickMember("ADMIN", "G1", "GHOST"); err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `go test ./internal/core/services/ -run TestKickMember -v`
Expected: FAIL — `KickMember` undefined.

- [ ] **Step 3: Implement**

Append to `group_admin.go`:

```go
// KickMember removes a member and all their data in the group. Admin only;
// the admin cannot kick themselves (they delete the group instead).
func (s *service) KickMember(requesterId, groupId, targetMemberId string) error {
	if _, err := s.requireGroupAdmin(groupId, requesterId); err != nil {
		return err
	}
	if targetMemberId == requesterId {
		return domain.ErrConflict
	}
	target, err := s.repo.GetMember(groupId, targetMemberId)
	if err != nil {
		return err
	}
	if target == nil {
		return domain.ErrNotFound
	}
	return s.repo.DeleteMemberGroupData(targetMemberId, groupId)
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `go test ./internal/core/services/ -run TestKickMember -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/core/services/group_admin.go internal/core/services/group_admin_test.go
git commit -m "feat(api): KickMember service (admin only, not self)"
```

---

### Task 11: Service — LeaveGroup (sole admin cannot leave)

**Files:**
- Modify: `internal/core/services/group_admin.go`
- Modify: `internal/core/services/group_admin_test.go`

- [ ] **Step 1: Write the failing tests**

Append to `group_admin_test.go`:

```go
func TestLeaveGroup_MemberLeaves(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	repo.SaveMember(&domain.Member{Id: "BOB", Role: roles.Member, GroupId: "G1", GroupName: "Family"})
	svc := New(repo, &fakeIdP{})

	if err := svc.LeaveGroup("BOB", "G1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if m, _ := repo.GetMember("G1", "BOB"); m != nil {
		t.Fatalf("BOB should have left")
	}
}

func TestLeaveGroup_SoleAdminCannotLeave(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	repo.SaveMember(&domain.Member{Id: "BOB", Role: roles.Member, GroupId: "G1", GroupName: "Family"})
	svc := New(repo, &fakeIdP{})

	if err := svc.LeaveGroup("ADMIN", "G1"); err != domain.ErrSoleAdmin {
		t.Fatalf("expected ErrSoleAdmin, got %v", err)
	}
	if m, _ := repo.GetMember("G1", "ADMIN"); m == nil {
		t.Fatalf("ADMIN must remain")
	}
}

func TestLeaveGroup_NotAMember(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	svc := New(repo, &fakeIdP{})

	if err := svc.LeaveGroup("STRANGER", "G1"); err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `go test ./internal/core/services/ -run TestLeaveGroup -v`
Expected: FAIL — `LeaveGroup` undefined.

- [ ] **Step 3: Implement**

Append to `group_admin.go`:

```go
// LeaveGroup removes the requester (self) from the group. The sole admin
// cannot leave — they must delete the group (or, future, transfer admin).
func (s *service) LeaveGroup(requesterId, groupId string) error {
	member, err := s.repo.GetMember(groupId, requesterId)
	if err != nil {
		return err
	}
	if member == nil {
		return domain.ErrNotFound
	}
	if member.Role == roles.GroupAdmin {
		members, err := s.repo.ListGroupMembers(groupId)
		if err != nil {
			return err
		}
		admins := 0
		for _, m := range members {
			if m.Role == roles.GroupAdmin {
				admins++
			}
		}
		if admins <= 1 {
			return domain.ErrSoleAdmin
		}
	}
	return s.repo.DeleteMemberGroupData(requesterId, groupId)
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `go test ./internal/core/services/ -run TestLeaveGroup -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add internal/core/services/group_admin.go internal/core/services/group_admin_test.go
git commit -m "feat(api): LeaveGroup service (sole admin cannot leave)"
```

---

### Task 12: Service — DeleteGroup

**Files:**
- Modify: `internal/core/services/group_admin.go`
- Modify: `internal/core/services/group_admin_test.go`

- [ ] **Step 1: Write the failing tests**

Append to `group_admin_test.go`:

```go
func TestDeleteGroup_AdminCascades(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	repo.SaveMember(&domain.Member{Id: "BOB", Role: roles.Member, GroupId: "G1", GroupName: "Family"})
	svc := New(repo, &fakeIdP{})

	if err := svc.DeleteGroup("ADMIN", "G1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.groups["G1"] != nil {
		t.Fatalf("group should be gone")
	}
	if len(repo.deleted) != 1 || repo.deleted[0] != "G1" {
		t.Fatalf("expected cascade for G1, got %+v", repo.deleted)
	}
}

func TestDeleteGroup_NonAdminForbidden(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	repo.SaveMember(&domain.Member{Id: "BOB", Role: roles.Member, GroupId: "G1", GroupName: "Family"})
	svc := New(repo, &fakeIdP{})

	if err := svc.DeleteGroup("BOB", "G1"); err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
	if repo.groups["G1"] == nil {
		t.Fatalf("group must NOT be deleted")
	}
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `go test ./internal/core/services/ -run TestDeleteGroup -v`
Expected: FAIL — `DeleteGroup` undefined.

- [ ] **Step 3: Implement**

Append to `group_admin.go`:

```go
// DeleteGroup removes the group and all related data. Admin only.
func (s *service) DeleteGroup(requesterId, groupId string) error {
	if _, err := s.requireGroupAdmin(groupId, requesterId); err != nil {
		return err
	}
	return s.repo.DeleteGroupCascade(groupId)
}
```

- [ ] **Step 4: Run full service suite**

Run: `go test ./internal/core/services/ -v`
Expected: PASS (all tasks 5–12 green).

- [ ] **Step 5: Commit**

```bash
git add internal/core/services/group_admin.go internal/core/services/group_admin_test.go
git commit -m "feat(api): DeleteGroup service (admin only, cascade)"
```

---

### Task 13: Add new service methods to the `PlannerService` port

**Files:**
- Modify: `internal/core/ports/` (the `PlannerService` interface file)

- [ ] **Step 1: Extend the interface**

Add to `PlannerService`:

```go
	CreateInvite(requesterId string, groupId string) (*domain.Invite, error)
	ListInvites(requesterId string, groupId string) ([]*domain.Invite, error)
	GetInvite(code string) (*domain.Invite, error)
	RedeemInvite(requesterId string, requesterName string, code string) (*domain.Group, bool, error)
	RevokeInvite(requesterId string, groupId string, code string) error
	RenameGroup(requesterId string, groupId string, name string) (*domain.Group, error)
	KickMember(requesterId string, groupId string, targetMemberId string) error
	LeaveGroup(requesterId string, groupId string) error
	DeleteGroup(requesterId string, groupId string) error
```

- [ ] **Step 2: Build & full test**

Run: `go build ./... && go test ./...`
Expected: success; all tests pass. (`*service` already implements these.)

- [ ] **Step 3: Commit**

```bash
git add internal/core/ports/
git commit -m "feat(api): extend PlannerService port with group-management methods"
```

---

### Task 14: HTTP handlers + DTOs

Thin adapters; verified by curl (Task 16). Map sentinel errors to status codes.

**Files:**
- Modify: `internal/core/handlers/models.go`
- Create: `internal/core/handlers/groups_admin.go`
- Create: `internal/core/handlers/invites.go`

- [ ] **Step 1: Add request/response DTOs**

Append to `internal/core/handlers/models.go`:

```go
type RenameGroupRequest struct {
	Name string `json:"name"`
}

type CreateInviteResponse struct {
	Code      string `json:"code"`
	ExpiresAt string `json:"expiresAt"`
}

type InviteResponse struct {
	GroupName string `json:"groupName"`
	ExpiresAt string `json:"expiresAt"`
}

type InviteListItem struct {
	Code      string `json:"code"`
	ExpiresAt string `json:"expiresAt"`
}

type RedeemInviteResponse struct {
	GroupId       string `json:"groupId"`
	GroupName     string `json:"groupName"`
	AlreadyMember bool   `json:"alreadyMember"`
}
```

- [ ] **Step 2: Add a shared error→status mapper**

Append to `internal/core/handlers/helper.go`:

```go
import "errors" // merge into the existing import block

// abortWithServiceError maps service sentinel errors to HTTP status codes.
func abortWithServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrForbidden):
		c.JSON(http.StatusForbidden, gin.H{"message": "Forbidden."})
	case errors.Is(err, domain.ErrNotFound), errors.Is(err, domain.ErrExpired):
		c.JSON(http.StatusNotFound, gin.H{"message": "Not found."})
	case errors.Is(err, domain.ErrConflict), errors.Is(err, domain.ErrSoleAdmin):
		c.JSON(http.StatusConflict, gin.H{"message": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal error."})
	}
}
```

Add the import `"isnan.eu/meal-planner/functions/api/internal/core/domain"` to `helper.go`.

- [ ] **Step 3: Group-admin handlers**

Create `internal/core/handlers/groups_admin.go`:

```go
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// PUT /api/groups/:groupId
func (hdl *HTTPHandler) RenameGroup(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")

	var req RenameGroupRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request."})
		return
	}
	group, err := hdl.svc.RenameGroup(info.userId, groupId, req.Name)
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	log.Info().Msgf("Group '%s' renamed to '%s'.", groupId, group.Name)
	c.JSON(http.StatusOK, CreateGroupResponse{Id: group.Id, Name: group.Name, CreatedAt: ""})
}

// DELETE /api/groups/:groupId
func (hdl *HTTPHandler) DeleteGroup(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	if err := hdl.svc.DeleteGroup(info.userId, groupId); err != nil {
		abortWithServiceError(c, err)
		return
	}
	log.Info().Msgf("Group '%s' deleted.", groupId)
	c.Status(http.StatusNoContent)
}

// DELETE /api/groups/:groupId/members/:memberId
func (hdl *HTTPHandler) KickMember(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	memberId := c.Param("memberId")
	if err := hdl.svc.KickMember(info.userId, groupId, memberId); err != nil {
		abortWithServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// DELETE /api/groups/:groupId/members/me
func (hdl *HTTPHandler) LeaveGroup(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	if err := hdl.svc.LeaveGroup(info.userId, groupId); err != nil {
		abortWithServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
```

- [ ] **Step 4: Invite handlers**

Create `internal/core/handlers/invites.go`:

```go
package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// POST /api/groups/:groupId/invites
func (hdl *HTTPHandler) CreateInvite(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	inv, err := hdl.svc.CreateInvite(info.userId, groupId)
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	log.Info().Msgf("Invite created for group '%s'.", groupId)
	c.JSON(http.StatusCreated, CreateInviteResponse{
		Code:      inv.Code,
		ExpiresAt: inv.ExpiresAt.Format(time.RFC3339),
	})
}

// GET /api/groups/:groupId/invites
func (hdl *HTTPHandler) ListInvites(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	invites, err := hdl.svc.ListInvites(info.userId, groupId)
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	out := make([]InviteListItem, 0, len(invites))
	for _, inv := range invites {
		out = append(out, InviteListItem{Code: inv.Code, ExpiresAt: inv.ExpiresAt.Format(time.RFC3339)})
	}
	c.JSON(http.StatusOK, gin.H{"invites": out})
}

// GET /api/invites/:code
func (hdl *HTTPHandler) GetInvite(c *gin.Context) {
	code := c.Param("code")
	inv, err := hdl.svc.GetInvite(code)
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, InviteResponse{
		GroupName: inv.GroupName,
		ExpiresAt: inv.ExpiresAt.Format(time.RFC3339),
	})
}

// POST /api/invites/:code/redeem
func (hdl *HTTPHandler) RedeemInvite(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	code := c.Param("code")
	group, already, err := hdl.svc.RedeemInvite(info.userId, info.userName, code)
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	log.Info().Msgf("User '%s' redeemed invite to group '%s' (already=%v).", info.userName, group.Id, already)
	c.JSON(http.StatusOK, RedeemInviteResponse{
		GroupId: group.Id, GroupName: group.Name, AlreadyMember: already,
	})
}

// DELETE /api/groups/:groupId/invites/:code
func (hdl *HTTPHandler) RevokeInvite(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	code := c.Param("code")
	if err := hdl.svc.RevokeInvite(info.userId, groupId, code); err != nil {
		abortWithServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
```

- [ ] **Step 5: Build & vet**

Run: `go build ./... && go vet ./...`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add internal/core/handlers/
git commit -m "feat(api): handlers + DTOs for group management endpoints"
```

---

### Task 15: Wire routes

**Files:**
- Modify: `cmd/api/main.go`

- [ ] **Step 1: Register the routes**

In `cmd/api/main.go`, add inside the `api` group (after the existing routes; all stay behind `RequireApproved`, consistent with the spec — there is no public endpoint):

```go
	api.PUT("/groups/:groupId", h.RenameGroup)
	api.DELETE("/groups/:groupId", h.DeleteGroup)

	api.POST("/groups/:groupId/invites", h.CreateInvite)
	api.GET("/groups/:groupId/invites", h.ListInvites)
	api.DELETE("/groups/:groupId/invites/:code", h.RevokeInvite)

	api.GET("/invites/:code", h.GetInvite)
	api.POST("/invites/:code/redeem", h.RedeemInvite)

	api.DELETE("/groups/:groupId/members/me", h.LeaveGroup)
	api.DELETE("/groups/:groupId/members/:memberId", h.KickMember)
```

> Gin routing note: register `/groups/:groupId/members/me` **before** `/groups/:groupId/members/:memberId` so `me` is matched as the literal route. If Gin reports a wildcard conflict, keep the literal `me` route first; both share the same `:groupId` segment which is fine.

- [ ] **Step 2: Build**

Run: `go build ./...`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add cmd/api/main.go
git commit -m "feat(api): wire group-management routes"
```

---

### Task 16: Local smoke test (curl) + full build/lint

**Files:** none (verification only)

- [ ] **Step 1: Run the API locally**

Run (from `packages/functions`): `make run-api-local`
Expected: Gin starts on `:8080` (LWA mode). It needs AWS creds + the real DynamoDB table (per `cli.md`/`backend.md`); use the same environment the existing local run uses.

- [ ] **Step 2: Obtain an approved user's ID token**

Use an existing approved account (the schedules endpoints already require this). Sign in via the web client or Cognito and copy the ID token. Export it: `export TOK=<id-token>`.

- [ ] **Step 3: Exercise the happy path**

```bash
# create a group
curl -s -XPOST localhost:8080/api/groups -H "Authorization: $TOK" -H 'Content-Type: application/json' -d '{"name":"Smoke Test"}'
# -> {"id":"<GID>","name":"Smoke Test",...} ; export GID=<GID>

# create invite
curl -s -XPOST localhost:8080/api/groups/$GID/invites -H "Authorization: $TOK"
# -> 201 {"code":"<CODE>","expiresAt":"..."} ; export CODE=<CODE>

# list invites
curl -s localhost:8080/api/groups/$GID/invites -H "Authorization: $TOK"
# -> {"invites":[{"code":"<CODE>","expiresAt":"..."}]}

# get invite details
curl -s localhost:8080/api/invites/$CODE -H "Authorization: $TOK"
# -> {"groupName":"Smoke Test","expiresAt":"..."}

# redeem as the SAME user (already a member -> idempotent)
curl -s -XPOST localhost:8080/api/invites/$CODE/redeem -H "Authorization: $TOK"
# -> 200 {"groupId":"<GID>","groupName":"Smoke Test","alreadyMember":true}

# rename
curl -s -XPUT localhost:8080/api/groups/$GID -H "Authorization: $TOK" -H 'Content-Type: application/json' -d '{"name":"Smoke Renamed"}'
# -> 200 {"id":"<GID>","name":"Smoke Renamed",...}

# revoke
curl -s -o /dev/null -w "%{http_code}\n" -XDELETE localhost:8080/api/groups/$GID/invites/$CODE -H "Authorization: $TOK"
# -> 204

# delete group
curl -s -o /dev/null -w "%{http_code}\n" -XDELETE localhost:8080/api/groups/$GID -H "Authorization: $TOK"
# -> 204
```

Expected: status codes and bodies as annotated.

- [ ] **Step 4: Exercise error paths**

```bash
# unknown invite -> 404
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/api/invites/NOPE -H "Authorization: $TOK"   # 404
# revoke nonexistent group's invite -> 404/403
curl -s -o /dev/null -w "%{http_code}\n" -XDELETE localhost:8080/api/groups/$GID/invites/NOPE -H "Authorization: $TOK"
```

- [ ] **Step 5: Full build, vet, test**

Run: `go build ./... && go vet ./... && go test ./...`
Expected: all green.

- [ ] **Step 6: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "test(api): smoke-test fixes for group-management endpoints"
```

---

### Task 17: Update backend docs

**Files:**
- Modify: `.claude/backend.md`

- [ ] **Step 1: Update the API Endpoints + Group Management sections**

In `.claude/backend.md`:
- Mark the invite/rename/delete/kick/leave endpoints as **implemented** (they are currently described as design).
- Add notes: invite codes are crypto-strong 32-char (UUID-derived); invites are **reusable** until 7-day TTL or revoke; expiry is checked **in code** (lazy TTL); redeem is **idempotent + conditional** (no admin downgrade, no duplicate membership); revoke authorizes on the invite's **stored GroupId**; rename updates only the Group record (denormalized names left stale by design).
- Note these endpoints return **real HTTP status codes** (403/404/409/204), unlike the older 500-for-all handlers.

- [ ] **Step 2: Commit**

```bash
git add .claude/backend.md
git commit -m "docs: mark group-management API implemented; note invite semantics"
```

---

## Self-Review

**Spec coverage (§4 of the spec):**
- Invite entity + keys + TTL/crypto code → Tasks 1, 2, 4. ✅
- Endpoints (rename, delete, create/list/get/redeem/revoke invite, kick, leave) → Tasks 5–15. ✅
- Idempotent redeem / conditional write / no downgrade (findings 2,5,8) → Task 7 + Task 4 Step 3. ✅
- Revoke IDOR (finding 7) → Task 8. ✅
- Code entropy/crypto RNG (finding 1) → Task 1. ✅
- `GET` minimal disclosure + expiry-in-code (finding 6) → Task 6. ✅
- Proper status codes → Task 14 Step 2. ✅
- Sole-admin-can't-leave → Task 11. ✅
- Cascade deletes → Task 4 Step 5, Tasks 10/12. ✅
- Testing (idempotent redeem keeps Admin, IDOR, sole-admin, cascade) → Tasks 7,8,11,12. ✅
- Docs update → Task 17. ✅
- Deferred (rate limiting, max-uses, pending-join #3) → intentionally absent. ✅

**Out-of-scope confirmations:** `?g=` hint, InvitePage, localStorage, Web Share, approval-gap UX → all **frontend** (companion plan). The backend's only approval interaction is that redeem sits behind `RequireApproved` (existing middleware, unchanged).

**Type/name consistency:** `RedeemInvite` returns `(*domain.Group, bool, error)` in service (Task 7), port (Task 13), and handler (Task 14). Repo method names (`CreateMemberIfNotExists`, `ListGroupMembers`, `UpdateGroupName`, `DeleteMemberGroupData`, `DeleteGroupCascade`, `SaveInvite`/`GetInvite`/`ListGroupInvites`/`DeleteInvite`) match across ports (Task 3), fake (Task 3), and real repo (Task 4). Sentinel errors (`ErrForbidden/ErrNotFound/ErrExpired/ErrConflict/ErrSoleAdmin`) defined in Task 2, used in services (5–12) and mapped in Task 14.

**Placeholder scan:** none — every code step shows complete code; every run step shows the command + expected result.
