package ports

type PlannerIdP interface {
	RegisterUser(name string, password string, tenantId string, role string) (string, error)
}
