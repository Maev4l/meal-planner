package services

import (
	"fmt"
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

func (s *service) GetData(memberId string, period string) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, []*domain.MemberComments, []*domain.Notice, error) {

	year, week, err := s.parsePeriod(period)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	// Retrieve schedules (requester's schedules across groups + members of the groups requester belongs to) for the period
	defaultSchedules, memberSchedules, memberComments, memberNotices, _ := s.repo.GetMemberData(memberId, year, week)

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

	return defaultSchedules, computedMemberSchedules, computedMemberComments, memberNotices, nil
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
