package repositories

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/core/domain/roles"
	"isnan.eu/meal-planner/api/internal/helper"
)

type idp struct {
	client *cognitoidentityprovider.Client
}

func NewCognito() *idp {
	config, _ := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	client := cognitoidentityprovider.NewFromConfig(config)
	return &idp{
		client: client,
	}
}

func parseUserAttributes(attributes []types.AttributeType) (string, string) {
	var id, appRole string
	for _, att := range attributes {
		if *(att.Name) == "sub" {
			id = helper.Normalize((*att.Value))
		}

		if *(att.Name) == "custom:Role" {
			appRole = (*att.Value)
		}
	}

	return id, appRole
}

func (i *idp) GetUser(name string) (*domain.User, error) {
	resp, err := i.client.AdminGetUser(context.TODO(), &cognitoidentityprovider.AdminGetUserInput{
		UserPoolId: aws.String(userPoolId),
		Username:   aws.String(name),
	})

	if err != nil {
		log.Error().Msgf("Failed to get user '%s': %s", name, err.Error())
		return nil, err
	}

	if resp == nil {
		log.Warn().Msgf("User '%s' does not exist.", name)
		return nil, nil
	}

	id, role := parseUserAttributes(resp.UserAttributes)

	return &domain.User{
		Id:        id,
		Name:      *resp.Username,
		CreatedAt: resp.UserCreateDate,
		Role:      roles.APPLICATION_ROLE(role),
	}, nil
}

func (i *idp) ListUsers() ([]*domain.User, error) {
	var users []*domain.User
	var paginationToken *string

	for {
		resp, err := i.client.ListUsers(context.TODO(), &cognitoidentityprovider.ListUsersInput{
			UserPoolId:      aws.String(userPoolId),
			PaginationToken: paginationToken,
		})

		if err != nil {
			log.Error().Msgf("Failed to list users: %s", err.Error())
			return nil, err
		}

		for _, u := range resp.Users {
			id, role := parseUserAttributes(u.Attributes)
			users = append(users, &domain.User{
				Id:        id,
				Name:      *u.Username,
				CreatedAt: u.UserCreateDate,
				Role:      roles.APPLICATION_ROLE(role),
			})
		}

		if resp.PaginationToken == nil {
			break
		}
		paginationToken = resp.PaginationToken
	}

	return users, nil
}

func (i *idp) RegisterUser(name string, password string, role string) (*domain.User, error) {

	resp, err := i.client.AdminCreateUser(context.TODO(), &cognitoidentityprovider.AdminCreateUserInput{
		UserPoolId:        aws.String(userPoolId),
		Username:          aws.String(name),
		TemporaryPassword: aws.String(password),
		UserAttributes: []types.AttributeType{
			{
				Name:  aws.String("custom:Role"),
				Value: aws.String(role),
			},
		},
	})

	if err != nil {
		log.Error().Msgf("Failed to register user '%s': %s", name, err.Error())
		return nil, err
	}

	_, err = i.client.AdminSetUserPassword(context.TODO(), &cognitoidentityprovider.AdminSetUserPasswordInput{
		UserPoolId: aws.String(userPoolId),
		Username:   aws.String(name),
		Password:   aws.String(password),
		Permanent:  true,
	})

	if err != nil {
		log.Error().Msgf("Failed to set password for user '%s': %s", name, err.Error())
		return nil, err
	}

	id, _ := parseUserAttributes(resp.User.Attributes)

	if id == "" {
		log.Error().Msgf("No sub attribute for user '%s'", name)
		return nil, fmt.Errorf("no sub attribute for user '%s'", name)
	}

	return &domain.User{
		Id:        id,
		Name:      *resp.User.Username,
		CreatedAt: resp.User.UserCreateDate,
		Role:      roles.APPLICATION_ROLE(role),
	}, nil
}
