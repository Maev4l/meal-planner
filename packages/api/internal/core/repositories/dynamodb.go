package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/snabb/isoweek"

	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain"
	"isnan.eu/meal-planner/api/internal/core/domain/roles"
	"isnan.eu/meal-planner/api/internal/helper"
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

func (d *dynamo) SaveMemberSchedule(g *domain.Group, m *domain.Member, s *domain.MemberSchedule) error {
	// compute TTL
	year, month, day := isoweek.StartDate(s.Year, s.WeekNumber)
	start, _ := time.Parse(time.DateOnly, fmt.Sprintf("%d-%02d-%02d", year, month, day))
	expiresAt := start.AddDate(0, 0, 14)

	record := MemberSchedule{
		Schedule: Schedule{
			PK:                     createSchedulePK(m.Id),
			SK:                     createScheduleSK(s.GetId(), g.Id),
			GSI1PK:                 createScheduleSecondary1PK(g.Id),
			GSI1SK:                 createScheduleSecondary1SK(s.GetId()),
			Year:                   s.Year,
			WeekNumber:             s.WeekNumber,
			MemberId:               m.Id,
			MemberName:             m.Name,
			MemberRole:             string(m.Role),
			GroupId:                g.Id,
			GroupName:              g.Name,
			Monday:                 s.Monday.Meals,
			Tuesday:                s.Tuesday.Meals,
			Wednesday:              s.Wednesday.Meals,
			Thursday:               s.Thursday.Meals,
			Friday:                 s.Friday.Meals,
			Saturday:               s.Saturday.Meals,
			Sunday:                 s.Sunday.Meals,
			CreatedAt:              s.CreatedAt,
			MondayLunchComment:     s.Monday.Comments.Lunch,
			MondayDinnerComment:    s.Monday.Comments.Dinner,
			TuesdayLunchComment:    s.Tuesday.Comments.Lunch,
			TuesdayDinnerComment:   s.Tuesday.Comments.Dinner,
			WednesdayLunchComment:  s.Wednesday.Comments.Lunch,
			WednesdayDinnerComment: s.Wednesday.Comments.Dinner,
			ThursdayLunchComment:   s.Thursday.Comments.Lunch,
			ThursdayDinnerComment:  s.Thursday.Comments.Dinner,
			FridayLunchComment:     s.Friday.Comments.Lunch,
			FridayDinnerComment:    s.Friday.Comments.Dinner,
			SaturdayLunchComment:   s.Saturday.Comments.Lunch,
			SaturdayDinnerComment:  s.Saturday.Comments.Dinner,
			SundayLunchComment:     s.Sunday.Comments.Lunch,
			SundayDinnerComment:    s.Sunday.Comments.Dinner,
		},
		ExpiresAt: &expiresAt,
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Msgf("Failed to marshal member '%s''s schedule '%s': %s", m.Name, s.GetId(), err.Error())
		return err
	}

	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	if err != nil {
		log.Error().Msgf("Failed to put member '%s''s schedule '%s': %s", m.Name, s.GetId(), err.Error())
		return err
	}

	return nil
}

func (d *dynamo) SaveMemberDefaultSchedule(g *domain.Group, m *domain.Member, s *domain.MemberDefaultSchedule) error {

	record := Schedule{
		PK:         createSchedulePK(m.Id),
		SK:         createScheduleSK(s.GetId(), g.Id),
		GSI1PK:     createScheduleSecondary1PK(g.Id),
		GSI1SK:     createScheduleSecondary1SK(s.GetId()),
		MemberId:   m.Id,
		MemberName: m.Name,
		GroupId:    g.Id,
		GroupName:  g.Name,
		MemberRole: string(m.Role),
		Monday:     s.WeeklySchedule.Monday.Meals,
		Tuesday:    s.WeeklySchedule.Tuesday.Meals,
		Wednesday:  s.WeeklySchedule.Wednesday.Meals,
		Thursday:   s.WeeklySchedule.Thursday.Meals,
		Friday:     s.WeeklySchedule.Friday.Meals,
		Saturday:   s.WeeklySchedule.Saturday.Meals,
		Sunday:     s.WeeklySchedule.Sunday.Meals,
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

func (d *dynamo) fetchSchedulesByGroup(groupId string) ([]*Schedule, error) {
	query := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("GSI1"),
		KeyConditionExpression: aws.String("#pk = :groupId and begins_with(#sk,:schedule_prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":groupId": &types.AttributeValueMemberS{
				Value: createScheduleSecondary1PK(groupId),
			},
			":schedule_prefix": &types.AttributeValueMemberS{
				Value: "schedule#",
			},
		},
		ExpressionAttributeNames: map[string]string{
			"#pk": "GSI1PK",
			"#sk": "GSI1SK",
		},
	}

	records := []*Schedule{}

	queryPaginator := dynamodb.NewQueryPaginator(d.client, &query)

	ctx := context.TODO()
	for i := 0; queryPaginator.HasMorePages(); i++ {
		result, err := queryPaginator.NextPage(ctx)
		if err != nil {
			log.Error().Msgf("Failed to query group '%s' schedules: %s.", groupId, err.Error())
			return nil, err
		}

		if result.Count > 0 {
			for _, item := range result.Items {

				record := Schedule{}
				if err := attributevalue.UnmarshalMap(item, &record); err != nil {
					log.Warn().Msgf("Failed to unmarshal group '%s' schedule: %s", groupId, err.Error())
				}
				records = append(records, &record)
			}
		}
	}

	return records, nil
}

func (d *dynamo) fetchGroupsByMember(memberId string) ([]*Group, error) {
	query := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("#pk = :memberId and begins_with(#sk,:group_prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":memberId": &types.AttributeValueMemberS{
				Value: createSchedulePK(memberId),
			},
			":group_prefix": &types.AttributeValueMemberS{
				Value: "group#",
			},
		},
		ExpressionAttributeNames: map[string]string{
			"#pk": "PK",
			"#sk": "SK",
		},
	}

	records := []*Group{}

	queryPaginator := dynamodb.NewQueryPaginator(d.client, &query)

	ctx := context.TODO()
	for i := 0; queryPaginator.HasMorePages(); i++ {
		result, err := queryPaginator.NextPage(ctx)
		if err != nil {
			log.Error().Msgf("Failed to query member '%s' groups: %s.",
				memberId,
				err.Error())
			return nil, err
		}

		if result.Count > 0 {
			for _, item := range result.Items {

				record := Group{}
				if err := attributevalue.UnmarshalMap(item, &record); err != nil {
					log.Warn().Msgf("Failed to unmarshal group for member '%s': %s", memberId, err.Error())
				}
				records = append(records, &record)
			}
		}
	}

	return records, nil
}

func (d *dynamo) GetMemberSchedules(memberId string, scheduleId string) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, error) {

	// Fetch all membership across groups for the given member
	groups, _ := d.fetchGroupsByMember(memberId)

	// Fetch all schedules for theses groups
	schedules := []*Schedule{}
	for _, g := range groups {
		res, _ := d.fetchSchedulesByGroup(g.Id)
		schedules = append(schedules, res...)
	}

	// Filter out schedules which are not in the period except default schedules
	schedules = helper.Filter(schedules, func(s *Schedule) bool {
		id := s.getId()
		return id == domain.MEMBER_DEFAULT_SCHEDULE_ID || id == scheduleId
	})

	memberSchedules := []*domain.MemberSchedule{}
	defaultSchedules := []*domain.MemberDefaultSchedule{}
	for _, s := range schedules {
		if s.isDefault() {
			defaultSchedule := domain.MemberDefaultSchedule{
				ScheduleBase: domain.ScheduleBase{
					MemberId:   s.MemberId,
					MemberName: s.MemberName,
					GroupId:    s.GroupId,
					GroupName:  s.GroupName,
					Role:       roles.GROUP_ROLE(s.MemberRole),
					CreatedAt:  s.CreatedAt,
				},
				WeeklySchedule: domain.WeeklySchedule{
					Monday:    domain.DailySchedule{Meals: s.Monday},
					Tuesday:   domain.DailySchedule{Meals: s.Tuesday},
					Wednesday: domain.DailySchedule{Meals: s.Wednesday},
					Thursday:  domain.DailySchedule{Meals: s.Thursday},
					Friday:    domain.DailySchedule{Meals: s.Friday},
					Saturday:  domain.DailySchedule{Meals: s.Saturday},
					Sunday:    domain.DailySchedule{Meals: s.Sunday},
				},
			}

			defaultSchedules = append(defaultSchedules, &defaultSchedule)

		} else {
			memberSchedule := domain.MemberSchedule{
				Year:       s.Year,
				WeekNumber: s.WeekNumber,
				ScheduleBase: domain.ScheduleBase{
					MemberId:   s.MemberId,
					MemberName: s.MemberName,
					GroupId:    s.GroupId,
					GroupName:  s.GroupName,
					CreatedAt:  s.CreatedAt,
				},
				WeeklySchedule: domain.WeeklySchedule{
					Monday: domain.DailySchedule{
						Meals: s.Monday,
						Comments: domain.Comments{
							Lunch:  s.MondayLunchComment,
							Dinner: s.MondayDinnerComment,
						},
					},
					Tuesday: domain.DailySchedule{
						Meals: s.Tuesday,
						Comments: domain.Comments{
							Lunch:  s.TuesdayLunchComment,
							Dinner: s.TuesdayDinnerComment,
						},
					},
					Wednesday: domain.DailySchedule{
						Meals: s.Wednesday,
						Comments: domain.Comments{
							Lunch:  s.WednesdayLunchComment,
							Dinner: s.WednesdayDinnerComment,
						},
					},
					Thursday: domain.DailySchedule{
						Meals: s.Thursday,
						Comments: domain.Comments{
							Lunch:  s.ThursdayLunchComment,
							Dinner: s.ThursdayDinnerComment,
						},
					},
					Friday: domain.DailySchedule{
						Meals: s.Friday,
						Comments: domain.Comments{
							Lunch:  s.FridayLunchComment,
							Dinner: s.FridayDinnerComment,
						},
					},
					Saturday: domain.DailySchedule{
						Meals: s.Saturday,
						Comments: domain.Comments{
							Lunch:  s.SaturdayLunchComment,
							Dinner: s.SaturdayDinnerComment,
						},
					},
					Sunday: domain.DailySchedule{
						Meals: s.Sunday,
						Comments: domain.Comments{
							Lunch:  s.SundayLunchComment,
							Dinner: s.SundayDinnerComment,
						},
					},
				},
			}

			memberSchedules = append(memberSchedules, &memberSchedule)
		}
	}

	return defaultSchedules, memberSchedules, nil

}

func (d *dynamo) GetMember(groupId string, memberId string) (*domain.Member, error) {

	memberPK, _ := attributevalue.Marshal(createMemberPK(memberId))
	memberSK, _ := attributevalue.Marshal(createMemberSK(groupId))

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
		PK:        createMemberPK(m.Id),
		SK:        createMemberSK(m.GroupId),
		GSI1PK:    createMemberSecondary1PK(m.GroupId),
		GSI1SK:    createMemberSecondary1SK(m.Id),
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
