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
	groups  map[string]*domain.Group
	members map[memberKey]*domain.Member
	invites map[string]*domain.Invite
	deleted []string
}

func newFakeRepo() *fakeRepo {
	return &fakeRepo{
		groups:  map[string]*domain.Group{},
		members: map[memberKey]*domain.Member{},
		invites: map[string]*domain.Invite{},
	}
}

func (f *fakeRepo) SaveGroup(g *domain.Group) error                { f.groups[g.Id] = g; return nil }
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
func (f *fakeRepo) SaveInvite(inv *domain.Invite) error           { f.invites[inv.Code] = inv; return nil }
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
func (f *fakeRepo) DeleteNotice(*domain.Group, *domain.Member, int, int) error     { return nil }

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

// --- test helpers ---

func ptr(t time.Time) *time.Time { return &t }

// seedGroupWithAdmin sets up a group whose admin is adminId.
func seedGroupWithAdmin(f *fakeRepo, groupId, groupName, adminId string) {
	f.SaveGroup(&domain.Group{Id: groupId, Name: groupName})
	f.SaveMember(&domain.Member{Id: adminId, Name: "Admin", Role: roles.GroupAdmin, GroupId: groupId, GroupName: groupName})
}
