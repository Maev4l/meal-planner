package services

import (
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain"
)

func (s *service) CreateUser(tenantId string, name string, password string, admin bool) (*domain.User, error) {
	valid := validateUsername(name)
	if !valid {
		log.Error().Msgf("username '%s' is reserved.", name)
		return nil, fmt.Errorf("failed to register username: '%s'", name)
	}

	var role domain.ROLE
	if admin {
		role = domain.TenantAdmin
	} else {
		role = domain.Member
	}
	subject, err := s.idp.RegisterUser(name, password, tenantId, string(role))

	if err != nil {
		return nil, err
	}

	id := normalize(subject)
	current := time.Now().UTC()
	user := domain.User{
		Id:        id,
		Name:      name,
		CreatedAt: &current,
		TenantId:  tenantId,
		Role:      role,
	}

	err = s.repo.SaveUser(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
