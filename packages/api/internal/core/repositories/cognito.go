package repositories

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain"
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

// parseUserId extracts the user ID from Cognito user attributes
func parseUserId(attributes []types.AttributeType) string {
	for _, att := range attributes {
		if *(att.Name) == "sub" {
			return helper.Normalize((*att.Value))
		}
	}
	return ""
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

	id := parseUserId(resp.UserAttributes)

	return &domain.User{
		Id:        id,
		Name:      *resp.Username,
		CreatedAt: resp.UserCreateDate,
	}, nil
}
