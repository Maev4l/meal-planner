package ports

import (
	"time"

	"isnan.eu/meal-planner/api/internal/core/domain"
)

type PlannerService interface {
	RegisterUser(name string, password string) (*domain.User, error)
	UnregisterUser(username string) error
	CreateGroup(memberId string, memberName string, groupName string) (*domain.Group, error)
	CreateMember(requesterMemberId string, groupId string, memberName string, admin bool, guest bool) (*domain.Member, error)
	CreateSchedule(memberId string, groupId string, year int, week int, schedule *domain.WeeklySchedule) error
	CreateDefaultSchedule(memberId string, groupId string, schedule *domain.WeeklySchedule) error
	CreateComments(memberId string, groupId string, year int, week int, comments *domain.WeeklyComments) error
	GetData(memberId string, period string) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, []*domain.MemberComments, []*domain.Notice, error)
	CreateNotice(memberId string, groupId string, year int, week int, content string) (*time.Time, error)
	DeleteNotice(memberId string, groupId string, period string) error
}
