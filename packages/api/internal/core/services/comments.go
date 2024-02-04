package services

import (
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/snabb/isoweek"
	"isnan.eu/meal-planner/api/internal/core/domain"
)

func (s *service) CreateComments(memberId string, groupId string, year int, week int, weeklyComments *domain.WeeklyComments) error {

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
		return fmt.Errorf("comments creation failed")
	}

	current := time.Now().UTC()

	comments := domain.MemberComments{
		Year:       year,
		WeekNumber: week,
		ScheduleBase: domain.ScheduleBase{
			MemberId:   member.Id,
			MemberName: member.Name,
			GroupId:    group.Id,
			GroupName:  group.Name,
			CreatedAt:  &current,
		},
		WeeklyComments: *weeklyComments,
	}
	err = s.repo.SaveMemberComments(group, member, &comments)
	if err != nil {
		return err
	}

	return nil
}
