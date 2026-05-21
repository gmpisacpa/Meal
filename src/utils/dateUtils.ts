/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 한국 시간(KST, Asia/Seoul) 기준의 Date 객체를 생성합니다.
 * 사용자의 기기 타임존 환경에 상관없이 항상 일관되게 KST 기준 calendar date를 가집니다.
 */
export function getTodayKST(): Date {
  const d = new Date();
  
  // Intl.DateTimeFormat을 사용하여 Asia/Seoul 타임존의 정확한 날짜 구성 요소를 가져옵니다.
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const partValues = parts.reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = parseInt(part.value, 10);
    }
    return acc;
  }, {} as Record<string, number>);

  // KST 시간대를 가진 Date 객체를 생성하여 반환합니다.
  return new Date(
    partValues.year,
    partValues.month - 1,
    partValues.day,
    partValues.hour,
    partValues.minute,
    partValues.second
  );
}

/**
 * “M월 N일 요요일” 형식으로 변환합니다. 예: “5월 15일 금요일”
 */
export function formatKoreanDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = days[date.getDay()];
  return `${month}월 ${day}일 ${dayOfWeek}요일`;
}

/**
 * “YYYYMMDD” 형식의 날짜 Key값을 반환합니다.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 해당 날짜의 요일 이름을 반환합니다. (예: 월, 화, 수)
 */
export function getKoreanDayOfWeek(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}

/**
 * 해당 날짜가 속한 주의 월요일부터 금요일까지 5일치 Date 배열을 반환합니다.
 */
export function getWeekDates(date: Date): Date[] {
  const currentDay = date.getDay(); // 0 (Sun) to 6 (Sat)
  
  // 월요일이 시작일이 되도록 오프셋 계산 (일요일이면 -6, 월요일이면 0, 화요일이면 -1...)
  const dayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(date);
  monday.setDate(date.getDate() + dayOffset);
  monday.setHours(0, 0, 0, 0);

  const weekDates: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const weekDay = new Date(monday);
    weekDay.setDate(monday.getDate() + i);
    weekDates.push(weekDay);
  }
  return weekDates;
}

/**
 * 해당 날짜가 몇 월 몇 주차인지 계산합니다.
 */
export function getWeekOfMonth(date: Date): { month: number; week: number } {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  
  // 해당 월의 1일 구하기
  const firstDayOfMonth = new Date(year, month, 1);
  const dayOfWeekOfFirst = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  
  // 첫 주의 시작일을 보정하여 월요일 기준 N주차를 계산합니다.
  const dateDay = date.getDate();
  const adjustedDay = dateDay + (dayOfWeekOfFirst === 0 ? 6 : dayOfWeekOfFirst - 1);
  const week = Math.ceil(adjustedDay / 7);
  
  return {
    month: month + 1,
    week: week
  };
}

/**
 * 오늘이 토요일 또는 일요일인 경우, 가장 가가운 meal 날짜를 선택합니다.
 * - 평일이면 오늘 반환
 * - 토요일이면 직전 금요일 반환
 * - 일요일이면 다음 월요일 반환
 */
export function getDefaultSelectedDate(today: Date): Date {
  const day = today.getDay();
  if (day === 6) { // 토요일
    const friday = new Date(today);
    friday.setDate(today.getDate() - 1);
    return friday;
  } else if (day === 0) { // 일요일
    const monday = new Date(today);
    monday.setDate(today.getDate() + 1);
    return monday;
  }
  return today;
}
