package ports

import "isnan.eu/meal-planner/api/internal/core/domain"

type PlannerService interface {
	CreateTenant(tenantName string, adminTenantName string, adminPassword string) (*domain.Tenant, *domain.User, error)
	CreateUser(tenantId string, name string, password string, admin bool) (*domain.User, error)
}
