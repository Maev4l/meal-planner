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
