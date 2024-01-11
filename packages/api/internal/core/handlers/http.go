package handlers

import (
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
		"default":false,
		"year": 2024,
		"weekNumber":2,
		"monday":1,
		"tuesday": 0,
		"wednesday": 2,
		"thursday": 3,
		"friday": 3,
		"saturday": 2,
		"sunday":2
	}
*/
func (hdl *HTTPHandler) CreateSchedule(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))

	groupId := c.Param("groupId")

	var request CreateScheduleRequest
	err := c.BindJSON(&request)
	if err != nil {
		log.Error().Msgf("Invalid request: %s", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Invalid request.",
		})
		return
	}

	if request.Default {
		err = hdl.svc.CreateDefaultSchedule(
			info.userId,
			groupId,
			request.Monday,
			request.Tuesday,
			request.Wednesday,
			request.Thursday,
			request.Friday,
			request.Saturday,
			request.Sunday)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to set default schedule.",
			})
			return
		}

		log.Info().Msgf("Default schedule created for member '%s' and for group '%s'.", info.userId, groupId)
	} else {
		err = hdl.svc.CreateSchedule(
			info.userId,
			groupId,
			request.Year,
			request.WeekNumber,
			request.Monday,
			request.Tuesday,
			request.Wednesday,
			request.Thursday,
			request.Friday,
			request.Saturday,
			request.Sunday)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to set schedule.",
			})
			return
		}
		log.Info().Msgf("Schedule 'Year %d - Calendar Week %d' created for member '%s' and group '%s'.", request.Year, request.WeekNumber, info.userId, groupId)
	}

	c.Status(http.StatusCreated)
}

/*
Endpoint: POST /api/groups/:groupId/members
Payload:
{"name":"name of the new member", "admin":false}
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

	member, err := hdl.svc.CreateMember(info.userId, groupId, request.Name, request.Admin)
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

	response := GetSchedulesResponse{
		Schedules: map[string]*GroupScheduleResponse{},
	}

	for _, d := range defaultSchedules {
		groupId := d.GroupId
		groupName := d.GroupName

		groupSchedule := response.Schedules[groupId]
		if groupSchedule == nil {
			groupSchedule = &GroupScheduleResponse{
				GroupId:   groupId,
				GroupName: groupName,
				Members:   map[string]*MemberScheduleResponse{},
			}
			response.Schedules[groupId] = groupSchedule
		}

		memberId := d.MemberId
		memberName := d.MemberName

		groupSchedule.Members[memberId] = &MemberScheduleResponse{
			MemberId:   memberId,
			MemberName: memberName,
			Admin:      d.Role == roles.GroupAdmin,
			DefaultSchedule: DefaultScheduleResponse{
				Monday:    d.WeeklySchedule.Monday,
				Tuesday:   d.WeeklySchedule.Tuesday,
				Wednesday: d.WeeklySchedule.Wednesday,
				Thursday:  d.WeeklySchedule.Thursday,
				Friday:    d.WeeklySchedule.Friday,
				Saturday:  d.WeeklySchedule.Saturday,
				Sunday:    d.WeeklySchedule.Sunday,
			},
		}

	}

	for _, s := range memberSchedules {
		groupId := s.Schedule.GroupId
		memberId := s.Schedule.MemberId
		groupSchedule := response.Schedules[groupId]
		memberSchedule := groupSchedule.Members[memberId]

		memberSchedule.Schedule = ScheduleResponse{
			Overriden:  s.Overriden,
			Year:       s.Year,
			WeekNumber: s.WeekNumber,
			DefaultScheduleResponse: DefaultScheduleResponse{
				Monday:    s.Schedule.WeeklySchedule.Monday,
				Tuesday:   s.Schedule.WeeklySchedule.Tuesday,
				Wednesday: s.Schedule.WeeklySchedule.Wednesday,
				Thursday:  s.Schedule.WeeklySchedule.Thursday,
				Friday:    s.Schedule.WeeklySchedule.Friday,
				Saturday:  s.Schedule.WeeklySchedule.Saturday,
				Sunday:    s.Schedule.WeeklySchedule.Sunday,
			},
		}
	}

	c.JSON(http.StatusOK, response)
}
