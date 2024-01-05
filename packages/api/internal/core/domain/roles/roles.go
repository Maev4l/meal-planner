package roles

type APPLICATION_ROLE string

const (
	AppAdmin    APPLICATION_ROLE = "AppAdmin"
	RegularUser APPLICATION_ROLE = "Regular"
)

type GROUP_ROLE string

const (
	Member     GROUP_ROLE = "Member"
	GroupAdmin GROUP_ROLE = "Admin"
)
