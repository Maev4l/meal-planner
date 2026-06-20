package ports

import (
	"time"

	"isnan.eu/meal-planner/functions/api/internal/core/domain"
)

type PlannerService interface {
	CreateGroup(memberId string, memberName string, groupName string) (*domain.Group, error)
	CreateMember(requesterMemberId string, groupId string, memberName string, admin bool, guest bool) (*domain.Member, error)
	CreateSchedule(memberId string, groupId string, year int, week int, schedule *domain.WeeklySchedule) error
	CreateDefaultSchedule(memberId string, groupId string, schedule *domain.WeeklySchedule) error
	CreateComments(memberId string, groupId string, year int, week int, comments *domain.WeeklyComments) error
	GetData(memberId string, period string) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, []*domain.MemberComments, []*domain.Notice, error)
	CreateNotice(memberId string, groupId string, year int, week int, content string) (*time.Time, error)
	DeleteNotice(memberId string, groupId string, period string) error
	CreateInvite(requesterId string, groupId string) (*domain.Invite, error)
	ListInvites(requesterId string, groupId string) ([]*domain.Invite, error)
	GetInvite(code string) (*domain.Invite, error)
	RedeemInvite(requesterId string, requesterName string, requesterUsername string, code string, approved bool) (*domain.Group, bool, error)
	RevokeInvite(requesterId string, groupId string, code string) error
	RenameGroup(requesterId string, groupId string, name string) (*domain.Group, error)
	KickMember(requesterId string, groupId string, targetMemberId string) error
	LeaveGroup(requesterId string, groupId string) error
	DeleteGroup(requesterId string, groupId string) error
}
