package services

import (
	"fmt"
	"slices"
	"strconv"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/snabb/isoweek"
	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/core/ports"
)

var RESERVED_USERNAMES = []string{"admin"}

func (s *service) parsePeriod(period string) (int, int, error) {
	p := strings.Split(period, "-")
	if len(p) != 2 {
		log.Error().Msgf("Incorrect period format: %s.", period)
		return 0, 0, fmt.Errorf("incorrect period format")
	}

	y := p[0]
	w := p[1]

	year, err := strconv.Atoi(y)
	if err != nil {
		log.Error().Msgf("Incorrect year value: %s.", y)
		return 0, 0, fmt.Errorf("incorrect year value: %s", y)
	}

	week, err := strconv.Atoi(w)
	if err != nil {
		log.Error().Msgf("Incorrect week value: %s.", w)
		return 0, 0, fmt.Errorf("incorrect week value: %s", w)
	}

	valid := isoweek.Validate(year, week)
	if !valid {
		log.Error().Msgf("Invalid calendar week '%d-%d'.", year, week)
		return 0, 0, fmt.Errorf("invalid calendar week '%d-%d'", year, week)
	}

	// TODO: Check if the period is too far in the past

	// TODO: Check if the period is too far in the future
	return year, week, nil

}

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
