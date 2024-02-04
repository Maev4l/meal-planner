package services

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/snabb/isoweek"
	"isnan.eu/meal-planner/api/internal/core/domain"
)

func computeMemberComments(year int, week int,
	scheduleBase *domain.ScheduleBase,
	memberComments *domain.MemberComments) *domain.MemberComments {
	if memberComments != nil {
		return memberComments
	}

	return &domain.MemberComments{
		ScheduleBase: *scheduleBase,
		Year:         year,
		WeekNumber:   week,
		WeeklyComments: domain.WeeklyComments{
			Monday:    domain.Comments{Lunch: "", Dinner: ""},
			Tuesday:   domain.Comments{Lunch: "", Dinner: ""},
			Wednesday: domain.Comments{Lunch: "", Dinner: ""},
			Thursday:  domain.Comments{Lunch: "", Dinner: ""},
			Friday:    domain.Comments{Lunch: "", Dinner: ""},
			Saturday:  domain.Comments{Lunch: "", Dinner: ""},
			Sunday:    domain.Comments{Lunch: "", Dinner: ""},
		},
	}
}

func computeMemberSchedule(year int, week int, defaultSchedule *domain.MemberDefaultSchedule, memberSchedule *domain.MemberSchedule) *domain.MemberSchedule {
	if memberSchedule != nil {
		return &domain.MemberSchedule{
			ScheduleBase: memberSchedule.ScheduleBase,
			Overriden:    true,
			Year:         year,
			WeekNumber:   week,
			WeeklySchedule: domain.WeeklySchedule{
				Monday:    memberSchedule.Monday,
				Tuesday:   memberSchedule.Tuesday,
				Wednesday: memberSchedule.Wednesday,
				Thursday:  memberSchedule.Thursday,
				Friday:    memberSchedule.Friday,
				Saturday:  memberSchedule.Saturday,
				Sunday:    memberSchedule.Sunday,
			},
		}
	}

	return &domain.MemberSchedule{
		ScheduleBase: defaultSchedule.ScheduleBase,
		Overriden:    false,
		Year:         year,
		WeekNumber:   week,
		WeeklySchedule: domain.WeeklySchedule{
			Monday:    defaultSchedule.Monday,
			Tuesday:   defaultSchedule.Tuesday,
			Wednesday: defaultSchedule.Wednesday,
			Thursday:  defaultSchedule.Thursday,
			Friday:    defaultSchedule.Friday,
			Saturday:  defaultSchedule.Saturday,
			Sunday:    defaultSchedule.Sunday,
		},
	}
}

func (s *service) GetSchedules(memberId string, period string) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, []*domain.MemberComments, error) {
	p := strings.Split(period, "-")
	if len(p) != 2 {
		log.Error().Msgf("Incorrect period format: %s.", period)
		return nil, nil, nil, fmt.Errorf("incorrect period format")
	}

	y := p[0]
	w := p[1]

	year, err := strconv.Atoi(y)
	if err != nil {
		log.Error().Msgf("Incorrect year value: %s.", y)
		return nil, nil, nil, fmt.Errorf("incorrect year value: %s", y)
	}

	week, err := strconv.Atoi(w)
	if err != nil {
		log.Error().Msgf("Incorrect week value: %s.", w)
		return nil, nil, nil, fmt.Errorf("incorrect week value: %s", w)
	}

	valid := isoweek.Validate(year, week)
	if !valid {
		log.Error().Msgf("Invalid calendar week '%d-%d'.", year, week)
		return nil, nil, nil, fmt.Errorf("invalid calendar week '%d-%d'", year, week)
	}

	// TODO: Check if the period is too far in the past

	// TODO: Check if the period is too far in the future

	// Retrieve schedules (requester's schedules across groups + members of the groups requester belongs to) for the period
	defaultSchedules, memberSchedules, memberComments, _ := s.repo.GetMemberSchedulesAndComments(memberId, year, week)

	// Group by member id
	defaultSchedulesByMember := map[string]*domain.MemberDefaultSchedule{}
	memberSchedulesByMember := map[string]*domain.MemberSchedule{}
	memberCommentsByMember := map[string]*domain.MemberComments{}

	for _, s := range defaultSchedules {
		defaultSchedulesByMember[s.MemberId] = s
	}

	for _, s := range memberSchedules {
		memberSchedulesByMember[s.MemberId] = s
	}

	for _, c := range memberComments {
		memberCommentsByMember[c.MemberId] = c
	}

	computedMemberSchedules := []*domain.MemberSchedule{}
	computedMemberComments := []*domain.MemberComments{}

	// For each member, compute the schedule and the comments for the period
	for userId, defaultSchedule := range defaultSchedulesByMember {

		memberSchedule := memberSchedulesByMember[userId]

		// Compute schedule
		computedMemberSchedule := computeMemberSchedule(year, week, defaultSchedule, memberSchedule)
		computedMemberSchedules = append(computedMemberSchedules, computedMemberSchedule)

		// Compute comments
		comments := memberCommentsByMember[userId]
		computedComments := computeMemberComments(year, week, &defaultSchedule.ScheduleBase, comments)
		computedMemberComments = append(computedMemberComments, computedComments)

	}

	return defaultSchedules, computedMemberSchedules, computedMemberComments, nil
}

func (s *service) CreateSchedule(memberId string, groupId string,
	year int, week int,
	weeklySchedule *domain.WeeklySchedule) error {

	// Check if the calendar week is valid
	valid := isoweek.Validate(year, week)
	if !valid {
		log.Error().Msgf("Invalid calendar week '%d-%d'.", year, week)
		return fmt.Errorf("invalid calendar week '%d-%d'", year, week)
	}

	group, member, err := s.validateGroupOperation(groupId, memberId)
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
		ScheduleBase: domain.ScheduleBase{
			MemberId:   member.Id,
			MemberName: member.Name,
			GroupId:    group.Id,
			GroupName:  group.Name,
			CreatedAt:  &current,
		},
		WeeklySchedule: *weeklySchedule,
	}

	err = s.repo.SaveMemberSchedule(group, member, &schedule)
	if err != nil {
		return err
	}

	return nil
}

func (s *service) CreateDefaultSchedule(memberId string, groupId string, weeklySchedule *domain.WeeklySchedule) error {

	group, member, err := s.validateGroupOperation(groupId, memberId)
	if err != nil {
		return err
	}

	if group == nil && member == nil {
		return fmt.Errorf("schedule creation failed")
	}

	current := time.Now().UTC()
	schedule := domain.MemberDefaultSchedule{
		ScheduleBase: domain.ScheduleBase{
			MemberId:   member.Id,
			MemberName: member.Name,
			GroupId:    group.Id,
			GroupName:  group.Name,
			CreatedAt:  &current,
		},
		WeeklySchedule: *weeklySchedule,
	}

	err = s.repo.SaveMemberDefaultSchedule(group, member, &schedule)
	if err != nil {
		return err
	}

	return nil
}
