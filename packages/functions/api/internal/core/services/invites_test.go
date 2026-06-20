package services

import (
	"testing"
	"time"

	"isnan.eu/meal-planner/functions/api/internal/core/domain"
	"isnan.eu/meal-planner/functions/api/internal/core/domain/roles"
)

func TestCreateInvite_AdminSucceeds(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

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
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

	_, err := svc.CreateInvite("BOB", "G1")
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

func TestCreateInvite_NotAMemberForbidden(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

	_, err := svc.CreateInvite("STRANGER", "G1")
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden, got %v", err)
	}
}

func TestGetInvite_ValidReturnsIt(t *testing.T) {
	repo := newFakeRepo()
	now := time.Now().UTC()
	exp := now.Add(time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &exp})
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

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
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

	_, err := svc.GetInvite("C1")
	if err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound for expired, got %v", err)
	}
}

func TestGetInvite_UnknownIsNotFound(t *testing.T) {
	svc := New(newFakeRepo(), &fakeIdP{}, &fakeNotifier{})
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
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

	list, err := svc.ListInvites("ADMIN", "G1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(list) != 1 || list[0].Code != "LIVE" {
		t.Fatalf("expected only LIVE invite, got %+v", list)
	}
}

func TestRedeemInvite_NewMemberJoins(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	now := time.Now().UTC()
	exp := now.Add(time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &exp})
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

	group, already, err := svc.RedeemInvite("BOB", "Bob", "bob-user", "C1", false)
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
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

	if _, _, err := svc.RedeemInvite("BOB", "Bob", "bob-user", "C1", false); err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestRedeemInvite_UnknownIsNotFound(t *testing.T) {
	svc := New(newFakeRepo(), &fakeIdP{}, &fakeNotifier{})
	if _, _, err := svc.RedeemInvite("BOB", "Bob", "bob-user", "NOPE", false); err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound for unknown code, got %v", err)
	}
}

func TestRedeemInvite_AdminRedeemingOwnLinkKeepsAdmin(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	now := time.Now().UTC()
	exp := now.Add(time.Hour)
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family", CreatedAt: &now, ExpiresAt: &exp})
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

	group, already, err := svc.RedeemInvite("ADMIN", "Admin", "admin-user", "C1", false)
	if err != nil || !already || group.Id != "G1" {
		t.Fatalf("expected idempotent already=true, got group=%+v already=%v err=%v", group, already, err)
	}
	m, _ := repo.GetMember("G1", "ADMIN")
	if m == nil || m.Role != roles.GroupAdmin {
		t.Fatalf("ADMIN must remain admin, got %+v", m)
	}
}

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

func TestRevokeInvite_AdminDeletes(t *testing.T) {
	repo := newFakeRepo()
	seedGroupWithAdmin(repo, "G1", "Family", "ADMIN")
	repo.SaveInvite(&domain.Invite{Code: "C1", GroupId: "G1", GroupName: "Family"})
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

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
	svc := New(repo, &fakeIdP{}, &fakeNotifier{})

	// Admin of G1 passes their own group in the path but a G2 code: must be rejected.
	if err := svc.RevokeInvite("ADMIN", "G1", "C2"); err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden on group mismatch, got %v", err)
	}
	if repo.invites["C2"] == nil {
		t.Fatalf("G2 invite must NOT be deleted")
	}
}
