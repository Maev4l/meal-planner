package handlers

type CreateTenantRequest struct {
	TenantName    string `json:"tenantName"`
	AdminName     string `json:"adminName"`
	AdminPassword string `json:"adminPassword"`
}

type CreateTenantResponse struct {
	Id        string              `json:"id"`
	Name      string              `json:"name"`
	CreatedAt string              `json:"createdAt"`
	Admin     *CreateUserResponse `json:"admin"`
}

type CreateUserResponse struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"createdAt"`
}
