package services

import (
	"time"

	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/core/domain/roles"
	"isnan.eu/meal-planner/api/internal/helper"
)

func (s *service) CreateGroup(memberId string, memberName string, groupName string) (*domain.Group, error) {

	groupId := helper.NewId()

	current := time.Now().UTC()
	group := domain.Group{
		Id:        groupId,
		Name:      groupName,
		CreatedAt: &current,
	}

	// FIXME: Needs a transaction here
	err := s.repo.SaveGroup(&group)
	if err != nil {
		return nil, err
	}

	member := domain.Member{
		Id:        memberId,
		Name:      memberName,
		CreatedAt: &current,
		Role:      roles.GroupAdmin,
		GroupId:   group.Id,
		GroupName: groupName,
	}

	err = s.repo.SaveMember(&member)

	if err != nil {
		return nil, err
	}

	// Save the default schedule for this membership
	schedule := domain.MemberDefaultSchedule{
		ScheduleBase: domain.ScheduleBase{MemberId: memberId,
			MemberName: member.Name,
			GroupId:    group.Id,
			GroupName:  group.Name,
			CreatedAt:  &current,
		},
		WeeklySchedule: domain.SystemDefaultWeeklySchedule,
	}

	err = s.repo.SaveMemberDefaultSchedule(&group, &member, &schedule)
	if err != nil {
		return nil, err
	}

	return &group, nil
}
