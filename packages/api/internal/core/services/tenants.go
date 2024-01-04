package services

import (
	"time"

	"isnan.eu/meal-planner/api/internal/core/domain"
)

func (s *service) CreateTenant(tenantName string, adminName string, adminPassword string) (*domain.Tenant, *domain.User, error) {

	tenantId := newId()

	user, err := s.CreateUser(tenantId, adminName, adminPassword, true)
	if err != nil {
		return nil, nil, err
	}

	current := time.Now().UTC()
	tenant := domain.Tenant{
		Id:        tenantId,
		Name:      tenantName,
		CreatedAt: &current,
	}

	err = s.repo.SaveTenant(&tenant)
	if err != nil {
		return nil, nil, err
	}

	return &tenant, user, nil
}
