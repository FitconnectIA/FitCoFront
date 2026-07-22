export type Exercise = {
  id: string;
  name: string;
  muscle_groups: string[];
  equipment: string;
  instructions: string;
};

export type ExercisesResponse = {
  items: Exercise[];
  total: number;
};

export type SessionSet = {
  reps: number;
  weight_kg: number;
  rpe?: number | null;
};

export type SessionExercise = {
  exercise_id: string;
  exercise_name?: string | null;
  muscle_groups?: string[];
  order: number;
  sets: SessionSet[];
};

export type SessionSource = "recommended" | "manual";

export type Session = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  session_rpe?: number | null;
  muscle_groups: string[];
  source: SessionSource;
  exercises: SessionExercise[];
};

export type NewSessionPayload = {
  started_at: string;
  ended_at: string;
  session_rpe?: number;
  source: SessionSource;
  exercises: {
    exercise_id: string;
    order: number;
    sets: SessionSet[];
  }[];
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

// Miroir des schemas Pydantic du backend (app/schemas/recommendation.py).
export type RecommendationExercise = {
  exercise_id: string;
  name?: string | null;
  muscle_groups: string[];
  sets: number;
  reps: string;
  rpe_target: number;
  source_rule?: string | null;
};

export type RecommendationSession = {
  date: string;
  title: string;
  muscle_groups: string[];
  exercises: RecommendationExercise[];
  notes?: string | null;
};

export type RecommendationSource = {
  rule_id: string;
  study_reference: string;
  summary: string;
  year: number;
  journal: string;
  applied_to: string;
};

export type Recommendation = {
  user_id: string;
  week_start: string;
  deload_week: boolean;
  sessions: RecommendationSession[];
  sources: RecommendationSource[];
  generated_at: string;
};

export type RecommendationSourceDetail = RecommendationSource;

// Miroir de app/schemas/streak.py (Module 6).
export type Streak = {
  current_streak: number;
  longest_streak: number;
  last_validated_date?: string | null;
  is_paused: boolean;
  paused_until?: string | null;
};

// Miroir de app/schemas/nutrition.py (Module 4).
export type NutritionTriggerContext =
  | "pre_workout"
  | "post_workout"
  | "rest_day"
  | "general";

export type NutritionMacroFocus =
  | "protein"
  | "carbs"
  | "hydration"
  | "balanced";

export type NutritionAdviceToday = {
  trigger_context: NutritionTriggerContext;
  advice_text: string;
  macro_focus: NutritionMacroFocus;
  source_reference?: string | null;
  disclaimer: string;
};

export type NutritionAdviceObjective = {
  advice_text: string;
  macro_focus: NutritionMacroFocus;
  disclaimer: string;
};

// Miroir de app/schemas/progress.py (Module 7).
export type ExerciseProgress = {
  exercise_id: string;
  exercise_name: string;
  data_points: {
    date: string;
    max_weight_kg: number;
    total_volume: number;
  }[];
  personal_record: {
    weight_kg: number;
    achieved_at: string;
  } | null;
};

export type WeeklyVolume = {
  weekly_data: {
    week_start: string;
    muscle_groups: Record<string, number>;
  }[];
};

export type RpeTrend = {
  data_points: {
    week_start: string;
    avg_rpe: number;
  }[];
};

// Miroir de app/schemas/user.py (UserResponse).
export type UserLevel = "beginner" | "intermediate" | "advanced";
export type UserGoal = "strength" | "hypertrophy" | "weight_loss" | "endurance";

export type UserProfile = {
  id: string;
  clerk_user_id: string;
  email: string;
  display_name: string;
  invite_code?: string | null;
  level: UserLevel;
  goal: UserGoal;
  availability_days: number[];
  rgpd_consent: Record<string, boolean>;
  medical_disclaimer_accepted_at?: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

// Miroir de app/schemas/notification.py (Module 10).
export type NotificationPreferences = {
  session_reminders: boolean;
  streak_alerts: boolean;
  badge_unlocks: boolean;
};

// Miroir de app/schemas/export.py (Module 11).
export type ExportFormat = "json" | "csv";
export type ExportStatus = "processing" | "ready" | "failed";

export type ExportRequestResponse = {
  export_id: string;
  status: ExportStatus;
};

export type ExportStatusResponse = {
  status: ExportStatus;
  download_url?: string | null;
};

// Miroir de app/schemas/gamification.py (Module 8).
export type Badge = {
  badge_id: string;
  name: string;
  icon: string;
  unlocked_at: string;
};

export type GamificationProfile = {
  total_xp: number;
  level: number;
  xp_to_next_level: number;
  badges: Badge[];
};

export type BadgeCatalogItem = {
  badge_id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  unlocked_at?: string | null;
};

export type BadgeCatalog = {
  items: BadgeCatalogItem[];
};

// Miroir de app/schemas/friends.py (Module 9).
export type Friend = {
  user_id: string;
  display_name: string;
  current_streak: number;
  level: number;
};

export type FriendList = {
  items: Friend[];
};

export type IncomingFriendRequest = {
  request_id: string;
  requester_id: string;
  display_name: string;
};

export type IncomingFriendRequestList = {
  items: IncomingFriendRequest[];
};

export type FriendFeedItem = {
  user_id: string;
  display_name: string;
  session_summary: {
    muscle_groups: string[];
    duration_minutes: number;
  };
  logged_at: string;
};

export type FriendFeed = {
  items: FriendFeedItem[];
};

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  display_name: string;
  weekly_xp: number;
};

export type Leaderboard = {
  week_start: string;
  rankings: LeaderboardEntry[];
};
