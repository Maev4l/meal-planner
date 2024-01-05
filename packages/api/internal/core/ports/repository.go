package ports

import (
	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/core/domain/roles"
)

type PlannerRepository interface {
	SaveGroup(g *domain.Group) error
	SaveMember(g *domain.Group, m *domain.Member, role roles.GROUP_ROLE) error
}
