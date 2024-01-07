package repositories

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"

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

func (d *dynamo) SaveMemberDefaultSchedule(g *domain.Group, m *domain.Member, s *domain.MemberDefaultSchedule) error {

	record := Schedule{
		PK:         createSchedulePK(m.Id),
		SK:         createScheduleSK(s.GetId()),
		GSI1PK:     createScheduleSecondary1PK(g.Id),
		GSI1SK:     createScheduleSecondary1SK(s.GetId()),
		MemberId:   m.Id,
		MemberName: m.Name,
		GroupId:    g.Id,
		GroupName:  g.Name,
		Monday:     s.Monday,
		Tuesday:    s.Tuesday,
		Wednesday:  s.Wednesday,
		Thursday:   s.Thursday,
		Friday:     s.Friday,
		Saturday:   s.Saturday,
		Sunday:     s.Sunday,
		CreatedAt:  s.CreatedAt,
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Msgf("Failed to marshal member '%s''s default schedule: %s", m.Name, err.Error())
		return err
	}

	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	if err != nil {
		log.Error().Msgf("Failed to put member '%s''s default schedule: %s", m.Name, err.Error())
		return err
	}

	return nil
}

func (d *dynamo) GetMember(groupId string, memberId string) (*domain.Member, error) {

	memberPK, _ := attributevalue.Marshal(createMemberPK(groupId))
	memberSK, _ := attributevalue.Marshal(createMemberSK(memberId))

	result, err := d.client.GetItem(context.TODO(), &dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"PK": memberPK,
			"SK": memberSK,
		},
	})

	if err != nil {
		log.Error().Msgf("Failed to get member '%s' from group '%s': %s", memberId, groupId, err.Error())
		return nil, err
	}

	if result.Item == nil {
		log.Warn().Msgf("Member '%s' does not exist in group '%s'.", memberId, groupId)
		return nil, nil
	}

	var record Member
	err = attributevalue.UnmarshalMap(result.Item, &record)
	if err != nil {
		log.Error().Msgf("Failed to unmarshal member '%s' from group '%s': %s", memberId, groupId, err.Error())
		return nil, err
	}

	member := domain.Member{
		Id:        record.Id,
		Name:      record.Name,
		Role:      roles.GROUP_ROLE(record.Role),
		CreatedAt: record.CreatedAt,
		GroupId:   record.GroupId,
		GroupName: record.GroupName,
	}

	return &member, nil
}

func (d *dynamo) SaveMember(m *domain.Member) error {
	record := Member{
		PK:        createMemberPK(m.GroupId),
		SK:        createMemberSK(m.Id),
		Id:        m.Id,
		Name:      m.Name,
		GroupName: m.GroupName,
		GroupId:   m.GroupId,
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

func (d *dynamo) GetGroup(groupId string) (*domain.Group, error) {
	groupPK, _ := attributevalue.Marshal(createGroupPK(groupId))
	groupSK, _ := attributevalue.Marshal(createGroupSK(groupId))

	result, err := d.client.GetItem(context.TODO(), &dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"PK": groupPK,
			"SK": groupSK,
		},
	})

	if err != nil {
		log.Error().Msgf("Failed to get group '%s': %s", groupId, err.Error())
		return nil, err
	}

	if result.Item == nil {
		log.Warn().Msgf("Group '%s' does not exist.", groupId)
		return nil, nil
	}

	var record Group
	err = attributevalue.UnmarshalMap(result.Item, &record)
	if err != nil {
		log.Error().Msgf("Failed to unmarshal group '%s': %s", groupId, err.Error())
		return nil, err
	}

	group := domain.Group{
		Id:        record.Id,
		Name:      record.Name,
		CreatedAt: record.CreatedAt,
	}

	return &group, nil

}

func (d *dynamo) SaveGroup(g *domain.Group) error {

	record := Group{
		PK:        createGroupPK(g.Id),
		SK:        createGroupSK(g.Id),
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
