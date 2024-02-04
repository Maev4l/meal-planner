package handlers

import "isnan.eu/meal-planner/api/internal/core/domain"

func (r *CreateDefaultScheduleRequest) toDomain() *domain.WeeklySchedule {
	return &domain.WeeklySchedule{
		Monday:    r.Monday,
		Tuesday:   r.Tuesday,
		Wednesday: r.Wednesday,
		Thursday:  r.Thursday,
		Friday:    r.Friday,
		Saturday:  r.Saturday,
		Sunday:    r.Sunday,
	}
}

func (r *CreateMemberScheduleRequest) toDomain() *domain.WeeklySchedule {
	return &domain.WeeklySchedule{
		Monday:    r.Monday,
		Tuesday:   r.Tuesday,
		Wednesday: r.Wednesday,
		Thursday:  r.Thursday,
		Friday:    r.Friday,
		Saturday:  r.Saturday,
		Sunday:    r.Sunday,
	}
}

func (r *CreateCommentsRequest) toDomain() *domain.WeeklyComments {
	return &domain.WeeklyComments{
		Monday:    domain.Comments{Lunch: r.Monday.Lunch, Dinner: r.Monday.Dinner},
		Tuesday:   domain.Comments{Lunch: r.Tuesday.Lunch, Dinner: r.Tuesday.Dinner},
		Wednesday: domain.Comments{Lunch: r.Wednesday.Lunch, Dinner: r.Wednesday.Dinner},
		Thursday:  domain.Comments{Lunch: r.Thursday.Lunch, Dinner: r.Thursday.Dinner},
		Friday:    domain.Comments{Lunch: r.Friday.Lunch, Dinner: r.Friday.Dinner},
		Saturday:  domain.Comments{Lunch: r.Saturday.Lunch, Dinner: r.Saturday.Dinner},
		Sunday:    domain.Comments{Lunch: r.Sunday.Lunch, Dinner: r.Sunday.Dinner},
	}
}
