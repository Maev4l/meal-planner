package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// PUT /api/groups/:groupId
func (hdl *HTTPHandler) RenameGroup(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")

	var req RenameGroupRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request."})
		return
	}
	group, err := hdl.svc.RenameGroup(info.userId, groupId, req.Name)
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	log.Info().Msgf("Group '%s' renamed to '%s'.", groupId, group.Name)
	c.JSON(http.StatusOK, CreateGroupResponse{Id: group.Id, Name: group.Name, CreatedAt: ""})
}

// DELETE /api/groups/:groupId
func (hdl *HTTPHandler) DeleteGroup(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	if err := hdl.svc.DeleteGroup(info.userId, groupId); err != nil {
		abortWithServiceError(c, err)
		return
	}
	log.Info().Msgf("Group '%s' deleted.", groupId)
	c.Status(http.StatusNoContent)
}

// DELETE /api/groups/:groupId/members/:memberId
// Caller removing their own id => voluntary leave; removing another id => admin kick.
// The id is compared against the verified token claim (never client-supplied state),
// and authorization is enforced by the service method that runs:
//
//	self  -> LeaveGroup (any member; sole admin blocked)
//	other -> KickMember (GroupAdmin only)
func (hdl *HTTPHandler) RemoveMember(c *gin.Context) {
	info := parseAuthHeader(c.Request.Header.Get("Authorization"))
	groupId := c.Param("groupId")
	memberId := c.Param("memberId")

	var err error
	if memberId == info.userId {
		err = hdl.svc.LeaveGroup(info.userId, groupId)
	} else {
		err = hdl.svc.KickMember(info.userId, groupId, memberId)
	}
	if err != nil {
		abortWithServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
