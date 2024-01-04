package ports

import "isnan.eu/meal-planner/api/internal/core/domain"

type PlannerRepository interface {
	SaveTenant(t *domain.Tenant) error
	SaveUser(u *domain.User) error
}
