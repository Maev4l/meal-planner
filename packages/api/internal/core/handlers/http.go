package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain/roles"
	"isnan.eu/meal-planner/api/internal/core/ports"
)

/*
DISCLAIMER: Do not return HTTP status 400, 403 or 403.
The web client and the API use the same Cloudfront distribution, which has been configured to
redirect to the webclient index.html page in case of these HTTP status codes.
*/

type HTTPHandler struct {
	svc ports.PlannerService
}

func NewHTTPHandler(service ports.PlannerService) *HTTPHandler {
	return &HTTPHandler{
		svc: service,
	}
}

/*
Endpoint: DELETE /api/appadmin/users/:userId
*/
func (hdl *HTTPHandler) UnregisterUser(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))

	if info.role != roles.AppAdmin {
		log.Error().Msgf("'%s' is not App Admin.", info.userName)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Not Administrator.",
		})
		return
	}
	c.Status(http.StatusNotImplemented)
}

/*
Endpoint: POST /api/appadmin/users

Payload:
{"name":"user name","password":"user password"}
*/
func (hdl *HTTPHandler) RegisterUser(c *gin.Context) {

	info := parseAuthHeader(c.Request.Header.Get("Authorization"))

	if info.role != roles.AppAdmin {
		log.Error().Msgf("'%s' is not App Admin.", info.userName)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Not Administrator.",
		})
		return
	}

	var request RegisterUserRequest
	err := c.BindJSON(&request)
	if err != nil {
		log.Error().Msgf("Invalid request: %s", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Invalid request.",
		})

		return
	}

	user, err := hdl.svc.RegisterUser(request.Name, request.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to register user.",
		})
		return
	}

	response := &RegisterUserResponse{
		Id:        user.Id,
		Name:      user.Name,
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
	}

	log.Info().Msgf("User '%s' registered with id '%s'.", user.Id, user.Name)

	c.JSON(http.StatusCreated, response)
}

/*
Endpoint: POST /api/groups/:groupId/schedules
Payload:

	{
		"default":true,
		"schedule": {
			"monday": 3,
			"tuesday": 3,
			"wednesday": 3,
			"thursday": 3,
			"friday": 3,
			"saturday": 0,
			"sunday": 0
		}
	}

or

	{
		"default":false,
		"schedule": {
			"year": 2024,
			"weekNumber": 4,
			"monday": {
				"meals": 3,
				"comments": {
					"lunch": "",
					"dinner": ""
				}
			},
			"tuesday": {
				"meals": 3,
				"comments": {
					"lunch": "",
					"dinner": ""
				}
			},
			....
		}
	}
*/
func (hdl *HTTPHandler) CreateSchedule(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))

	groupId := c.Param("groupId")

	var request CreateScheduleRequest
	err := c.BindJSON(&request)
	if err != nil {
		log.Error().Msgf("Invalid request (step #1): %s", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Invalid request.",
		})
		return
	}

	if request.Default {
		var defaultScheduleRequest CreateDefaultScheduleRequest
		err = json.Unmarshal(request.Schedule, &defaultScheduleRequest)
		if err != nil {
			log.Error().Msgf("Invalid request (step #2): %s", err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Invalid request.",
			})
			return
		}

		err = hdl.svc.CreateDefaultSchedule(
			info.userId,
			groupId,
			defaultScheduleRequest.toDomain())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to set default schedule.",
			})
			return
		}

		log.Info().Msgf("Default schedule created for member '%s' and for group '%s'.", info.userId, groupId)
	} else {
		var memberScheduleRequest CreateMemberScheduleRequest
		err = json.Unmarshal(request.Schedule, &memberScheduleRequest)
		if err != nil {
			log.Error().Msgf("Invalid request (step #2): %s", err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Invalid request.",
			})
			return
		}
		err = hdl.svc.CreateSchedule(
			info.userId,
			groupId,
			memberScheduleRequest.Year,
			memberScheduleRequest.WeekNumber,
			memberScheduleRequest.toDomain())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to set schedule.",
			})
			return
		}
		log.Info().Msgf("Schedule 'Year %d - Calendar Week %d' created for member '%s' and group '%s'.", memberScheduleRequest.Year, memberScheduleRequest.WeekNumber, info.userId, groupId)
	}

	c.Status(http.StatusCreated)
}

/*
Endpoint: POST /api/groups/:groupId/members
Payload:
{"name":"name of the new member", "admin":false, "guest": false}
*/
func (hdl *HTTPHandler) CreateMember(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))

	groupId := c.Param("groupId")
	var request CreateMemberRequest
	err := c.BindJSON(&request)
	if err != nil {
		log.Error().Msgf("Invalid request: %s", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Invalid request.",
		})

		return
	}

	member, err := hdl.svc.CreateMember(info.userId, groupId, request.Name, request.Admin, request.Guest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to enroll user.",
		})
		return
	}

	response := &CreateMemberReponse{
		Id:        member.Id,
		Name:      member.Name,
		CreatedAt: member.CreatedAt.Format(time.RFC3339),
	}

	log.Info().Msgf("Member '%s' (Admin: %t) enrolled into group '%s'.", member.Name, request.Admin, groupId)

	c.JSON(http.StatusCreated, response)

}

/*
Endpoint: POST /api/groups

Payload:
{"name":"group name"}
*/
func (hdl *HTTPHandler) CreateGroup(c *gin.Context) {

	info := parseAuthHeader(c.Request.Header.Get("Authorization"))

	var request CreateGroupRequest
	err := c.BindJSON(&request)
	if err != nil {
		log.Error().Msgf("Invalid request: %s", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Invalid request.",
		})

		return
	}

	group, err := hdl.svc.CreateGroup(info.userId, info.userName, request.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to create group.",
		})
		return
	}

	response := CreateGroupResponse{
		Id:        group.Id,
		Name:      group.Name,
		CreatedAt: group.CreatedAt.Format(time.RFC3339),
	}

	log.Info().Msgf("Group '%s' created.", group.Name)

	c.JSON(http.StatusCreated, response)
}

/*
Endpoint: GET /api/groups/schedules/:schedules (2024-2 or 2024-43)
*/
func (hdl *HTTPHandler) GetSchedules(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))

	period := c.Param("period")
	defaultSchedules, memberSchedules, err := hdl.svc.GetSchedules(info.userId, period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to retrieve schedules.",
		})
		return
	}

	schedulesByGroup := map[string]*GroupScheduleResponse{}

	for _, d := range defaultSchedules {
		groupId := d.GroupId
		groupName := d.GroupName

		groupSchedule := schedulesByGroup[groupId]
		if groupSchedule == nil {
			groupSchedule = &GroupScheduleResponse{
				GroupId:   groupId,
				GroupName: groupName,
				Members:   map[string]*MemberScheduleResponse{},
			}
			schedulesByGroup[groupId] = groupSchedule
		}

		memberId := d.MemberId
		memberName := d.MemberName

		groupSchedule.Members[memberId] = &MemberScheduleResponse{
			MemberId:   memberId,
			MemberName: memberName,
			Admin:      d.Role == roles.GroupAdmin,
			DefaultSchedule: DefaultScheduleResponse{
				Monday:    d.WeeklySchedule.Monday.Meals,
				Tuesday:   d.WeeklySchedule.Tuesday.Meals,
				Wednesday: d.WeeklySchedule.Wednesday.Meals,
				Thursday:  d.WeeklySchedule.Thursday.Meals,
				Friday:    d.WeeklySchedule.Friday.Meals,
				Saturday:  d.WeeklySchedule.Saturday.Meals,
				Sunday:    d.WeeklySchedule.Sunday.Meals,
			},
		}

	}

	for _, s := range memberSchedules {
		groupId := s.GroupId
		memberId := s.MemberId
		groupSchedule := schedulesByGroup[groupId]
		memberSchedule := groupSchedule.Members[memberId]

		memberSchedule.Schedule = ScheduleResponse{
			Overriden:  s.Overriden,
			Year:       s.Year,
			WeekNumber: s.WeekNumber,
			Monday: DailyScheduleResponse{
				Meals: s.Monday.Meals,
				Comments: CommentsResponse{
					Lunch:  s.Monday.Comments.Lunch,
					Dinner: s.Monday.Comments.Dinner,
				},
			},
			Tuesday: DailyScheduleResponse{
				Meals: s.Tuesday.Meals,
				Comments: CommentsResponse{
					Lunch:  s.Tuesday.Comments.Lunch,
					Dinner: s.Tuesday.Comments.Dinner,
				},
			},
			Wednesday: DailyScheduleResponse{
				Meals: s.Wednesday.Meals,
				Comments: CommentsResponse{
					Lunch:  s.Wednesday.Comments.Lunch,
					Dinner: s.Wednesday.Comments.Dinner,
				},
			},
			Thursday: DailyScheduleResponse{
				Meals: s.Thursday.Meals,
				Comments: CommentsResponse{
					Lunch:  s.Thursday.Comments.Lunch,
					Dinner: s.Thursday.Comments.Dinner,
				},
			},
			Friday: DailyScheduleResponse{
				Meals: s.Friday.Meals,
				Comments: CommentsResponse{
					Lunch:  s.Friday.Comments.Lunch,
					Dinner: s.Friday.Comments.Dinner,
				},
			},
			Saturday: DailyScheduleResponse{
				Meals: s.Saturday.Meals,
				Comments: CommentsResponse{
					Lunch:  s.Saturday.Comments.Lunch,
					Dinner: s.Saturday.Comments.Dinner,
				},
			},
			Sunday: DailyScheduleResponse{
				Meals: s.Sunday.Meals,
				Comments: CommentsResponse{
					Lunch:  s.Sunday.Comments.Lunch,
					Dinner: s.Sunday.Comments.Dinner,
				},
			},
		}
	}

	response := GetSchedulesResponse{
		Schedules: []*GroupScheduleResponse{},
	}

	for _, s := range schedulesByGroup {
		response.Schedules = append(response.Schedules, s)
	}

	c.JSON(http.StatusOK, response)
}
