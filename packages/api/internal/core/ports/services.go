package ports

import (
	"isnan.eu/meal-planner/api/internal/core/domain"
)

type PlannerService interface {
	RegisterUser(name string, password string) (*domain.User, error)
	UnregisterUser(username string) error
	CreateGroup(memberId string, memberName string, groupName string) (*domain.Group, error)
	CreateMember(requesterMemberId string, groupId string, memberName string, admin bool) (*domain.Member, error)
	CreateSchedule(memberId string, groupId string, year int, week int, schedule *domain.WeeklySchedule) error
	CreateDefaultSchedule(memberId string, groupId string, schedule *domain.WeeklySchedule) error
	GetSchedules(memberId string, period string) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, error)
}
