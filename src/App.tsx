/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Utensils,
  Bell,
  Sun,
  Moon,
  Home,
  Calendar as CalendarIcon,
  Calculator,
  User,
  Settings,
  AlertTriangle,
  BellRing,
  Headphones,
  LogOut,
  Plus,
  ChevronRight,
  GraduationCap,
  Save,
  Check,
  X,
  Sparkles
} from 'lucide-react';

import { MealData, TabType } from './types';
import {
  getTodayKST,
  formatKoreanDate,
  formatDateKey,
  getWeekDates,
  getWeekOfMonth,
  getDefaultSelectedDate,
} from './utils/dateUtils';
import { generateMockMeals } from './data/mockMeals';

interface DishDetail {
  name: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  allergens: string[];
}

export default function App() {
  // 1. 한국 기준 오늘 날짜 계산
  const todayKST = getTodayKST();
  const isWeekend = todayKST.getDay() === 0 || todayKST.getDay() === 6;

  // 2월/5월/기타 실행 시 실제 오늘 날짜에 속한 주의 월~금 계산
  const weekDates = getWeekDates(todayKST);
  const activeMeals = generateMockMeals(weekDates);

  // 2. 기본 선택 변수 초기화
  const initialSelectedDate = getDefaultSelectedDate(todayKST);
  const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate);
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // 알레르기 유발 물질 데이터베이스
  const allAvailableAllergies = [
    '우유', '땅콩', '돼지고기', '닭고기', '소고기', '밀', '대두', '새우', '알류', '토마토'
  ];
  
  // 알레르기 경고 설정 상태 (기본값: 우유, 땅콩)
  const [userAllergies, setUserAllergies] = useState<string[]>(['우유', '땅콩']);
  const [showAllergySelector, setShowAllergySelector] = useState(false);
  const [dailyNotification, setDailyNotification] = useState(true);

  // 토스트 메시지 상태
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 영양계산 탭 전용 상태
  const [calculatorSelectedMeal, setCalculatorSelectedMeal] = useState<'중식' | '석식'>('중식');
  const [checkedDishNames, setCheckedDishNames] = useState<Record<string, boolean>>({});
  const [calculatorFilter, setCalculatorFilter] = useState<'전체' | '밥류' | '국/찌개' | '반찬' | '디저트'>('전체');

  // 유틸리티 토스트 트리거
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // 3. 특정 날짜의 메뉴 데이터 찾기 편리한 헬퍼
  const getMealsForDateKey = (dateKey: string) => {
    return activeMeals.filter(m => m.dateKey === dateKey);
  };

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedDateMeals = getMealsForDateKey(selectedDateKey);

  const selectedLunch = selectedDateMeals.find(m => m.mealType === '중식');
  const selectedDinner = selectedDateMeals.find(m => m.mealType === '석식');

  // 4. 영양계산 화면용 세부 영양소 분할기
  const getDishDetails = (meal: MealData | undefined): DishDetail[] => {
    if (!meal) return [];
    const dishes = meal.dishes;
    const totalCals = meal.totalCalories;
    const nutrition = meal.nutrition;

    const details: DishDetail[] = [];
    dishes.forEach((dish, idx) => {
      let kcal = 50;
      let carbs = 5;
      let protein = 1;
      let fat = 1;

      if (idx === 0) { // 밥류
        kcal = 310;
        carbs = 68;
        protein = 5;
        fat = 1;
      } else if (idx === 1) { // 국/찌개
        kcal = 110;
        carbs = 12;
        protein = 4;
        fat = 3;
      } else if (idx === 2) { // 메인 반찬
        kcal = totalCals - 500; // 나머지를 맞추기 위한 밸런스 조정
        if (kcal < 150) kcal = 280;
        carbs = Math.max(5, nutrition.carbs - 87);
        protein = Math.max(10, nutrition.protein - 11);
        fat = Math.max(5, nutrition.fat - 7);
      } else if (idx === 3) { // 보조 반찬
        kcal = 55;
        carbs = 8;
        protein = 1;
        fat = 1;
      } else { // 기타/김치/디저트
        kcal = Math.max(25, totalCals - (310 + 110 + (totalCals - 500 < 150 ? 280 : totalCals - 500) + 55));
        carbs = Math.max(2, nutrition.carbs - (68 + 12 + Math.max(5, nutrition.carbs - 87) + 8));
        protein = Math.max(1, nutrition.protein - (5 + 4 + Math.max(10, nutrition.protein - 11) + 1));
        fat = Math.max(1, nutrition.fat - (1 + 3 + Math.max(5, nutrition.fat - 7) + 1));
      }

      // 동적 알레르기 매칭 키워드 분석
      const allergensCombined: string[] = [];
      const keywords = {
        '돼지고기': ['돼지', '돈육', '돈까스', '제육'],
        '닭고기': ['닭', '치킨'],
        '소고기': ['소고기', '불고기', '우육'],
        '우유': ['우유', '치즈', '요구르트', '스프'],
        '대두': ['두부', '된장', '간장', '대두'],
        '밀': ['밀', '파스타', '빵', '튀김', '떡볶이', '돈까스', '치킨까스', '만두'],
        '새우': ['건새우', '새우'],
        '알류': ['계란', '알', '마요'],
        '토마토': ['토마토']
      };

      Object.entries(keywords).forEach(([allergyName, words]) => {
        if (words.some(word => dish.includes(word))) {
          allergensCombined.push(allergyName);
        }
      });

      details.push({
        name: dish,
        kcal: Math.round(kcal),
        carbs: Math.round(carbs),
        protein: Math.round(protein),
        fat: Math.round(fat),
        allergens: allergensCombined
      });
    });

    return details;
  };

  // 영양계산 active 식단 & dish 데이터
  const calculatorMeal = calculatorSelectedMeal === '중식' ? selectedLunch : selectedDinner;
  const dishesDetailsList = getDishDetails(calculatorMeal);

  // 오늘 날짜 바뀔 때마다 계산기 체크박스 기본값 전체 선택 설정
  useEffect(() => {
    const updatedChecks: Record<string, boolean> = {};
    dishesDetailsList.forEach(d => {
      updatedChecks[d.name] = true;
    });
    setCheckedDishNames(updatedChecks);
  }, [selectedDateKey, calculatorSelectedMeal]);

  // 음식 종류 카테고리 필터링 헬퍼
  const getDishCategory = (idx: number, name: string): '밥류' | '국/찌개' | '반찬' | '디저트' => {
    if (idx === 0) return '밥류';
    if (idx === 1) return '국/찌개';
    if (idx === 4 && (name.includes('요구르트') || name.includes('약과') || name.includes('키위') || name.includes('푸딩'))) {
      return '디저트';
    }
    return '반찬';
  };

  // 선택된 개별 반찬 영양 합산계산
  const checkedDishesList = dishesDetailsList.filter(d => checkedDishNames[d.name]);
  const totalCalCalculated = checkedDishesList.reduce((sum, d) => sum + d.kcal, 0);
  const totalCarbCalculated = checkedDishesList.reduce((sum, d) => sum + d.carbs, 0);
  const totalProteinCalculated = checkedDishesList.reduce((sum, d) => sum + d.protein, 0);
  const totalFatCalculated = checkedDishesList.reduce((sum, d) => sum + d.fat, 0);

  // 알레르기 점 체크 헬퍼
  const getDishHighlightAllergies = (dishAllergens: string[]) => {
    return dishAllergens.filter(all => userAllergies.includes(all));
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans transition-colors duration-300 relative">
      
      {/* 1. AppHeader */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-outline-variant/10 shadow-soft z-40 flex items-center justify-between px-6">
        <button 
          onClick={() => setCurrentTab('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors active:scale-95 duration-100"
          id="header-logo-btn"
        >
          <Utensils className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-primary tracking-tight font-sans">
          씨마스고등학교 급식
        </h1>
        <button 
          onClick={() => {
            setCurrentTab('profile');
            triggerToast('알레르기 필터 설정을 변경해보세요!');
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors active:scale-95 duration-100 relative"
          id="header-notification-btn"
        >
          <Bell className="w-6 h-6" />
          {userAllergies.length > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full" />
          )}
        </button>
      </header>

      {/* PC 레이아웃용 사이드 내비 레일 (md 이상 화면에서 활성) */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-container h-full pt-20 border-r border-outline-variant/20 fixed left-0 top-0 z-30">
        <div className="px-4 py-6 flex flex-col gap-2">
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex items-center gap-4 w-full p-4 rounded-2xl text-left font-semibold transition-all duration-250 ${
              currentTab === 'home'
                ? 'bg-primary text-on-primary shadow-md'
                : 'text-on-surface-variant hover:bg-surface-variant/55'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>홈</span>
          </button>

          <button
            onClick={() => setCurrentTab('schedule')}
            className={`flex items-center gap-4 w-full p-4 rounded-2xl text-left font-semibold transition-all duration-250 ${
              currentTab === 'schedule'
                ? 'bg-primary text-on-primary shadow-md'
                : 'text-on-surface-variant hover:bg-surface-variant/55'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span>식단표</span>
          </button>

          <button
            onClick={() => setCurrentTab('calculator')}
            className={`flex items-center gap-4 w-full p-4 rounded-2xl text-left font-semibold transition-all duration-250 ${
              currentTab === 'calculator'
                ? 'bg-primary text-on-primary shadow-md'
                : 'text-on-surface-variant hover:bg-surface-variant/55'
            }`}
          >
            <Calculator className="w-5 h-5" />
            <span>영양계산</span>
          </button>

          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex items-center gap-4 w-full p-4 rounded-2xl text-left font-semibold transition-all duration-250 ${
              currentTab === 'profile'
                ? 'bg-primary text-on-primary shadow-md'
                : 'text-on-surface-variant hover:bg-surface-variant/55'
            }`}
          >
            <User className="w-5 h-5" />
            <span>프로필</span>
          </button>
        </div>

        <div className="mt-auto p-6 text-xs text-outline text-center">
          <p>© {getTodayKST().getFullYear()} 씨마스고등학교</p>
        </div>
      </aside>

      {/* 2. 메인 콘텐츠 컨테이너 */}
      <main className="flex-1 pt-20 pb-28 px-4 md:pl-72 max-w-4xl w-full mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: 홈 */}
          {currentTab === 'home' && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* 오늘 날짜 정보 배너 */}
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-secondary text-xs uppercase font-bold tracking-widest font-mono">Today's Meal Recommendation</span>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-on-surface">
                    {formatKoreanDate(todayKST)}
                  </h2>
                  {isWeekend && (
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      다음 급식일 기준
                    </span>
                  )}
                </div>
              </div>

              {/* 히어로 추천 카드 */}
              {selectedLunch && (
                <section className="bg-white rounded-3xl overflow-hidden shadow-soft border border-outline-variant/20 group hover:shadow-lg transition-shadow duration-300">
                  <div className="h-60 w-full relative bg-surface-container-highest overflow-hidden">
                    <img 
                      alt="치즈돈까스 정식 한 상 차림의 깔끔하고 화사한 연출 샷"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDy_PGznao_5G5ReyLJCDzBDXoeTHhFjIaZ0xz9lVuiDmn9pakRWP6mA_HSjb63kSbgyYE5iN_AJnc4bEcA2wcoBB7UAR9TjblJi86P2nhz2IFghCCnzmwSCQ-0sN8shyR5-YCyv1dk-enHBuhVrj0oBS0nqlMhjb9KlXer-4-3NdXrggjVLqA28OpyLn6J2280tBEulRiSX-Rb6qnNuT0SUadRNbl7SFwVjVMgK5arJC5fuF0ZsGQ-yc_sH4fVbZkuDMpM2EvqTnA"
                    />
                    <div className="absolute top-4 left-4 bg-primary/95 text-on-primary text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-secondary-fixed" />
                      <span>오늘의 추천 식단</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1.1">
                        <span className="text-secondary text-xs uppercase tracking-wider font-semibold">Representative Menu</span>
                        <h3 className="text-2xl font-bold text-on-surface">{selectedLunch.title}</h3>
                      </div>
                      <span className="bg-surface-container text-on-surface-variant text-sm font-semibold px-4 py-1.5 rounded-full font-mono">
                        {selectedLunch.totalCalories} kcal
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedLunch.allergens.map(item => {
                        const isWarn = userAllergies.includes(item);
                        return (
                          <span 
                            key={item} 
                            className={`text-xs px-3 py-1 rounded-full font-bold transition-all duration-200 ${
                              isWarn 
                                ? 'bg-error-container text-on-error-container ring-1 ring-error/30 animate-shake' 
                                : 'bg-secondary-fixed text-on-secondary-fixed'
                            }`}
                          >
                            {item}
                            {isWarn && ' ⚠️'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* 영양 요약 정보 카드 */}
              <section className="bg-white rounded-3xl p-6 shadow-soft border border-outline-variant/15 flex flex-col gap-4">
                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full block" />
                  오늘의 영양 요약
                </h3>
                
                {selectedLunch && selectedDinner && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-on-surface-variant">총 하루 섭취 칼로리 (중식 + 석식)</span>
                      <span className="text-primary font-bold">
                        {(selectedLunch.totalCalories + selectedDinner.totalCalories)} / 2500 kcal
                      </span>
                    </div>
                    
                    <div className="w-full bg-surface-container-high rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-1000 ease-in-out" 
                        style={{ width: `${Math.min(100, Math.round(((selectedLunch.totalCalories + selectedDinner.totalCalories) / 2500) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-outline font-mono">
                      <span>권장량 대비 달성량</span>
                      <span>{Math.round(((selectedLunch.totalCalories + selectedDinner.totalCalories) / 2500) * 100)}%</span>
                    </div>
                  </div>
                )}
              </section>

              {/* 중식 & 석식 두 기단 리스트 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 중식 카드 */}
                {selectedLunch && (
                  <article className="bg-white rounded-3xl p-6 shadow-soft border border-outline-variant/15 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                      <div className="flex items-center gap-2">
                        <Sun className="w-5 h-5 text-primary" />
                        <h4 className="text-lg font-bold text-primary">중식</h4>
                      </div>
                      <span className="text-xs bg-surface-container-high text-on-surface-variant font-semibold px-2.5 py-1 rounded-full font-mono">
                        {selectedLunch.totalCalories} kcal
                      </span>
                    </div>

                    <ul className="flex flex-col gap-2 font-medium text-on-surface">
                      {selectedLunch.dishes.map((dish, i) => {
                        const matchAllergens = allAvailableAllergies.filter(all => dish.includes(all));
                        const activeAlerts = matchAllergens.filter(all => userAllergies.includes(all));
                        
                        return (
                          <li key={i} className="flex justify-between items-center py-0.5">
                            <span className={i === 2 ? "font-bold text-primary" : "text-sm text-on-surface"}>
                              {dish}
                            </span>
                            
                            {activeAlerts.length > 0 && (
                              <div className="flex gap-1.5">
                                {activeAlerts.map(alert => (
                                  <span 
                                    key={alert} 
                                    className="bg-error-container text-on-error-container text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                                    title={alert}
                                  >
                                    {alert}
                                  </span>
                                ))}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                )}

                {/* 석식 카드 */}
                {selectedDinner && (
                  <article className="bg-white rounded-3xl p-6 shadow-soft border border-outline-variant/15 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                      <div className="flex items-center gap-2">
                        <Moon className="w-5 h-5 text-primary" />
                        <h4 className="text-lg font-bold text-primary">석식</h4>
                      </div>
                      <span className="text-xs bg-surface-container-high text-on-surface-variant font-semibold px-2.5 py-1 rounded-full font-mono">
                        {selectedDinner.totalCalories} kcal
                      </span>
                    </div>

                    <ul className="flex flex-col gap-2 font-medium text-on-surface">
                      {selectedDinner.dishes.map((dish, i) => {
                        const matchAllergens = allAvailableAllergies.filter(all => dish.includes(all));
                        const activeAlerts = matchAllergens.filter(all => userAllergies.includes(all));
                        
                        return (
                          <li key={i} className="flex justify-between items-center py-0.5">
                            <span className={i === 2 ? "font-bold text-primary" : "text-sm text-on-surface"}>
                              {dish}
                            </span>
                            
                            {activeAlerts.length > 0 && (
                              <div className="flex gap-1.5">
                                {activeAlerts.map(alert => (
                                  <span 
                                    key={alert} 
                                    className="bg-error-container text-on-error-container text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
                                    title={alert}
                                  >
                                    {alert}
                                  </span>
                                ))}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                )}

              </div>
            </motion.div>
          )}

          {/* TAB 2: 식단표 */}
          {currentTab === 'schedule' && (
            <motion.div
              key="schedule-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* 주간 타이틀 및 계산 영역 */}
              <section className="flex justify-between items-end mt-2">
                <div>
                  <span className="text-secondary text-xs uppercase tracking-widest font-bold font-mono">Weekly Menu Schedule</span>
                  <h2 className="text-2xl font-bold text-on-surface">
                    {getWeekOfMonth(selectedDate).month}월 {getWeekOfMonth(selectedDate).week}주차
                  </h2>
                </div>
                <button 
                  onClick={() => triggerToast(`현재는 ${getWeekOfMonth(selectedDate).month}월의 집중 식단표가 자동 반영되어 있습니다!`)}
                  className="bg-secondary-container/60 hover:bg-secondary-container text-on-secondary-container text-xs font-bold px-4 py-2 rounded-full transition-colors shadow-sm"
                >
                  이번 달 식단
                </button>
              </section>

              {/* 요일선택 날짜 스크롤러 바 (월요일~금요일 동적 계산) */}
              <section className="flex justify-between gap-2.5 py-2 overflow-x-auto scrollbar-none">
                {weekDates.map((date, idx) => {
                  const isCurSelected = formatDateKey(date) === selectedDateKey;
                  const weekdayStr = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
                  const calendarDayNum = date.getDate();
                  const isTodayActive = formatDateKey(date) === formatDateKey(todayKST);

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center justify-center min-w-14 h-20 rounded-full transition-all duration-200 cursor-pointer ${
                        isCurSelected
                          ? 'bg-primary text-on-primary shadow-md scale-105 ring-2 ring-primary-container'
                          : 'bg-white text-on-surface-variant hover:bg-surface-container border border-outline-variant/35'
                      } relative`}
                    >
                      <span className={`text-xs ${isCurSelected ? 'text-on-primary/75' : 'text-outline'} font-bold mb-1`}>
                        {weekdayStr}
                      </span>
                      <span className="text-lg font-bold">
                        {calendarDayNum}
                      </span>
                      {isTodayActive && !isCurSelected && (
                        <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </section>

              {/* 선택된 날짜 식단 상세 카드 */}
              <section className="flex flex-col gap-6">
                
                {/* 중식 카드 */}
                {selectedLunch ? (
                  <article className="bg-white rounded-3xl p-6 shadow-soft border border-outline-variant/15 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute -right-8 -top-8 w-28 h-28 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none" />
                    
                    <header className="flex justify-between items-center mb-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <Sun className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-primary">중식</h3>
                      </div>
                      <span className="text-xs bg-surface-container-high text-on-surface px-3 py-1.5 rounded-full border border-outline-variant/20 font-semibold font-mono">
                        {selectedLunch.totalCalories} kcal
                      </span>
                    </header>

                    <ul className="text-sm font-semibold space-y-2.5 mb-5 relative z-10 text-on-surface">
                      {selectedLunch.dishes.map((dish, i) => {
                        const allergensToShow = allAvailableAllergies.filter(all => dish.includes(all));
                        return (
                          <li key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary block" />
                              <span className={i === 2 ? 'text-primary font-bold' : ''}>{dish}</span>
                            </div>
                            {allergensToShow.length > 0 && (
                              <div className="flex gap-1.5">
                                {allergensToShow.map(all => {
                                  const isWarn = userAllergies.includes(all);
                                  return (
                                    <span 
                                      key={all} 
                                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                        isWarn ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'
                                      }`}
                                    >
                                      {all}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {/* 영양소 달성 바 */}
                    <div className="relative z-10 pt-4 border-t border-surface-variant">
                      <div className="flex justify-between items-center text-xs font-semibold mb-2">
                        <span className="text-on-surface-variant">단백질 함량</span>
                        <span className="text-primary font-bold">{selectedLunch.nutrition.protein}g / 50g</span>
                      </div>
                      <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${Math.min(100, Math.round((selectedLunch.nutrition.protein / 50) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </article>
                ) : (
                  <p className="text-center py-10 text-outline">해당 일자의 급식 정보가 없습니다.</p>
                )}

                {/* 석식 카드 */}
                {selectedDinner ? (
                  <article className="bg-white rounded-3xl p-6 shadow-soft border border-outline-variant/15 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <header className="flex justify-between items-center mb-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <Moon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-primary">석식</h3>
                      </div>
                      <span className="text-xs bg-surface-container-high text-on-surface px-3 py-1.5 rounded-full border border-outline-variant/20 font-semibold font-mono">
                        {selectedDinner.totalCalories} kcal
                      </span>
                    </header>

                    <ul className="text-sm font-semibold space-y-2.5 mb-5 relative z-10 text-on-surface">
                      {selectedDinner.dishes.map((dish, i) => {
                        const allergensToShow = allAvailableAllergies.filter(all => dish.includes(all));
                        return (
                          <li key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant block" />
                              <span className={i === 2 ? 'text-primary font-bold' : ''}>{dish}</span>
                            </div>
                            {allergensToShow.length > 0 && (
                              <div className="flex gap-1.5">
                                {allergensToShow.map(all => {
                                  const isWarn = userAllergies.includes(all);
                                  return (
                                    <span 
                                      key={all} 
                                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                        isWarn ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'
                                      }`}
                                    >
                                      {all}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {/* 영양소 달성 바 */}
                    <div className="relative z-10 pt-4 border-t border-surface-variant">
                      <div className="flex justify-between items-center text-xs font-semibold mb-2">
                        <span className="text-on-surface-variant">단백질 함량</span>
                        <span className="text-primary-fixed-dim font-bold">{selectedDinner.nutrition.protein}g / 50g</span>
                      </div>
                      <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-fixed-dim rounded-full" 
                          style={{ width: `${Math.min(100, Math.round((selectedDinner.nutrition.protein / 50) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </article>
                ) : null}

              </section>
            </motion.div>
          )}

          {/* TAB 3: 영양계산 */}
          {currentTab === 'calculator' && (
            <motion.div
              key="calculator-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* 타이틀 헤더 */}
              <section className="flex flex-col gap-1 mt-2">
                <h2 className="text-xl font-bold text-on-surface">오늘의 영양 요약</h2>
                <p className="text-sm text-on-surface-variant">선택한 메뉴의 총 영양성분입니다.</p>
              </section>

              {/* 영양 정보 디스플레이 보드 (Bento Style) */}
              <section className="bg-white rounded-3xl p-6 shadow-soft border border-outline-variant/15 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                
                {/* 실시간 칼로리 카운트 */}
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl font-bold text-primary font-mono">{totalCalCalculated}</span>
                  <span className="text-on-surface-variant text-sm font-semibold">kcal</span>
                </div>

                {/* 3대 영양소 바 디스플레이 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 단백질 */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-outline">단백질</span>
                      <span className="text-on-surface font-bold font-mono">{totalProteinCalculated}g</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((totalProteinCalculated / 60) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* 탄수화물 */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-outline">탄수화물</span>
                      <span className="text-on-surface font-bold font-mono">{totalCarbCalculated}g</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((totalCarbCalculated / 300) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* 지방 */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-outline">지방</span>
                      <span className="text-on-surface font-bold font-mono">{totalFatCalculated}g</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-tertiary-container transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((totalFatCalculated / 60) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 메뉴 목록 & 칩 스크롤 */}
              <section className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-on-surface">메뉴 선택</h3>
                  
                  {/* 중식/석식 토글 스위치 */}
                  <div className="flex bg-surface-container border border-outline-variant/20 p-1 rounded-full text-xs font-semibold self-end">
                    <button
                      onClick={() => setCalculatorSelectedMeal('중식')}
                      className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                        calculatorSelectedMeal === '중식' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
                      }`}
                    >
                      중식
                    </button>
                    <button
                      onClick={() => setCalculatorSelectedMeal('석식')}
                      className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                        calculatorSelectedMeal === '석식' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant'
                      }`}
                    >
                      석식
                    </button>
                  </div>
                </div>

                {/* 필터 칩 스크롤바 */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {(['전체', '밥류', '국/찌개', '반찬', '디저트'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setCalculatorFilter(filter)}
                      className={`px-4.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                        calculatorFilter === filter
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container hover:bg-surface-variant text-on-surface-variant border border-outline-variant/25'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* 메뉴 리스트 체크박스 항목들 */}
                <div className="flex flex-col gap-2.5">
                  {dishesDetailsList
                    .map((dish, i) => ({ ...dish, category: getDishCategory(i, dish.name) }))
                    .filter(dish => calculatorFilter === '전체' || dish.category === calculatorFilter)
                    .map((dish, idx) => {
                      const isChecked = !!checkedDishNames[dish.name];
                      const activeAllergies = getDishHighlightAllergies(dish.allergens);

                      return (
                        <label
                          key={idx}
                          role="button"
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                            isChecked
                              ? 'border-primary bg-primary/4'
                              : 'border-outline-variant/30 hover:border-outline bg-white'
                          }`}
                        >
                          {/* 하이퀄리티 체크 서클 아이콘 */}
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              setCheckedDishNames(prev => ({ ...prev, [dish.name]: !prev[dish.name] }));
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isChecked ? 'bg-primary text-on-primary' : 'border-2 border-outline-variant bg-surface'
                            }`}
                          >
                            {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>

                          {/* 메명 및 통계 디테일 */}
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-on-surface text-sm">{dish.name}</span>
                              {activeAllergies.length > 0 && (
                                <span className="bg-error-container text-on-error-container text-[8px] font-bold px-1 rounded-sm">
                                  필터
                                </span>
                              )}
                            </div>
                            
                            <div className="flex gap-2.5 mt-1 text-[11px] text-on-surface-variant font-medium">
                              <span className="bg-surface-container px-2 py-0.5 rounded-full text-[10px] font-mono">{dish.kcal} kcal</span>
                              <span className="bg-surface-container px-2 py-0.5 rounded-full text-[10px] font-mono">탄 {dish.carbs}g</span>
                              <span className="bg-surface-container px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold text-primary">단 {dish.protein}g</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </section>

              {/* 계산 결과 저장 플로팅 버튼 */}
              <div className="mt-4">
                <button
                  onClick={() => triggerToast(`수식 합산 결과(${totalCalCalculated}kcal)가 다이어리에 성공적으로 저장되었습니다!`)}
                  className="w-full bg-primary-container text-on-primary py-4.5 rounded-full shadow-md hover:bg-primary font-bold text-sm tracking-wide transition-all active:scale-[0.98] duration-150 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  계산 결과 저장하기
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 4: 프로필 */}
          {currentTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              {/* 프로필 카드 계정 */}
              <section className="bg-white rounded-3xl p-6 shadow-soft border border-outline-variant/15 flex items-center gap-5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed-dim/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-4 border-surface ring-2 ring-primary-container/20 shadow-inner">
                  <img
                    alt="김학생 학생 증명 사진 느낌의 일러스트 프로필" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5m_0hsqqfoPWtcbSboFmwOTb2gEenXB9EpqhZ0QnPWA99CgnqN06piYDqk3BAqxwi9uOUahKi8GwrMbFOoG7o3kbYz-LHar0MCx4z1Ds8vHCVNHQuqXa1tQJIZYUYZrU_JWTHno37caSSiRKVl-oOJEPfoY1Yl6ch4mfsrZbB4Mm-e7kyXloyqIK1L5qPy1Aw0ybEjBGaSS81FB3OApLzQ6zsiA1TJJecTq8486LW2UXQ3C1NG2Z5223AqqiOXt9CFJVavp8cFO4"
                  />
                </div>
                
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-on-surface">김학생</h3>
                  <p className="text-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span>씨마스고등학교 2학년 3반 15번</span>
                  </p>
                </div>
              </section>

              {/* 설정 리스트들 */}
              <section className="flex flex-col gap-4">
                
                {/* 알레르기 제어 경고 카드 컴포넌트 */}
                <div className="bg-white rounded-3xl p-6 shadow-soft border border-outline-variant/15 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-error-container/85 text-on-error-container flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-base">알레르기 경고 설정</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">설정된 알레르기 유발 물질이 포함된 급식의 경우 식단에 표시합니다.</p>
                      </div>
                    </div>
                  </div>

                  {/* 세팅된 태그 리스트 */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {userAllergies.map(item => (
                      <span 
                        key={item} 
                        className="bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1"
                      >
                        <span>{item}</span>
                        <X 
                          className="w-3.5 h-3.5 hover:text-error cursor-pointer" 
                          onClick={() => {
                            setUserAllergies(prev => prev.filter(all => all !== item));
                            triggerToast(`${item} 알레르기 모니터링이 중단되었습니다.`);
                          }}
                        />
                      </span>
                    ))}
                    
                    <button
                      onClick={() => setShowAllergySelector(!showAllergySelector)}
                      className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center border border-outline-variant/30 hover:bg-outline-variant transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 추가용 드롭다운 멀티셀렉터 */}
                  {showAllergySelector && (
                    <div className="bg-surface-container p-4 rounded-2xl flex flex-wrap gap-1.5 border border-outline-variant/20 animate-slide-down">
                      <span className="text-xs text-outline w-full mb-1 font-semibold">추가할 유발 요인 클릭:</span>
                      {allAvailableAllergies
                        .filter(all => !userAllergies.includes(all))
                        .map(all => (
                          <button
                            key={all}
                            onClick={() => {
                              setUserAllergies(prev => [...prev, all]);
                              setShowAllergySelector(false);
                              triggerToast(`${all} 알레르기가 감시 필터에 추가되었습니다.`);
                            }}
                            className="bg-white border border-outline-variant/40 hover:bg-primary/5 text-on-surface-variant text-xs font-bold px-2.5 py-1.2 rounded-lg cursor-pointer"
                          >
                            + {all}
                          </button>
                        ))
                      }
                      {allAvailableAllergies.filter(all => !userAllergies.includes(all)).length === 0 && (
                        <p className="text-xs text-outline font-medium">모든 요인이 필터링 중입니다.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 알림 동기화 트리거 */}
                <div 
                  onClick={() => {
                    setDailyNotification(!dailyNotification);
                    triggerToast(`급식 아침 소식 알람이 ${!dailyNotification ? '활성화' : '비활성화'}되었습니다.`);
                  }}
                  className="bg-white rounded-3xl p-6 shadow-soft border border-outline-variant/15 flex items-center justify-between hover:scale-[1.01] transition-transform duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                      <BellRing className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface text-sm">일일 식단 알림</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">매일 아침 7시 40분 오늘의 식단을 카카오 아림 알림으로 통보합니다.</p>
                    </div>
                  </div>
                  
                  {/* 스위치 버튼 */}
                  <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ${dailyNotification ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${dailyNotification ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* 고객센터 및 탈출 */}
                <button 
                  onClick={() => triggerToast('씨마스고등학교 영양조리실 카카오플러스챗으로 연결됩니다.')}
                  className="w-full bg-white rounded-3xl p-5 shadow-soft border border-outline-variant/15 flex items-center justify-between hover:bg-surface-container/30 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container text-on-surface flex items-center justify-center">
                      <Headphones className="w-5 h-5 text-on-surface-variant" />
                    </div>
                    <h4 className="font-bold text-on-surface text-sm">급식 건의 / 고객센터</h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-outline" />
                </button>

                <button 
                  onClick={() => triggerToast('서비스는 데모 상태입니다. 로그아웃이 불가능합니다.')}
                  className="w-full bg-white rounded-3xl p-5 shadow-soft border border-outline-variant/15 flex items-center justify-between hover:bg-error-container/20 hover:text-error transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 border-transparent">
                    <div className="w-10 h-10 rounded-full bg-surface-container text-on-surface group-hover:bg-error-container group-hover:text-error flex items-center justify-center transition-colors">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-on-surface text-sm group-hover:text-error transition-colors">계정 로그아웃</h4>
                  </div>
                </button>

              </section>

              {/* 하단 카피 */}
              <div className="text-center text-xs text-outline py-4">
                <p>© {getTodayKST().getFullYear()} 씨마스고등학교 급식</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 3. BottomNavBar (모바일 전용 바텀 고정 네비 - md 디바이스 분기 처리) */}
      <nav className="fixed bottom-0 left-0 right-0 h-18 bg-surface-container border-t border-outline-variant/20 shadow-[0px_-4px_25px_rgba(79,111,0,0.04)] z-40 md:hidden flex justify-around items-center px-4 rounded-t-3xl">
        
        {/* 홈 */}
        <button
          onClick={() => {
            setCurrentTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all cursor-pointer ${
            currentTab === 'home' ? 'bg-primary text-on-primary shadow-sm scale-102 font-bold px-3' : 'text-on-surface-variant'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">홈</span>
        </button>

        {/* 식단표 */}
        <button
          onClick={() => {
            setCurrentTab('schedule');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all cursor-pointer ${
            currentTab === 'schedule' ? 'bg-primary text-on-primary shadow-sm scale-102 font-bold px-3' : 'text-on-surface-variant'
          }`}
        >
          <CalendarIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">식단표</span>
        </button>

        {/* 영양계산 */}
        <button
          onClick={() => {
            setCurrentTab('calculator');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all cursor-pointer ${
            currentTab === 'calculator' ? 'bg-primary text-on-primary shadow-sm scale-102 font-bold px-3' : 'text-on-surface-variant'
          }`}
        >
          <Calculator className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">영양계산</span>
        </button>

        {/* 프로필 */}
        <button
          onClick={() => {
            setCurrentTab('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all cursor-pointer ${
            currentTab === 'profile' ? 'bg-primary text-on-primary shadow-sm scale-102 font-bold px-3' : 'text-on-surface-variant'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">프로필</span>
        </button>

      </nav>

      {/* 실시간 알림 토스트 윈도우 */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-xs font-semibold px-5 py-3 rounded-xl shadow-xl z-50 flex items-center gap-1.8 tracking-wide whitespace-nowrap"
          >
            <span>💬 {toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
