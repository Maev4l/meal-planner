package ports

type PlannerIdP interface {
	RegisterUser(name string, password string, role string) (string, error)
}
