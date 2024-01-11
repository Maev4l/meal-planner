package ports

import (
	"isnan.eu/meal-planner/api/internal/core/domain"
)

type PlannerService interface {
	RegisterUser(name string, password string) (*domain.User, error)
	UnregisterUser(username string) error
	CreateGroup(memberId string, memberName string, groupName string) (*domain.Group, error)
	CreateMember(requesterMemberId string, groupId string, memberName string, admin bool) (*domain.Member, error)
	CreateSchedule(memberId string, groupId string, year int, week int, mon int, tues int, wed int, thu int, fri int, sat int, sun int) error
	CreateDefaultSchedule(memberId string, groupId string, mon int, tues int, wed int, thu int, fri int, sat int, sun int) error
	GetSchedules(memberId string, period string) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, error)
}
