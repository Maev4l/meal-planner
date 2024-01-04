package domain

type ROLE string

const (
	AppAdmin    ROLE = "AppAdmin"
	TenantAdmin ROLE = "TenantAdmin"
	Member      ROLE = "Member"
)
