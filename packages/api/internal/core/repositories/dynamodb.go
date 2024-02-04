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

func (d *dynamo) SaveMemberComments(g *domain.Group, m *domain.Member, c *domain.MemberComments) error {
	// compute TTL
	year, month, day := isoweek.StartDate(c.Year, c.WeekNumber)
	start, _ := time.Parse(time.DateOnly, fmt.Sprintf("%d-%02d-%02d", year, month, day))
	expiresAt := start.AddDate(0, 0, 14)

	record := Comments{
		PK:                     createCommentsPK(m.Id),
		SK:                     createCommentsSK(c.GetId(), g.Id),
		GSI1PK:                 createCommentsSecondary1PK(g.Id),
		GSI1SK:                 createCommentsSecondary1SK(c.GetId()),
		Year:                   c.Year,
		WeekNumber:             c.WeekNumber,
		MemberId:               m.Id,
		MemberName:             m.Name,
		MemberRole:             string(m.Role),
		GroupId:                g.Id,
		GroupName:              g.Name,
		MondayLunchComment:     c.Monday.Lunch,
		MondayDinnerComment:    c.Monday.Dinner,
		TuesdayLunchComment:    c.Tuesday.Lunch,
		TuesdayDinnerComment:   c.Tuesday.Dinner,
		WednesdayLunchComment:  c.Wednesday.Lunch,
		WednesdayDinnerComment: c.Wednesday.Dinner,
		ThursdayLunchComment:   c.Thursday.Lunch,
		ThursdayDinnerComment:  c.Thursday.Dinner,
		FridayLunchComment:     c.Friday.Lunch,
		FridayDinnerComment:    c.Friday.Dinner,
		SaturdayLunchComment:   c.Saturday.Lunch,
		SaturdayDinnerComment:  c.Saturday.Dinner,
		SundayLunchComment:     c.Sunday.Lunch,
		SundayDinnerComment:    c.Sunday.Dinner,
		CreatedAt:              c.CreatedAt,
		ExpiresAt:              &expiresAt,
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Msgf("Failed to marshal member '%s''s comments '%s': %s", m.Name, c.GetId(), err.Error())
		return err
	}

	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	if err != nil {
		log.Error().Msgf("Failed to put member '%s''s comments '%s': %s", m.Name, c.GetId(), err.Error())
		return err
	}

	return nil
}

func (d *dynamo) SaveMemberSchedule(g *domain.Group, m *domain.Member, s *domain.MemberSchedule) error {
	// compute TTL
	year, month, day := isoweek.StartDate(s.Year, s.WeekNumber)
	start, _ := time.Parse(time.DateOnly, fmt.Sprintf("%d-%02d-%02d", year, month, day))
	expiresAt := start.AddDate(0, 0, 14)

	record := MemberSchedule{
		Schedule: Schedule{
			PK:         createSchedulePK(m.Id),
			SK:         createScheduleSK(s.GetId(), g.Id),
			GSI1PK:     createScheduleSecondary1PK(g.Id),
			GSI1SK:     createScheduleSecondary1SK(s.GetId()),
			Year:       s.Year,
			WeekNumber: s.WeekNumber,
			MemberId:   m.Id,
			MemberName: m.Name,
			MemberRole: string(m.Role),
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
		Monday:     s.WeeklySchedule.Monday,
		Tuesday:    s.WeeklySchedule.Tuesday,
		Wednesday:  s.WeeklySchedule.Wednesday,
		Thursday:   s.WeeklySchedule.Thursday,
		Friday:     s.WeeklySchedule.Friday,
		Saturday:   s.WeeklySchedule.Saturday,
		Sunday:     s.WeeklySchedule.Sunday,
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

func (d *dynamo) fetchCommentsByGroup(groupId string) ([]*Comments, error) {
	query := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("GSI1"),
		KeyConditionExpression: aws.String("#pk = :groupId and begins_with(#sk,:comments_prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":groupId": &types.AttributeValueMemberS{
				Value: createCommentsSecondary1PK(groupId),
			},
			":comments_prefix": &types.AttributeValueMemberS{
				Value: "comments#",
			},
		},
		ExpressionAttributeNames: map[string]string{
			"#pk": "GSI1PK",
			"#sk": "GSI1SK",
		},
	}

	records := []*Comments{}
	queryPaginator := dynamodb.NewQueryPaginator(d.client, &query)

	ctx := context.TODO()
	for i := 0; queryPaginator.HasMorePages(); i++ {
		result, err := queryPaginator.NextPage(ctx)
		if err != nil {
			log.Error().Msgf("Failed to query group '%s' comments: %s.", groupId, err.Error())
			return nil, err
		}

		if result.Count > 0 {
			for _, item := range result.Items {

				record := Comments{}
				if err := attributevalue.UnmarshalMap(item, &record); err != nil {
					log.Warn().Msgf("Failed to unmarshal group '%s' comments: %s", groupId, err.Error())
				}
				records = append(records, &record)
			}
		}
	}

	log.Info().Msgf("===> Comments count: %d", len(records))

	return records, nil
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

func (d *dynamo) GetMemberSchedulesAndComments(memberId string, year int, week int) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, []*domain.MemberComments, error) {

	// Fetch all membership across groups for the given member
	groups, _ := d.fetchGroupsByMember(memberId)

	// Fetch all schedules for theses groups
	schedules := []*Schedule{}
	for _, g := range groups {
		res, _ := d.fetchSchedulesByGroup(g.Id)
		schedules = append(schedules, res...)
	}

	// Filter out schedules which are not in the period except default schedules
	scheduleId := helper.NewScheduleId(year, week)
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
					Monday:    s.Monday,
					Tuesday:   s.Tuesday,
					Wednesday: s.Wednesday,
					Thursday:  s.Thursday,
					Friday:    s.Friday,
					Saturday:  s.Saturday,
					Sunday:    s.Sunday,
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
					Monday:    s.Monday,
					Tuesday:   s.Tuesday,
					Wednesday: s.Wednesday,
					Thursday:  s.Thursday,
					Friday:    s.Friday,
					Saturday:  s.Saturday,
					Sunday:    s.Sunday,
				},
			}

			memberSchedules = append(memberSchedules, &memberSchedule)
		}
	}

	// Fetch all comments for these groups
	comments := []*Comments{}
	for _, g := range groups {
		res, _ := d.fetchCommentsByGroup(g.Id)
		comments = append(comments, res...)
	}
	// Filter out comments which are not in the period
	commentsId := helper.NewCommentsId(year, week)
	comments = helper.Filter(comments, func(c *Comments) bool {
		id := c.getId()
		return id == commentsId
	})

	memberComments := []*domain.MemberComments{}

	for _, c := range comments {
		memberComments = append(memberComments, &domain.MemberComments{
			Year:       c.Year,
			WeekNumber: c.WeekNumber,
			ScheduleBase: domain.ScheduleBase{
				MemberId:   c.MemberId,
				MemberName: c.MemberName,
				GroupId:    c.GroupId,
				GroupName:  c.GroupName,
				CreatedAt:  c.CreatedAt,
			},
			WeeklyComments: domain.WeeklyComments{
				Monday: domain.Comments{
					Lunch:  c.MondayLunchComment,
					Dinner: c.MondayDinnerComment,
				},
				Tuesday: domain.Comments{
					Lunch:  c.TuesdayLunchComment,
					Dinner: c.TuesdayDinnerComment,
				},
				Wednesday: domain.Comments{
					Lunch:  c.WednesdayLunchComment,
					Dinner: c.WednesdayDinnerComment,
				},
				Thursday: domain.Comments{
					Lunch:  c.ThursdayLunchComment,
					Dinner: c.ThursdayDinnerComment,
				},
				Friday: domain.Comments{
					Lunch:  c.FridayLunchComment,
					Dinner: c.FridayDinnerComment,
				},
				Saturday: domain.Comments{
					Lunch:  c.SaturdayLunchComment,
					Dinner: c.SaturdayDinnerComment,
				},
				Sunday: domain.Comments{
					Lunch:  c.SundayLunchComment,
					Dinner: c.SundayDinnerComment,
				},
			},
		})
	}

	return defaultSchedules, memberSchedules, memberComments, nil

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
