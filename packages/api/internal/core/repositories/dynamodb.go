package repositories

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/core/domain/roles"
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

func (d *dynamo) SaveMember(g *domain.Group, m *domain.Member, role roles.GROUP_ROLE) error {
	record := User{
		PK:        createMemberPK(g),
		SK:        createMemberSK(m),
		Id:        m.Id,
		Name:      m.Name,
		GroupName: g.Name,
		GroupId:   g.Id,
		CreatedAt: m.CreatedAt,
		Role:      string(m.Role),
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Msgf("Failed to marshal member '%s': %s", m.Name, err.Error())
		return err
	}

	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	if err != nil {
		log.Error().Msgf("Failed to put member '%s': %s", m.Name, err.Error())
		return err
	}
	return nil
}

func (d *dynamo) SaveGroup(g *domain.Group) error {

	record := Group{
		PK:        createGroupPK(g),
		SK:        createGroupSK(g),
		Id:        g.Id,
		Name:      g.Name,
		CreatedAt: g.CreatedAt,
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Msgf("Failed to marshal group '%s': %s", g.Name, err.Error())
		return err
	}

	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	if err != nil {
		log.Error().Msgf("Failed to put group '%s': %s", g.Name, err.Error())
		return err
	}
	return nil
}
