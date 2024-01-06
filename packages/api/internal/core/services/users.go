package services

import (
	"fmt"

	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/core/domain/roles"
)

func (s *service) UnregisterUser(userName string) error {

	return nil
}

func (s *service) RegisterUser(name string, password string) (*domain.User, error) {
	valid := validateUsername(name)
	if !valid {
		log.Error().Msgf("username '%s' is reserved.", name)
		return nil, fmt.Errorf("failed to register username: '%s'", name)
	}

	user, err := s.idp.RegisterUser(name, password, string(roles.RegularUser))

	if err != nil {
		return nil, err
	}

	return user, nil
}
