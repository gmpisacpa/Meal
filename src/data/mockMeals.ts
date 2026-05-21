/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MealData } from '../types';
import { formatDateKey, getKoreanDayOfWeek } from '../utils/dateUtils';

/**
 * 주어진 주간 날짜 배열 (월요일~금요일)을 기준으로 동적 Mock Data 급식 메뉴를 생성합니다.
 */
export function generateMockMeals(weekDates: Date[]): MealData[] {
  // 항상 5일치 날짜가 전달된다고 가정합니다. (월요일~금요일)
  const meals: MealData[] = [];

  const dayOfWeekNames = ['월', '화', '수', '목', '금'];

  const mealTemplates = [
    // 월요일 (index 0)
    {
      lunch: {
        title: '제육볶음 정식',
        dishes: ['귀리밥', '순두부찌개', '제육볶음', '감자채볶음', '깍두기'],
        totalCalories: 810,
        nutrition: { carbs: 105, protein: 35, fat: 22 },
        allergens: ['돼지고기', '대두', '밀'],
      },
      dinner: {
        title: '치킨마요덮밥 정식',
        dishes: ['치킨마요덮밥', '팽이장국', '단무지무침', '허니버터아몬드', '배추김치'],
        totalCalories: 760,
        nutrition: { carbs: 115, protein: 28, fat: 18 },
        allergens: ['닭고기', '난류', '대두', '밀', '우유'],
      }
    },
    // 화요일 (index 1)
    {
      lunch: {
        title: '소불고기덮밥 정식',
        dishes: ['소불고기덮밥', '아욱된장국', '오징어초무침', '깍두기', '요구르트'],
        totalCalories: 830,
        nutrition: { carbs: 110, protein: 36, fat: 20 },
        allergens: ['소고기', '대두', '밀'],
      },
      dinner: {
        title: '토마토해물파스타 세트',
        dishes: ['토마토해물파스타', '마늘빵', '양송이스프', '오이피클', '배추김치'],
        totalCalories: 790,
        nutrition: { carbs: 120, protein: 25, fat: 24 },
        allergens: ['밀', '우유', '토마토', '새우', '조개류'],
      }
    },
    // 수요일 (index 2)
    {
      lunch: {
        title: '치즈돈까스 정식',
        dishes: ['찰보리밥', '건새우아욱국', '치즈돈까스/소스', '양배추샐러드/키위D', '배추김치'],
        totalCalories: 845,
        nutrition: { carbs: 110, protein: 32, fat: 25 },
        allergens: ['돼지고기', '밀', '대두', '우유'],
      },
      dinner: {
        title: '참치마요덮밥 코스',
        dishes: ['참치마요덮밥', '유부장국', '매콤떡볶이', '김말이튀김', '깍두기'],
        totalCalories: 780,
        nutrition: { carbs: 118, protein: 30, fat: 22 },
        allergens: ['대두', '밀', '난류'],
      }
    },
    // 목요일 (index 3)
    {
      lunch: {
        title: '수제치킨까스 정식',
        dishes: ['친환경혼합잡곡밥', '돈육김치찌개', '수제치킨까스 & 타르타르소스', '시금치고추장무침', '깍두기'],
        totalCalories: 850,
        nutrition: { carbs: 108, protein: 38, fat: 26 },
        allergens: ['돼지고기', '닭고기', '밀', '대두'],
      },
      dinner: {
        title: '소불고기 정식',
        dishes: ['현미밥', '맑은미역국', '소불고기', '계란말이', '배추김치'],
        totalCalories: 780,
        nutrition: { carbs: 102, protein: 35, fat: 21 },
        allergens: ['소고기', '난류', '대두', '밀'],
      }
    },
    // 금요일 (index 4)
    {
      lunch: {
        title: '전주비빔밥과 닭강정',
        dishes: ['전주비빔밥', '콩나물국', '수제닭강정', '백김치', '약과'],
        totalCalories: 860,
        nutrition: { carbs: 125, protein: 34, fat: 23 },
        allergens: ['닭고기', '대두', '밀'],
      },
      dinner: {
        title: '유니짜장과 군만두',
        dishes: ['유니짜장면', '계란파국', '단무지', '군만두', '배추김치'],
        totalCalories: 810,
        nutrition: { carbs: 118, protein: 29, fat: 25 },
        allergens: ['돼지고기', '밀', '대두', '난류'],
      }
    }
  ];

  weekDates.forEach((date, index) => {
    const template = mealTemplates[index] || mealTemplates[0];
    const dateStr = date.toISOString().split('T')[0];
    const dateKey = formatDateKey(date);
    const dayOfWeek = dayOfWeekNames[index] || getKoreanDayOfWeek(date);

    // 중식 추가
    meals.push({
      id: `${dateKey}-LUNCH`,
      schoolName: '씨마스고등학교',
      date: dateStr,
      dateKey,
      dayOfWeek,
      mealType: '중식',
      ...template.lunch
    });

    // 석식 추가
    meals.push({
      id: `${dateKey}-DINNER`,
      schoolName: '씨마스고등학교',
      date: dateStr,
      dateKey,
      dayOfWeek,
      mealType: '석식',
      ...template.dinner
    });
  });

  return meals;
}
