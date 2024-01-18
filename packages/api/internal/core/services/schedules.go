package services

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/snabb/isoweek"
	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/helper"
)

func (s *service) validateScheduleOperation(groupId string, memberId string) (*domain.Group, *domain.Member, error) {
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

func computeMemberSchedule(year int, week int, defaultSchedule *domain.MemberDefaultSchedule, memberSchedule *domain.MemberSchedule) *domain.MemberSchedule {
	if memberSchedule != nil {
		return &domain.MemberSchedule{
			Overriden:  true,
			Year:       year,
			WeekNumber: week,
			Schedule:   memberSchedule.Schedule,
		}
	}

	return &domain.MemberSchedule{
		Overriden:  false,
		Year:       year,
		WeekNumber: week,
		Schedule:   *defaultSchedule,
	}
}

func (s *service) GetSchedules(memberId string, period string) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, error) {
	p := strings.Split(period, "-")
	if len(p) != 2 {
		log.Error().Msgf("Incorrect period format: %s.", period)
		return nil, nil, fmt.Errorf("incorrect period format")
	}

	y := p[0]
	w := p[1]

	year, err := strconv.Atoi(y)
	if err != nil {
		log.Error().Msgf("Incorrect year value: %s.", y)
		return nil, nil, fmt.Errorf("incorrect year value: %s", y)
	}

	week, err := strconv.Atoi(w)
	if err != nil {
		log.Error().Msgf("Incorrect week value: %s.", w)
		return nil, nil, fmt.Errorf("incorrect week value: %s", w)
	}

	valid := isoweek.Validate(year, week)
	if !valid {
		log.Error().Msgf("Invalid calendar week '%d-%d'.", year, week)
		return nil, nil, fmt.Errorf("invalid calendar week '%d-%d'", year, week)
	}

	// TODO: Check if the period is too far in the past

	// TODO: Check if the period is too far in the future

	// Retrieve schedules (requester's schedules across groups + members of the groups requester belongs to) for the period
	defaultSchedules, memberSchedules, _ := s.repo.GetMemberSchedules(memberId, helper.NewScheduleId(year, week))

	// Group by member id
	defaultSchedulesByMember := map[string]*domain.MemberDefaultSchedule{}
	memberSchedulesByMember := map[string]*domain.MemberSchedule{}

	for _, s := range defaultSchedules {
		defaultSchedulesByMember[s.MemberId] = s
	}

	for _, s := range memberSchedules {
		memberSchedulesByMember[s.Schedule.MemberId] = s
	}

	computedMemberSchedules := []*domain.MemberSchedule{}

	// For each member, compute the schedule for the period
	for userId, defaultSchedule := range defaultSchedulesByMember {

		var computerMemberSchedule *domain.MemberSchedule
		memberSchedule := memberSchedulesByMember[userId]

		computerMemberSchedule = computeMemberSchedule(year, week, defaultSchedule, memberSchedule)

		computedMemberSchedules = append(computedMemberSchedules, computerMemberSchedule)
	}

	return defaultSchedules, computedMemberSchedules, nil
}

func (s *service) CreateSchedule(memberId string, groupId string,
	year int, week int,
	mon int, tues int, wed int, thu int, fri int, sat int, sun int) error {

	// Check if the calendar week is valid
	valid := isoweek.Validate(year, week)
	if !valid {
		log.Error().Msgf("Invalid calendar week '%d-%d'.", year, week)
		return fmt.Errorf("invalid calendar week '%d-%d'", year, week)
	}

	group, member, err := s.validateScheduleOperation(groupId, memberId)
	if err != nil {
		return err
	}

	if group == nil && member == nil {
		return fmt.Errorf("schedule creation failed")
	}

	current := time.Now().UTC()

	schedule := domain.MemberSchedule{
		Year:       year,
		WeekNumber: week,
		Schedule: domain.MemberDefaultSchedule{
			MemberId:   member.Id,
			MemberName: member.Name,
			GroupId:    group.Id,
			GroupName:  group.Name,
			WeeklySchedule: domain.WeeklySchedule{
				Monday:    mon,
				Tuesday:   tues,
				Wednesday: wed,
				Thursday:  thu,
				Friday:    fri,
				Saturday:  sat,
				Sunday:    sun,
			},
			CreatedAt: &current,
		},
	}

	err = s.repo.SaveMemberSchedule(group, member, &schedule)
	if err != nil {
		return err
	}

	return nil
}

func (s *service) CreateDefaultSchedule(memberId string, groupId string,
	mon int, tues int, wed int, thu int, fri int, sat int, sun int) error {

	group, member, err := s.validateScheduleOperation(groupId, memberId)
	if err != nil {
		return err
	}

	if group == nil && member == nil {
		return fmt.Errorf("schedule creation failed")
	}

	current := time.Now().UTC()
	schedule := domain.MemberDefaultSchedule{
		MemberId:   member.Id,
		MemberName: member.Name,
		GroupId:    group.Id,
		GroupName:  group.Name,
		WeeklySchedule: domain.WeeklySchedule{
			Monday:    mon,
			Tuesday:   tues,
			Wednesday: wed,
			Thursday:  thu,
			Friday:    fri,
			Saturday:  sat,
			Sunday:    sun,
		},
		CreatedAt: &current,
	}

	err = s.repo.SaveMemberDefaultSchedule(group, member, &schedule)
	if err != nil {
		return err
	}

	return nil
}
