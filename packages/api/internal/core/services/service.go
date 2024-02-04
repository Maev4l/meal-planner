package services

import (
	"slices"

	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/core/ports"
)

var RESERVED_USERNAMES = []string{"admin"}

func validateUsername(name string) bool {
	index := slices.IndexFunc(RESERVED_USERNAMES, func(s string) bool { return s == name })
	return (index == -1)
}

func (s *service) validateGroupOperation(groupId string, memberId string) (*domain.Group, *domain.Member, error) {
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

		requester, err := s.repo.GetMember(groupId, memberId)
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

	// Check if the group exists
	getGroupRes := <-getGroupOut
	if getGroupRes.err != nil {
		return nil, nil, getGroupRes.err
	}

	if getGroupRes.group == nil {
		log.Error().Msgf("Group '%s' does not exists.", groupId)
		return nil, nil, nil
	}

	// Check if the requester is member of the group
	getMemberRes := <-getMemberOut
	if getMemberRes.err != nil {
		return nil, nil, getMemberRes.err
	}

	if getMemberRes.member == nil {
		log.Error().Msgf("Member '%s' does not belong to group '%s'.", memberId, groupId)
		return nil, nil, nil
	}

	return getGroupRes.group, getMemberRes.member, nil
}

type service struct {
	repo ports.PlannerRepository
	idp  ports.PlannerIdP
}

func New(repo ports.PlannerRepository, idp ports.PlannerIdP) *service {
	return &service{
		repo: repo,
		idp:  idp,
	}
}
