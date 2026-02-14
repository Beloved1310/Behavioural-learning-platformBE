import Joi from 'joi';
export declare const createBadgeSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const updateBadgeSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const getBadgesSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getBadgeByIdSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const deleteBadgeSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const awardBadgeSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const revokeBadgeSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getUserBadgesSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const getLeaderboardSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getUserPointsSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const addPointsSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const deductPointsSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getStreakInfoSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const updateStreakSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getAchievementsSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const createAchievementSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getGamificationStatsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const checkBadgeEligibilitySchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getBadgeProgressSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const bulkAwardBadgesSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getChallengesSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const joinChallengeSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const completeChallengeSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=gamification.d.ts.map