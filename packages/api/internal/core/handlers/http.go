package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/api/internal/core/domain"
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
Payload:
{"name":"user name","password":"user name","admin": false}
*/
func (hdl *HTTPHandler) CreateUser(c *gin.Context) {

	info := parseAuthHeader(c.Request.Header.Get("Authorization"))

	if info.Role != domain.TenantAdmin {
		log.Error().Msgf("'%s' is not Tenant Admin.", info.Username)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Not Tenant Admin.",
		})
		return
	}

	var request CreateUserRequest
	err := c.BindJSON(&request)
	if err != nil {
		log.Error().Msgf("Invalid request: %s", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Invalid request.",
		})

		return
	}

	user, err := hdl.svc.CreateUser(info.TenantId, request.Name, request.Password, request.Admin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to create user.",
		})
		return
	}

	response := &CreateUserResponse{
		Id:        user.Id,
		Name:      user.Name,
		CreatedAt: user.CreatedAt.Format(time.RFC3339),
	}

	c.JSON(http.StatusCreated, response)
}

/*
Payload:
{"tenantName":"tenant name","adminName":"tenant admin user password","adminPassword":"tenant admin password"}
*/
func (hdl *HTTPHandler) CreateTenant(c *gin.Context) {

	info := parseAuthHeader(c.Request.Header.Get("Authorization"))

	if info.Role != domain.AppAdmin {
		log.Error().Msgf("'%s' is not Application Admin.", info.Username)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Not Application Admin.",
		})
		return
	}

	var request CreateTenantRequest
	err := c.BindJSON(&request)
	if err != nil {
		log.Error().Msgf("Invalid request: %s", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Invalid request.",
		})

		return
	}

	tenant, admin, err := hdl.svc.CreateTenant(request.TenantName, request.AdminName, request.AdminPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to create tenant.",
		})
		return
	}

	response := CreateTenantResponse{
		Id:        tenant.Id,
		Name:      tenant.Name,
		CreatedAt: tenant.CreatedAt.Format(time.RFC3339),
		Admin: &CreateUserResponse{
			Id:        admin.Id,
			Name:      admin.Name,
			CreatedAt: admin.CreatedAt.Format(time.RFC3339),
		},
	}
	c.JSON(http.StatusCreated, response)
}
