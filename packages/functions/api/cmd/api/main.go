package main

import (
	"os"

	"github.com/gin-gonic/gin"
	"isnan.eu/meal-planner/functions/api/internal/core/handlers"
	"isnan.eu/meal-planner/functions/api/internal/core/repositories"
	"isnan.eu/meal-planner/functions/api/internal/core/services"
)

func main() {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(handlers.HttpLogger())
	router.Use(gin.Recovery())

	r := repositories.NewDynamoDB()
	c := repositories.NewCognito()
	n := repositories.NewNotifier()
	s := services.New(r, c, n)
	h := handlers.NewHTTPHandler(s)

	// RequireApproved sits on the /api group, not router-global. This keeps
	// LWA's HTTP readiness probe on "/" out of the auth middleware (Gin
	// returns 404, which LWA treats as healthy; <500 means "ready"). With
	// auth global, an empty Authorization header panics parseAuthHeader and
	// LWA never sees ready → cold-start times out.
	api := router.Group("/api")
	api.Use(handlers.RequireApproved())

	api.POST("/groups", h.CreateGroup)
	api.POST("/groups/:groupId/members", h.CreateMember)
	api.POST("/groups/:groupId/schedules", h.CreateSchedule)
	api.POST("/groups/:groupId/comments", h.CreateComments)
	api.POST("/groups/:groupId/notices", h.CreateNotice)
	api.DELETE("/groups/:groupId/notices/:period", h.DeleteNotice)
	api.GET("/schedules/:period", h.GetSchedules)

	// Group management
	api.PUT("/groups/:groupId", h.RenameGroup)
	api.DELETE("/groups/:groupId", h.DeleteGroup)

	// Invite management
	api.POST("/groups/:groupId/invites", h.CreateInvite)
	api.GET("/groups/:groupId/invites", h.ListInvites)
	api.DELETE("/groups/:groupId/invites/:code", h.RevokeInvite)

	// Invite redemption (no groupId in path — user arrives via link)
	api.GET("/invites/:code", h.GetInvite)
	api.POST("/invites/:code/redeem", h.RedeemInvite)

	// Member management: single route dispatches to LeaveGroup or KickMember
	// based on whether the caller's token id matches the path :memberId.
	api.DELETE("/groups/:groupId/members/:memberId", h.RemoveMember)

	// PORT is injected by the LWA layer in AWS; defaults to 8080 for local runs.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	_ = router.Run(":" + port)
}
