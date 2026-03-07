package repositories

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/functions/api/internal/core/domain"
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

// parseUserAttributes extracts custom:Id and name from Cognito attributes
func parseUserAttributes(attributes []types.AttributeType) (id, name string) {
	for _, att := range attributes {
		switch *att.Name {
		case "custom:Id":
			id = *att.Value
		case "name":
			name = *att.Value
		}
	}
	return id, name
}

func (i *idp) GetUser(username string) (*domain.User, error) {
	resp, err := i.client.AdminGetUser(context.TODO(), &cognitoidentityprovider.AdminGetUserInput{
		UserPoolId: aws.String(userPoolId),
		Username:   aws.String(username),
	})

	if err != nil {
		log.Error().Msgf("Failed to get user '%s': %s", username, err.Error())
		return nil, err
	}

	if resp == nil {
		log.Warn().Msgf("User '%s' does not exist.", username)
		return nil, nil
	}

	id, name := parseUserAttributes(resp.UserAttributes)

	return &domain.User{
		Id:        id,
		Name:      name,
		CreatedAt: resp.UserCreateDate,
	}, nil
}
