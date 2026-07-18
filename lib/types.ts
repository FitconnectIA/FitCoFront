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
