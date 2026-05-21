/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Nutrition {
  carbs: number;   // 탄수화물 (g)
  protein: number; // 단백질 (g)
  fat: number;     // 지방 (g)
}

export interface MealData {
  id: string;
  schoolName: string;
  date: string;       // "YYYY-MM-DD" 형식의 날짜 문자열
  dateKey: string;    // "YYYYMMDD" 형식
  dayOfWeek: string;  // "월" | "화" | "수" | "목" | "금"
  mealType: '중식' | '석식';
  title: string;      // 대표 메뉴명, 예: "치즈돈까스 정식"
  dishes: string[];   // 개별 반찬 목록
  totalCalories: number;
  nutrition: Nutrition;
  allergens: string[];
}

export type TabType = 'home' | 'schedule' | 'calculator' | 'profile';

export interface AllergySetting {
  id: string;
  name: string;
}
