package services

import (
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/core/domain/roles"
)

func (s *service) CreateMember(requesterMemberId string, groupId string, memberName string, admin bool, guest bool) (*domain.Member, error) {

	type getGroupResp struct {
		group *domain.Group
		err   error
	}

	getGroupOut := make(chan getGroupResp)
	go func() {

		group, err := s.repo.GetGroup(groupId)
		if err != nil {
			getGroupOut <- getGroupResp{
				group: nil,
				err:   err,
			}
			return
		}

		getGroupOut <- getGroupResp{
			group: group,
			err:   nil,
		}
	}()

	type getMemberResp struct {
		member *domain.Member
		err    error
	}

	getMemberOut := make(chan getMemberResp)
	go func() {

		requester, err := s.repo.GetMember(groupId, requesterMemberId)
		if err != nil {
			getMemberOut <- getMemberResp{
				member: nil,
				err:    err,
			}
			return
		}

		getMemberOut <- getMemberResp{
			member: requester,
			err:    nil,
		}
	}()

	type getUserResp struct {
		user *domain.User
		err  error
	}

	getUserOut := make(chan getUserResp)
	go func() {

		user, err := s.idp.GetUser(memberName)
		if err != nil {
			getUserOut <- getUserResp{
				user: nil,
				err:  err,
			}
			return
		}
		getUserOut <- getUserResp{
			user: user,
			err:  nil,
		}
	}()

	// Check if the group exist
	getGroupRes := <-getGroupOut
	if getGroupRes.err != nil {
		return nil, getGroupRes.err
	}

	if getGroupRes.group == nil {
		log.Error().Msgf("Group '%s' does not exists.", groupId)
		return nil, fmt.Errorf("group '%s' does not exists", groupId)
	}

	// Check if the requestor is belong to the given group and is admin of the group
	getMemberRes := <-getMemberOut
	if getMemberRes.err != nil {
		return nil, getMemberRes.err
	}

	if getMemberRes.member == nil {
		log.Error().Msgf("Requester '%s' does not belong to group '%s'.", requesterMemberId, groupId)
		return nil, fmt.Errorf("requester '%s' does not belong to group '%s'", requesterMemberId, groupId)
	}

	if getMemberRes.member.Role != roles.GroupAdmin {
		log.Error().Msgf("Requester '%s' is not a admin for group '%s'.", requesterMemberId, groupId)
		return nil, fmt.Errorf("requester '%s' is not a admin for group '%s'", requesterMemberId, groupId)
	}

	// Check if the wanabee member exists in the IdP
	getUserRes := <-getUserOut
	if getUserRes.err != nil {
		return nil, getUserRes.err
	}

	if getUserRes.user == nil {
		log.Error().Msgf("User '%s' does not exists.", memberName)
		return nil, fmt.Errorf("user '%s' does not exists", memberName)
	}

	// Check if the wanabee member does not already belong to the group
	m, err := s.repo.GetMember(groupId, getUserRes.user.Id)
	if err != nil {
		return nil, err
	}

	if m != nil {
		log.Error().Msgf("User '%s' already belongs to group '%s'.", m.Name, groupId)
		return nil, fmt.Errorf("user '%s' already belongs to group '%s'", m.Name, groupId)
	}

	var role roles.GROUP_ROLE
	if admin {
		role = roles.GroupAdmin
	} else {
		role = roles.Member
	}
	current := time.Now().UTC()
	member := domain.Member{
		Id:        getUserRes.user.Id,
		Name:      memberName,
		CreatedAt: &current,
		Role:      role,
		GroupId:   getGroupRes.group.Id,
		GroupName: getGroupRes.group.Name,
	}

	// Save the membership
	err = s.repo.SaveMember(&member)
	if err != nil {
		return nil, err
	}

	// Save the default schedule for this membership
	schedule := domain.MemberDefaultSchedule{
		ScheduleBase: domain.ScheduleBase{
			MemberId:   member.Id,
			MemberName: member.Name,
			GroupId:    getGroupRes.group.Id,
			GroupName:  getGroupRes.group.Name,
			CreatedAt:  &current,
		},
	}

	// If the wanabee member has a guest status, default his schedule to the guest default schedule
	if guest {
		schedule.WeeklySchedule = domain.SystemDefaultGuestWeeklySchedule
	} else {
		schedule.WeeklySchedule = domain.SystemDefaultWeeklySchedule
	}

	err = s.repo.SaveMemberDefaultSchedule(getGroupRes.group, &member, &schedule)
	if err != nil {
		return nil, err
	}

	return &member, nil
}
