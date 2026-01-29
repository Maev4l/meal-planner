import outputConfig from '../output.json';

export const config = {
  cognito: {
    userPoolId: outputConfig.mealPlannerUserPoolId,
    userPoolClientId: outputConfig.mealPlannerClientId,
    region: outputConfig.mealPlannerRegion,
  },
  api: {
    baseUrl: 'https://api-meal-planner.isnan.eu',
  },
};
