import type { LunarBirth, Member } from "./types";

const monthNames: Record<number, string> = {
  1: "正月",
  2: "二月",
  3: "三月",
  4: "四月",
  5: "五月",
  6: "六月",
  7: "七月",
  8: "八月",
  9: "九月",
  10: "十月",
  11: "冬月",
  12: "腊月"
};

const dayNames = [
  "",
  "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
  "二十一", "二十二", "二十三", "二十四", "二十五", "二十六", "二十七", "二十八", "二十九", "三十"
];

export function lunarMonthName(month: number): string {
  return monthNames[month] ?? `${month}月`;
}

export function lunarDayName(day: number): string {
  return dayNames[day] ?? `${day}日`;
}

export function formatLunarDate(birth: LunarBirth, includeYear = true): string {
  const value = `${birth.leap ? "闰" : ""}${lunarMonthName(birth.month)}${lunarDayName(birth.day)}`;
  return includeYear ? `${birth.year}年${value}` : value;
}

export function sortByLunarBirthday(left: Member, right: Member): number {
  return left.lunarBirth.month - right.lunarBirth.month || left.lunarBirth.day - right.lunarBirth.day;
}
