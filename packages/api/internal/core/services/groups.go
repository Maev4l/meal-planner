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
	}

	err = s.repo.SaveMember(&group, &member, roles.GroupAdmin)

	if err != nil {
		return nil, err
	}

	return &group, nil
}
