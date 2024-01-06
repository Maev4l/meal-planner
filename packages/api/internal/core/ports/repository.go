package ports

import (
	"isnan.eu/meal-planner/api/internal/core/domain"
)

type PlannerRepository interface {
	SaveGroup(g *domain.Group) error
	GetGroup(groupId string) (*domain.Group, error)
	SaveMember(m *domain.Member) error
	GetMember(groupId string, memberId string) (*domain.Member, error)
}
