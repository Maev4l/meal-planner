package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// POST /api/groups/:groupId/invites
func (hdl *HTTPHandler) CreateInvite(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	inv, err := hdl.svc.CreateInvite(info.userId, groupId)
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	log.Info().Msgf("Invite created for group '%s'.", groupId)
	c.JSON(http.StatusCreated, CreateInviteResponse{
		Code:      inv.Code,
		ExpiresAt: inv.ExpiresAt.Format(time.RFC3339),
	})
}

// GET /api/groups/:groupId/invites
func (hdl *HTTPHandler) ListInvites(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	invites, err := hdl.svc.ListInvites(info.userId, groupId)
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	out := make([]InviteListItem, 0, len(invites))
	for _, inv := range invites {
		out = append(out, InviteListItem{Code: inv.Code, ExpiresAt: inv.ExpiresAt.Format(time.RFC3339)})
	}
	c.JSON(http.StatusOK, gin.H{"invites": out})
}

// GET /api/invites/:code
func (hdl *HTTPHandler) GetInvite(c *gin.Context) {
	code := c.Param("code")
	inv, err := hdl.svc.GetInvite(code)
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, InviteResponse{
		GroupName: inv.GroupName,
		ExpiresAt: inv.ExpiresAt.Format(time.RFC3339),
	})
}

// POST /api/invites/:code/redeem
func (hdl *HTTPHandler) RedeemInvite(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	code := c.Param("code")
	group, already, err := hdl.svc.RedeemInvite(info.userId, info.name, info.userName, code, info.approved)
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	log.Info().Msgf("User '%s' redeemed invite to group '%s' (already=%v).", info.userName, group.Id, already)
	c.JSON(http.StatusOK, RedeemInviteResponse{
		GroupId: group.Id, GroupName: group.Name, AlreadyMember: already,
	})
}

// DELETE /api/groups/:groupId/invites/:code
func (hdl *HTTPHandler) RevokeInvite(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	code := c.Param("code")
	if err := hdl.svc.RevokeInvite(info.userId, groupId, code); err != nil {
		abortWithServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
