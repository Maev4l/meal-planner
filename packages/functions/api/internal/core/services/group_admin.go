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

// DeleteGroup removes the group and all related data. Admin only.
func (s *service) DeleteGroup(requesterId, groupId string) error {
	if _, err := s.requireGroupAdmin(groupId, requesterId); err != nil {
		return err
	}
	return s.repo.DeleteGroupCascade(groupId)
}
