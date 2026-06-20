package services

import (
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"isnan.eu/meal-planner/functions/api/internal/core/domain"
	"isnan.eu/meal-planner/functions/api/internal/core/domain/roles"
	"isnan.eu/meal-planner/functions/api/internal/helper"
)

const inviteTTL = 7 * 24 * time.Hour

// requireGroupAdmin returns the group when memberId is its admin, else ErrForbidden.
func (s *service) requireGroupAdmin(groupId, memberId string) (*domain.Group, error) {
	group, member, err := s.validateGroupOperation(groupId, memberId)
	if err != nil {
		return nil, err
	}
	if group == nil || member == nil {
		return nil, domain.ErrForbidden
	}
	if member.Role != roles.GroupAdmin {
		return nil, domain.ErrForbidden
	}
	return group, nil
}

func (s *service) CreateInvite(requesterId, groupId string) (*domain.Invite, error) {
	group, err := s.requireGroupAdmin(groupId, requesterId)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	expiresAt := now.Add(inviteTTL)

	// Get-before-save retry guards the (negligible) code collision.
	var code string
	for i := 0; i < 5; i++ {
		code = helper.NewInviteCode()
		existing, err := s.repo.GetInvite(code)
		if err != nil {
			return nil, err
		}
		if existing == nil {
			break
		}
	}

	inv := &domain.Invite{
		Code: code, GroupId: group.Id, GroupName: group.Name,
		CreatedBy: requesterId, CreatedAt: &now, ExpiresAt: &expiresAt,
	}
	if err := s.repo.SaveInvite(inv); err != nil {
		return nil, err
	}
	return inv, nil
}

func (s *service) GetInvite(code string) (*domain.Invite, error) {
	inv, err := s.repo.GetInvite(code)
	if err != nil {
		return nil, err
	}
	// Treat missing AND expired identically (don't leak which codes existed).
	if inv == nil || inv.IsExpired(time.Now().UTC()) {
		return nil, domain.ErrNotFound
	}
	return inv, nil
}

func (s *service) ListInvites(requesterId, groupId string) ([]*domain.Invite, error) {
	if _, err := s.requireGroupAdmin(groupId, requesterId); err != nil {
		return nil, err
	}
	all, err := s.repo.ListGroupInvites(groupId)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	live := []*domain.Invite{}
	for _, inv := range all {
		if !inv.IsExpired(now) {
			live = append(live, inv)
		}
	}
	return live, nil
}

// RevokeInvite deletes an invite. Authorizes on the invite's STORED GroupId
// and asserts it matches the path groupId, preventing a cross-group IDOR
// (admin of A cannot revoke B's invite by passing A in the path).
func (s *service) RevokeInvite(requesterId, groupId, code string) error {
	inv, err := s.repo.GetInvite(code)
	if err != nil {
		return err
	}
	if inv == nil {
		return domain.ErrNotFound
	}
	if inv.GroupId != groupId {
		return domain.ErrForbidden
	}
	if _, err := s.requireGroupAdmin(inv.GroupId, requesterId); err != nil {
		return err
	}
	return s.repo.DeleteInvite(code)
}

// RedeemInvite joins the requester to the invite's group as a regular Member.
// Idempotent: if already a member, returns the group with already=true and
// performs ZERO writes (so an existing admin redeeming their own link is never
// downgraded). The membership write is conditional, so concurrent/double
// redeems cannot create duplicate or partial state.
func (s *service) RedeemInvite(requesterId, requesterName, requesterUsername, code string, approved bool) (*domain.Group, bool, error) {
	// Capture once so expiry check and CreatedAt timestamps are consistent.
	now := time.Now().UTC()

	inv, err := s.repo.GetInvite(code)
	if err != nil {
		return nil, false, err
	}
	if inv == nil || inv.IsExpired(now) {
		return nil, false, domain.ErrNotFound
	}

	group, err := s.repo.GetGroup(inv.GroupId)
	if err != nil {
		return nil, false, err
	}
	if group == nil {
		// Valid invite but its group is gone — data inconsistency, warn and surface as not-found.
		log.Warn().Msgf("Invite '%s' references missing group '%s'.", code, inv.GroupId)
		return nil, false, domain.ErrNotFound
	}

	// Ensure membership (idempotent; never rewrites an existing record, so an
	// admin redeeming their own link is never downgraded).
	existing, err := s.repo.GetMember(group.Id, requesterId)
	if err != nil {
		return nil, false, err
	}
	alreadyMember := existing != nil
	if !alreadyMember {
		member := &domain.Member{
			Id: requesterId, Name: requesterName, CreatedAt: &now,
			Role: roles.Member, GroupId: group.Id, GroupName: group.Name,
		}
		created, err := s.repo.CreateMemberIfNotExists(member)
		if err != nil {
			return nil, false, err
		}
		if created {
			schedule := &domain.MemberDefaultSchedule{
				ScheduleBase: domain.ScheduleBase{
					MemberId: member.Id, MemberName: member.Name,
					GroupId: group.Id, GroupName: group.Name, CreatedAt: &now,
				},
				WeeklySchedule: domain.SystemDefaultWeeklySchedule,
			}
			if err := s.repo.SaveMemberDefaultSchedule(group, member, schedule); err != nil {
				return nil, false, err
			}
		} else {
			// Raced with another redeem; treat as already a member.
			alreadyMember = true
		}
	}

	// Auto-approval: a server-validated redeem IS the authorization. Gate on the
	// caller's token-approval state so we flip + alert only on a genuine gate-skip
	// (false->true); an already-approved member joining another group makes no noise.
	if !approved {
		// Membership is already persisted, so on failure the client can safely
		// retry the (idempotent) redeem — surface the error.
		if err := s.idp.ApproveUser(requesterUsername); err != nil {
			return nil, false, err
		}
		// Best-effort: a missed Slack ping must never fail the join.
		if err := s.notifier.Notify(
			"Meal Planner — invite auto-approval",
			fmt.Sprintf("%s (%s) auto-approved via invite to %s", requesterName, requesterUsername, group.Name),
		); err != nil {
			log.Warn().Msgf("Failed to publish auto-approval alert for '%s': %s", requesterName, err.Error())
		}
	}

	return group, alreadyMember, nil
}
