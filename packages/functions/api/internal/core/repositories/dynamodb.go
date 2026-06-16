package repositories

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/snabb/isoweek"

	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/functions/api/internal/core/domain"
	"isnan.eu/meal-planner/functions/api/internal/core/domain/roles"
	"isnan.eu/meal-planner/functions/api/internal/helper"
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

func (d *dynamo) DeleteNotice(g *domain.Group, m *domain.Member, year int, week int) error {

	pk, _ := attributevalue.Marshal(createNoticePK(m.Id))
	sk, _ := attributevalue.Marshal(createNoticeSK(helper.NewCommentsId(year, week), g.Id))

	_, err := d.client.DeleteItem(context.TODO(), &dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"PK": pk,
			"SK": sk,
		},
	})

	if err != nil {
		log.Error().Msgf("Failed to remove member '%s''s notice '%d-%d': %s", m.Name, year, week, err.Error())
		return err
	}

	return nil
}

func (d *dynamo) SaveNotice(g *domain.Group, m *domain.Member, n *domain.Notice) error {
	// compute TTL
	year, month, day := isoweek.StartDate(n.Year, n.WeekNumber)
	start, _ := time.Parse(time.DateOnly, fmt.Sprintf("%d-%02d-%02d", year, month, day))
	expiresAt := start.AddDate(0, 0, 14)

	record := Notice{
		PK:         createNoticePK(m.Id),
		SK:         createNoticeSK(n.GetId(), g.Id),
		GSI1PK:     createNoticeSecondary1PK(g.Id),
		GSI1SK:     createNoticeSecondary1SK(n.GetId()),
		Year:       n.Year,
		WeekNumber: n.WeekNumber,
		MemberId:   m.Id,
		MemberName: m.Name,
		MemberRole: string(m.Role),
		GroupId:    g.Id,
		GroupName:  g.Name,
		Content:    n.Content,
		CreatedAt:  n.CreatedAt,
		ExpiresAt:  &expiresAt,
	}

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Msgf("Failed to marshal member '%s''s notice '%s': %s", m.Name, n.GetId(), err.Error())
		return err
	}

	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})

	if err != nil {
		log.Error().Msgf("Failed to put member '%s''s notice '%s': %s", m.Name, n.GetId(), err.Error())
		return err
	}

	return nil
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

func (d *dynamo) fetchNoticesByGroup(groupId string) ([]*Notice, error) {
	query := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("GSI1"),
		KeyConditionExpression: aws.String("#pk = :groupId and begins_with(#sk,:notice_prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":groupId": &types.AttributeValueMemberS{
				Value: createNoticeSecondary1PK(groupId),
			},
			":notice_prefix": &types.AttributeValueMemberS{
				Value: "notice#",
			},
		},
		ExpressionAttributeNames: map[string]string{
			"#pk": "GSI1PK",
			"#sk": "GSI1SK",
		},
	}

	records := []*Notice{}
	queryPaginator := dynamodb.NewQueryPaginator(d.client, &query)

	ctx := context.TODO()
	for i := 0; queryPaginator.HasMorePages(); i++ {
		result, err := queryPaginator.NextPage(ctx)
		if err != nil {
			log.Error().Msgf("Failed to query group '%s' notices: %s.", groupId, err.Error())
			return nil, err
		}

		if result.Count > 0 {
			for _, item := range result.Items {

				record := Notice{}
				if err := attributevalue.UnmarshalMap(item, &record); err != nil {
					log.Warn().Msgf("Failed to unmarshal group '%s' notice: %s", groupId, err.Error())
				}
				records = append(records, &record)
			}
		}
	}

	return records, nil
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

func (d *dynamo) GetMemberData(memberId string, year int, week int) ([]*domain.MemberDefaultSchedule, []*domain.MemberSchedule, []*domain.MemberComments, []*domain.Notice, error) {

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

	// Fetch all notice for these groups
	notices := []*Notice{}
	for _, g := range groups {
		res, _ := d.fetchNoticesByGroup(g.Id)
		notices = append(notices, res...)
	}

	// Filter out comments which are not in the period
	noticeId := helper.NewNoticeId(year, week)
	notices = helper.Filter(notices, func(n *Notice) bool {
		id := n.getId()
		return id == noticeId
	})

	// Sort notices
	sort.SliceStable(notices, func(i, j int) bool {
		return notices[i].CreatedAt.After(*notices[j].CreatedAt)
	})

	memberNotices := []*domain.Notice{}
	for _, n := range notices {
		memberNotices = append(memberNotices, &domain.Notice{
			Year:       n.Year,
			WeekNumber: n.WeekNumber,
			ScheduleBase: domain.ScheduleBase{
				MemberId:   n.MemberId,
				MemberName: n.MemberName,
				GroupId:    n.GroupId,
				GroupName:  n.GroupName,
				CreatedAt:  n.CreatedAt,
			},
			Content: n.Content,
		})
	}

	return defaultSchedules, memberSchedules, memberComments, memberNotices, nil

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

func (d *dynamo) SaveInvite(inv *domain.Invite) error {
	record := Invite{
		PK:        createInvitePK(inv.Code),
		SK:        createInviteSK(inv.Code),
		GSI1PK:    createInviteSecondary1PK(inv.GroupId),
		GSI1SK:    createInviteSecondary1SK(inv.Code),
		Code:      inv.Code,
		GroupId:   inv.GroupId,
		GroupName: inv.GroupName,
		CreatedBy: inv.CreatedBy,
		CreatedAt: inv.CreatedAt,
		ExpiresAt: inv.ExpiresAt,
	}
	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		log.Error().Msgf("Failed to marshal invite '%s': %s", inv.Code, err.Error())
		return err
	}
	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		log.Error().Msgf("Failed to put invite '%s': %s", inv.Code, err.Error())
	}
	return err
}

func (d *dynamo) GetInvite(code string) (*domain.Invite, error) {
	pk, _ := attributevalue.Marshal(createInvitePK(code))
	sk, _ := attributevalue.Marshal(createInviteSK(code))
	result, err := d.client.GetItem(context.TODO(), &dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key:       map[string]types.AttributeValue{"PK": pk, "SK": sk},
	})
	if err != nil {
		log.Error().Msgf("Failed to get invite '%s': %s", code, err.Error())
		return nil, err
	}
	if result.Item == nil {
		return nil, nil
	}
	var record Invite
	if err := attributevalue.UnmarshalMap(result.Item, &record); err != nil {
		log.Error().Msgf("Failed to unmarshal invite '%s': %s", code, err.Error())
		return nil, err
	}
	return &domain.Invite{
		Code: record.Code, GroupId: record.GroupId, GroupName: record.GroupName,
		CreatedBy: record.CreatedBy, CreatedAt: record.CreatedAt, ExpiresAt: record.ExpiresAt,
	}, nil
}

func (d *dynamo) ListGroupInvites(groupId string) ([]*domain.Invite, error) {
	query := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("GSI1"),
		KeyConditionExpression: aws.String("#pk = :groupId and begins_with(#sk,:invite_prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":groupId":       &types.AttributeValueMemberS{Value: createInviteSecondary1PK(groupId)},
			":invite_prefix": &types.AttributeValueMemberS{Value: "invite#"},
		},
		ExpressionAttributeNames: map[string]string{"#pk": "GSI1PK", "#sk": "GSI1SK"},
	}
	out := []*domain.Invite{}
	p := dynamodb.NewQueryPaginator(d.client, &query)
	for p.HasMorePages() {
		result, err := p.NextPage(context.TODO())
		if err != nil {
			log.Error().Msgf("Failed to list group '%s' invites: %s", groupId, err.Error())
			return nil, err
		}
		for _, item := range result.Items {
			var r Invite
			if err := attributevalue.UnmarshalMap(item, &r); err != nil {
				log.Warn().Msgf("Failed to unmarshal invite: %s", err.Error())
				continue
			}
			out = append(out, &domain.Invite{
				Code: r.Code, GroupId: r.GroupId, GroupName: r.GroupName,
				CreatedBy: r.CreatedBy, CreatedAt: r.CreatedAt, ExpiresAt: r.ExpiresAt,
			})
		}
	}
	return out, nil
}

func (d *dynamo) DeleteInvite(code string) error {
	pk, _ := attributevalue.Marshal(createInvitePK(code))
	sk, _ := attributevalue.Marshal(createInviteSK(code))
	_, err := d.client.DeleteItem(context.TODO(), &dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key:       map[string]types.AttributeValue{"PK": pk, "SK": sk},
	})
	if err != nil {
		log.Error().Msgf("Failed to delete invite '%s': %s", code, err.Error())
	}
	return err
}

// CreateMemberIfNotExists writes the member only if no item with the same
// PK/SK exists. Returns created=false (no error) when the membership already
// exists, so redeem stays idempotent and concurrent/double redeems can't
// create duplicate or partial state.
func (d *dynamo) CreateMemberIfNotExists(m *domain.Member) (bool, error) {
	record := Member{
		PK: createMemberPK(m.Id), SK: createMemberSK(m.GroupId),
		GSI1PK: createMemberSecondary1PK(m.GroupId), GSI1SK: createMemberSecondary1SK(m.Id),
		Id: m.Id, Name: m.Name, GroupName: m.GroupName, GroupId: m.GroupId,
		CreatedAt: m.CreatedAt, Role: string(m.Role),
	}
	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		return false, err
	}
	_, err = d.client.PutItem(context.TODO(), &dynamodb.PutItemInput{
		TableName:           aws.String(tableName),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(PK) AND attribute_not_exists(SK)"),
	})
	if err != nil {
		var cfe *types.ConditionalCheckFailedException
		if errors.As(err, &cfe) {
			return false, nil // already a member
		}
		log.Error().Msgf("Failed to conditionally create member '%s': %s", m.Name, err.Error())
		return false, err
	}
	return true, nil
}

func (d *dynamo) ListGroupMembers(groupId string) ([]*domain.Member, error) {
	query := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("GSI1"),
		KeyConditionExpression: aws.String("#pk = :groupId and begins_with(#sk,:member_prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":groupId":       &types.AttributeValueMemberS{Value: createMemberSecondary1PK(groupId)},
			":member_prefix": &types.AttributeValueMemberS{Value: "member#"},
		},
		ExpressionAttributeNames: map[string]string{"#pk": "GSI1PK", "#sk": "GSI1SK"},
	}
	out := []*domain.Member{}
	p := dynamodb.NewQueryPaginator(d.client, &query)
	for p.HasMorePages() {
		result, err := p.NextPage(context.TODO())
		if err != nil {
			log.Error().Msgf("Failed to list group '%s' members: %s", groupId, err.Error())
			return nil, err
		}
		for _, item := range result.Items {
			var r Member
			if err := attributevalue.UnmarshalMap(item, &r); err != nil {
				log.Warn().Msgf("Failed to unmarshal group '%s' member: %s", groupId, err.Error())
				continue
			}
			out = append(out, &domain.Member{
				Id: r.Id, Name: r.Name, Role: roles.GROUP_ROLE(r.Role),
				CreatedAt: r.CreatedAt, GroupId: r.GroupId, GroupName: r.GroupName,
			})
		}
	}
	return out, nil
}

// UpdateGroupName updates only the Group record's name. Denormalized GroupName
// on member/schedule records is intentionally left stale (out of scope) — the
// app reads the live name from the Group record / schedules payload.
func (d *dynamo) UpdateGroupName(groupId, name string) error {
	pk, _ := attributevalue.Marshal(createGroupPK(groupId))
	sk, _ := attributevalue.Marshal(createGroupSK(groupId))
	_, err := d.client.UpdateItem(context.TODO(), &dynamodb.UpdateItemInput{
		TableName:                 aws.String(tableName),
		Key:                       map[string]types.AttributeValue{"PK": pk, "SK": sk},
		UpdateExpression:          aws.String("SET #n = :name"),
		ExpressionAttributeNames:  map[string]string{"#n": "GroupName"},
		ExpressionAttributeValues: map[string]types.AttributeValue{":name": &types.AttributeValueMemberS{Value: name}},
	})
	if err != nil {
		log.Error().Msgf("Failed to rename group '%s': %s", groupId, err.Error())
	}
	return err
}

// deleteKeys deletes items in batches of 25 (BatchWriteItem limit).
func (d *dynamo) deleteKeys(keys []map[string]types.AttributeValue) error {
	for i := 0; i < len(keys); i += 25 {
		end := i + 25
		if end > len(keys) {
			end = len(keys)
		}
		reqs := make([]types.WriteRequest, 0, end-i)
		for _, k := range keys[i:end] {
			reqs = append(reqs, types.WriteRequest{DeleteRequest: &types.DeleteRequest{Key: k}})
		}
		pending := map[string][]types.WriteRequest{tableName: reqs}
		// BatchWriteItem is best-effort: returned UnprocessedItems must be retried,
		// or deletes can be silently dropped under throttling. Bounded retry.
		for attempt := 0; attempt < 5; attempt++ {
			out, err := d.client.BatchWriteItem(context.TODO(), &dynamodb.BatchWriteItemInput{
				RequestItems: pending,
			})
			if err != nil {
				log.Error().Msgf("Batch delete failed: %s", err.Error())
				return err
			}
			if len(out.UnprocessedItems) == 0 {
				break
			}
			pending = out.UnprocessedItems
			if attempt == 4 {
				log.Error().Msgf("Batch delete left %d unprocessed item groups after retries", len(pending))
				return fmt.Errorf("batch delete incomplete: unprocessed items remain")
			}
		}
	}
	return nil
}

// keyOnly is the minimal projection needed to delete an item.
type keyOnly struct {
	PK string `dynamodbav:"PK"`
	SK string `dynamodbav:"SK"`
}

func avKey(pk, sk string) map[string]types.AttributeValue {
	return map[string]types.AttributeValue{
		"PK": &types.AttributeValueMemberS{Value: pk},
		"SK": &types.AttributeValueMemberS{Value: sk},
	}
}

// DeleteGroupCascade removes every item belonging to the group (members,
// schedules, comments, notices, invites — all share GSI1PK=group#<id>) plus
// the Group record itself (which has no GSI1PK).
func (d *dynamo) DeleteGroupCascade(groupId string) error {
	query := dynamodb.QueryInput{
		TableName:                 aws.String(tableName),
		IndexName:                 aws.String("GSI1"),
		KeyConditionExpression:    aws.String("#pk = :groupId"),
		ExpressionAttributeValues: map[string]types.AttributeValue{":groupId": &types.AttributeValueMemberS{Value: createGroupPK(groupId)}},
		ExpressionAttributeNames:  map[string]string{"#pk": "GSI1PK"},
	}
	keys := []map[string]types.AttributeValue{}
	p := dynamodb.NewQueryPaginator(d.client, &query)
	for p.HasMorePages() {
		result, err := p.NextPage(context.TODO())
		if err != nil {
			log.Error().Msgf("Failed to query group '%s' items: %s", groupId, err.Error())
			return err
		}
		for _, item := range result.Items {
			var k keyOnly
			if err := attributevalue.UnmarshalMap(item, &k); err != nil {
				continue
			}
			keys = append(keys, avKey(k.PK, k.SK))
		}
	}
	// The Group record itself (PK=SK=group#<id>) is not on GSI1.
	keys = append(keys, avKey(createGroupPK(groupId), createGroupSK(groupId)))
	return d.deleteKeys(keys)
}

// DeleteMemberGroupData removes one member's items within a single group:
// query the member partition and keep items whose SK references the group.
func (d *dynamo) DeleteMemberGroupData(memberId, groupId string) error {
	// Query the member's whole partition. We CANNOT filter on SK in a DynamoDB
	// FilterExpression — SK is the sort key, and DynamoDB rejects primary-key
	// attributes in filters ("Filter Expression can only contain non-primary
	// key attributes"). So we fetch all of the member's items and select the
	// ones belonging to this group (SK contains "group#<id>") in code.
	query := dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("#pk = :memberId"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":memberId": &types.AttributeValueMemberS{Value: createMemberPK(memberId)},
		},
		ExpressionAttributeNames: map[string]string{"#pk": "PK"},
	}
	groupToken := fmt.Sprintf("group#%s", groupId)
	keys := []map[string]types.AttributeValue{}
	p := dynamodb.NewQueryPaginator(d.client, &query)
	for p.HasMorePages() {
		result, err := p.NextPage(context.TODO())
		if err != nil {
			log.Error().Msgf("Failed to query member '%s' data: %s", memberId, err.Error())
			return err
		}
		for _, item := range result.Items {
			var k keyOnly
			if err := attributevalue.UnmarshalMap(item, &k); err != nil {
				continue
			}
			if strings.Contains(k.SK, groupToken) {
				keys = append(keys, avKey(k.PK, k.SK))
			}
		}
	}
	return d.deleteKeys(keys)
}
