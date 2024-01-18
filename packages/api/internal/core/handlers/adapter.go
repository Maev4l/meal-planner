package handlers

import "isnan.eu/meal-planner/api/internal/core/domain"

func (r *CreateDefaultScheduleRequest) toDomain() *domain.WeeklySchedule {
	return &domain.WeeklySchedule{
		Monday:    domain.DailySchedule{Meals: r.Monday},
		Tuesday:   domain.DailySchedule{Meals: r.Tuesday},
		Wednesday: domain.DailySchedule{Meals: r.Wednesday},
		Thursday:  domain.DailySchedule{Meals: r.Thursday},
		Friday:    domain.DailySchedule{Meals: r.Friday},
		Saturday:  domain.DailySchedule{Meals: r.Saturday},
		Sunday:    domain.DailySchedule{Meals: r.Sunday},
	}
}

func (r *CreateMemberScheduleRequest) toDomain() *domain.WeeklySchedule {
	return &domain.WeeklySchedule{
		Monday: domain.DailySchedule{
			Meals: r.Monday.Meals,
			Comments: domain.Comments{
				Lunch:  r.Monday.Comments.Lunch,
				Dinner: r.Monday.Comments.Dinner,
			}},
		Tuesday: domain.DailySchedule{
			Meals: r.Tuesday.Meals,
			Comments: domain.Comments{
				Lunch:  r.Tuesday.Comments.Lunch,
				Dinner: r.Tuesday.Comments.Dinner,
			}},
		Wednesday: domain.DailySchedule{
			Meals: r.Wednesday.Meals,
			Comments: domain.Comments{
				Lunch:  r.Wednesday.Comments.Lunch,
				Dinner: r.Wednesday.Comments.Dinner,
			}},
		Thursday: domain.DailySchedule{
			Meals: r.Thursday.Meals,
			Comments: domain.Comments{
				Lunch:  r.Thursday.Comments.Lunch,
				Dinner: r.Thursday.Comments.Dinner,
			}},
		Friday: domain.DailySchedule{
			Meals: r.Friday.Meals,
			Comments: domain.Comments{
				Lunch:  r.Friday.Comments.Lunch,
				Dinner: r.Friday.Comments.Dinner,
			}},
		Saturday: domain.DailySchedule{
			Meals: r.Saturday.Meals,
			Comments: domain.Comments{
				Lunch:  r.Saturday.Comments.Lunch,
				Dinner: r.Saturday.Comments.Dinner,
			}},
		Sunday: domain.DailySchedule{
			Meals: r.Sunday.Meals,
			Comments: domain.Comments{
				Lunch:  r.Sunday.Comments.Lunch,
				Dinner: r.Sunday.Comments.Dinner,
			}},
	}
}
