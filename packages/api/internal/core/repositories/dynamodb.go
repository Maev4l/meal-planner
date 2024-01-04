package repositories

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain"
)

type dynamo struct {
	client *dynamodb.Client
}

func NewDynamoDB() *dynamo {
	config, _ := config.LoadDefaultConfig(context.TODO(), config.WithRegion(region))
	client := dynamodb.NewFromConfig(config)
	return &dynamo{
		client: client,
	}
}

func (d *dynamo) SaveUser(u *domain.User) error {
	record := User{
		PK:        createUserPK(u.TenantId),
		SK:        createUserSK(u.Id),
		Id:        u.Id,
		Name:      u.Name,
		TenantId:  u.TenantId,
		CreatedAt: u.CreatedAt,
		Role:      string(u.Role),
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Msgf("Failed to marshal user '%s': %s", u.Name, err.Error())
		return err
	}

	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	if err != nil {
		log.Error().Msgf("Failed to put user '%s': %s", u.Name, err.Error())
		return err
	}
	return nil
}

func (d *dynamo) SaveTenant(t *domain.Tenant) error {

	record := Tenant{
		PK:        createTenantPK(t.Id),
		SK:        createTenantSK(t.Id),
		Id:        t.Id,
		Name:      t.Name,
		CreatedAt: t.CreatedAt,
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Msgf("Failed to marshal tenant '%s': %s", t.Name, err.Error())
		return err
	}

	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	if err != nil {
		log.Error().Msgf("Failed to put tenant '%s': %s", t.Name, err.Error())
		return err
	}
	return nil
}
