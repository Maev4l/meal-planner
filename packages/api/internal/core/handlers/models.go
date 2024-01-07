package handlers

type CreateGroupRequest struct {
	Name string `json:"name"`
}

type CreateGroupResponse struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
}

type RegisterUserRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}

type RegisterUserResponse struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
}

type CreateMemberRequest struct {
	Name  string `json:"name"`
	Admin bool   `json:"role"`
}

type CreateMemberReponse struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
}

type CreateScheduleRequest struct {
	WeekNumber int `json:"weekNumber"`
	Year       int `json:"year"`
	Monday     int `json:"monday"`
	Tuesday    int `json:"tuesday"`
	Wednesday  int `json:"wednesday"`
	Thursday   int `json:"thursday"`
	Friday     int `json:"friday"`
	Saturday   int `json:"saturday"`
	Sunday     int `json:"sunday"`
}
