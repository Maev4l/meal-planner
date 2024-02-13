package services

import (
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/snabb/isoweek"
	"isnan.eu/meal-planner/api/internal/core/domain"
)

func (s *service) DeleteNotice(memberId string, groupId string, period string) error {
	year, week, err := s.parsePeriod(period)
	if err != nil {
		return err
	}

	group, member, err := s.validateGroupOperation(groupId, memberId)
	if err != nil {
		return err
	}

	err = s.repo.DeleteNotice(group, member, year, week)
	if err != nil {
		return err
	}
	return nil
}

func (s *service) CreateNotice(memberId string, groupId string, year int, week int, content string) (*time.Time, error) {
	// Check if the calendar week is valid
	valid := isoweek.Validate(year, week)
	if !valid {
		log.Error().Msgf("Invalid calendar week '%d-%d'.", year, week)
		return nil, fmt.Errorf("invalid calendar week '%d-%d'", year, week)
	}

	group, member, err := s.validateGroupOperation(groupId, memberId)
	if err != nil {
		return nil, err
	}

	if group == nil && member == nil {
		return nil, fmt.Errorf("notice creation failed")
	}

	current := time.Now().UTC()

	notice := domain.Notice{
		Year:       year,
		WeekNumber: week,
		ScheduleBase: domain.ScheduleBase{
			MemberId:   member.Id,
			MemberName: member.Name,
			GroupId:    group.Id,
			GroupName:  group.Name,
			CreatedAt:  &current,
		},
		Content: content,
	}

	err = s.repo.SaveNotice(group, member, &notice)
	if err != nil {
		return nil, err
	}

	return &current, nil
}
