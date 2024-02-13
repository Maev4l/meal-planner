package ports

import (
	"isnan.eu/meal-planner/api/internal/core/domain"
)

type PlannerRepository interface {
	SaveGroup(g *domain.Group) error
	GetGroup(groupId string) (*domain.Group, error)
	SaveMember(m *domain.Member) error
	GetMember(groupId string, memberId string) (*domain.Member, error)
	SaveMemberDefaultSchedule(g *domain.Group, m *domain.Member, s *domain.MemberDefaultSchedule) error
	SaveMemberSchedule(g *domain.Group, m *domain.Member, s *domain.MemberSchedule) error
	SaveMemberComments(g *domain.Group, m *domain.Member, s *domain.MemberComments) error
	GetMemberData(memberId string, year int, week int) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, []*domain.MemberComments, []*domain.Notice, error)
	SaveNotice(g *domain.Group, m *domain.Member, n *domain.Notice) error
	DeleteNotice(g *domain.Group, m *domain.Member, year int, week int) error
}
