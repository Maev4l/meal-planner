package services

import (
	"fmt"

	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain/roles"
	"isnan.eu/meal-planner/api/internal/helper"
)

func (s *service) DeleteUser(tenantId string, userId string) error {

	return nil
}

func (s *service) RegisterUser(name string, password string) (string, error) {
	valid := validateUsername(name)
	if !valid {
		log.Error().Msgf("username '%s' is reserved.", name)
		return "", fmt.Errorf("failed to register username: '%s'", name)
	}

	subject, err := s.idp.RegisterUser(name, password, string(roles.RegularUser))

	if err != nil {
		return "", err
	}

	id := helper.Normalize(subject)

	return id, nil
}
