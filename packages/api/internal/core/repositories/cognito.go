package repositories

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
	"github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider/types"
	"github.com/rs/zerolog/log"
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

func (i *idp) RegisterUser(name string, password string, tenantId string, role string) (string, error) {

	resp, err := i.client.AdminCreateUser(context.TODO(), &cognitoidentityprovider.AdminCreateUserInput{
		UserPoolId:        aws.String(userPoolId),
		Username:          aws.String(name),
		TemporaryPassword: aws.String(password),
		UserAttributes: []types.AttributeType{
			{
				Name:  aws.String("custom:TenantId"),
				Value: aws.String(tenantId),
			},
			{
				Name:  aws.String("custom:Role"),
				Value: aws.String(role),
			},
		},
	})

	if err != nil {
		log.Error().Msgf("Failed to register user '%s': %s", name, err.Error())
		return "", err
	}

	_, err = i.client.AdminSetUserPassword(context.TODO(), &cognitoidentityprovider.AdminSetUserPasswordInput{
		UserPoolId: aws.String(userPoolId),
		Username:   aws.String(name),
		Password:   aws.String(password),
		Permanent:  true,
	})

	if err != nil {
		log.Error().Msgf("Failed to set password for user '%s': %s", name, err.Error())
		return "", err
	}

	var id string
	for _, att := range resp.User.Attributes {
		if *(att.Name) == "sub" {
			id = (*att.Value)
			break
		}
	}

	if id == "" {
		log.Error().Msgf("No sub attribute for user '%s'", name)
		return "", fmt.Errorf("no sub attribute for user '%s'", name)
	}

	return id, nil
}
