import { Lunar, LunarUtil, Solar } from "lunar-typescript";
import { calculateChart, calculateCycles } from "xuantian-bazi";
import type { Member } from "./types";

export type WuXing = "木" | "火" | "土" | "金" | "水";

export type BaziPillars = {
  year: string;
  month: string;
  day: string;
  hour: string;
};

export type BaziCandidate = {
  label: string;
  pillars: BaziPillars;
  dayMaster: string;
  details: BaziPillarDetails[];
};

export type BaziPillarDetails = {
  key: "year" | "month" | "day" | "hour";
  label: string;
  mainStar: string;
  stem: string;
  branch: string;
  hiddenStems: string[];
  secondaryStars: string[];
  stage: string;
  selfStage: string;
  void: string;
  naYin: string;
  shenSha: string[];
};

export type BaziResult = {
  status: "ready" | "ambiguous" | "missing" | "invalid";
  solarDate?: string;
  birthTime?: string;
  timeBasis?: "recorded" | "default";
  candidates: BaziCandidate[];
  message: string;
};

export type BaziYearCycle = {
  year: number;
  ganZhi: string;
  stemStar: string;
  branchStar: string;
  active: boolean;
};

export type BaziDecadeCycle = {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  stemStar: string;
  branchStar: string;
  active: boolean;
  years: BaziYearCycle[];
};

export type BaziMonthCycle = {
  month: number;
  name: string;
  date: string;
  ganZhi: string;
  stemStar: string;
  branchStar: string;
  active: boolean;
};

export type BaziFineResult = {
  status: "ready" | "missing" | "invalid";
  message: string;
  birthTime?: string;
  timeBasis?: "recorded" | "default";
  startYun?: string;
  startDate?: string;
  direction?: string;
  commandingStem?: string;
  seasonStrength: Array<{ element: WuXing; state: string }>;
  taiYuan?: string;
  taiXi?: string;
  mingGong?: string;
  shenGong?: string;
  decades: BaziDecadeCycle[];
};

const TIME_WINDOWS: Record<string, Array<[number, number, string]>> = {
  子: [[0, 0, "早子时 00:00–00:59"], [23, 23, "晚子时 23:00–23:59"]],
  丑: [[1, 2, "丑时 01:00–02:59"]],
  寅: [[3, 4, "寅时 03:00–04:59"]],
  卯: [[5, 6, "卯时 05:00–06:59"]],
  辰: [[7, 8, "辰时 07:00–08:59"]],
  巳: [[9, 10, "巳时 09:00–10:59"]],
  午: [[11, 12, "午时 11:00–12:59"]],
  未: [[13, 14, "未时 13:00–14:59"]],
  申: [[15, 16, "申时 15:00–16:59"]],
  酉: [[17, 18, "酉时 17:00–18:59"]],
  戌: [[19, 20, "戌时 19:00–20:59"]],
  亥: [[21, 22, "亥时 21:00–22:59"]]
};

const GAN_WUXING: Record<string, WuXing> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水"
};

const ZHI_WUXING: Record<string, WuXing> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水"
};

const GAN_YINYANG: Record<string, "阳" | "阴"> = {
  甲: "阳", 乙: "阴", 丙: "阳", 丁: "阴", 戊: "阳", 己: "阴", 庚: "阳", 辛: "阴", 壬: "阳", 癸: "阴"
};

const HIDDEN_STEMS: Record<string, string[]> = {
  子: ["癸"], 丑: ["己", "癸", "辛"], 寅: ["甲", "丙", "戊"], 卯: ["乙"],
  辰: ["戊", "乙", "癸"], 巳: ["丙", "庚", "戊"], 午: ["丁", "己"], 未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"], 酉: ["辛"], 戌: ["戊", "辛", "丁"], 亥: ["壬", "甲"]
};

const SEASON_STRENGTH: Record<string, Array<{ element: WuXing; state: string }>> = {
  spring: [
    { element: "木", state: "旺" }, { element: "火", state: "相" }, { element: "水", state: "休" },
    { element: "金", state: "囚" }, { element: "土", state: "死" }
  ],
  summer: [
    { element: "火", state: "旺" }, { element: "土", state: "相" }, { element: "木", state: "休" },
    { element: "水", state: "囚" }, { element: "金", state: "死" }
  ],
  autumn: [
    { element: "金", state: "旺" }, { element: "水", state: "相" }, { element: "土", state: "休" },
    { element: "火", state: "囚" }, { element: "木", state: "死" }
  ],
  winter: [
    { element: "水", state: "旺" }, { element: "木", state: "相" }, { element: "金", state: "休" },
    { element: "土", state: "囚" }, { element: "火", state: "死" }
  ],
  earth: [
    { element: "土", state: "旺" }, { element: "金", state: "相" }, { element: "火", state: "休" },
    { element: "木", state: "囚" }, { element: "水", state: "死" }
  ]
};

const MONTH_TERMS = ["立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "小寒"];

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const CHANG_SHENG_START: Record<string, string> = {
  甲: "亥", 丙: "寅", 戊: "寅", 庚: "巳", 壬: "申", 乙: "午", 丁: "酉", 己: "酉", 辛: "子", 癸: "卯"
};
const CHANG_SHENG_ORDER = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
const SHENSHA_ORDER = [
  "三奇贵人", "天乙贵人", "太极贵人", "天德贵人", "月德贵人", "德秀贵人",
  "天德合", "月德合", "文昌贵人", "国印贵人", "福星贵人", "天厨贵人",
  "禄神", "金舆", "天赦日", "正学堂", "词馆", "十灵日", "六秀日", "华盖",
  "将星", "桃花", "红鸾", "天喜", "驿马", "天医", "魁罡日", "金神",
  "羊刃", "飞刃", "血刃", "红艳煞", "流霞", "孤辰", "寡宿", "童子煞",
  "孤鸾煞", "阴差阳错", "九丑日", "八专日", "十恶大败", "勾绞煞", "丧门",
  "吊客", "披麻", "劫煞", "灾煞", "亡神", "空亡", "元辰"
];
const SAN_QI = new Set(["甲戊庚", "乙丙丁", "壬癸辛"]);

export function elementOf(value: string): WuXing | undefined {
  return GAN_WUXING[value] ?? ZHI_WUXING[value];
}

function relation(dayElement: WuXing, targetElement: WuXing): "同" | "生" | "克" | "被生" | "被克" {
  if (dayElement === targetElement) return "同";
  const generates: Record<WuXing, WuXing> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const controls: Record<WuXing, WuXing> = { 木: "土", 火: "金", 土: "水", 金: "木", 水: "火" };
  if (generates[dayElement] === targetElement) return "生";
  if (controls[dayElement] === targetElement) return "克";
  if (generates[targetElement] === dayElement) return "被生";
  return "被克";
}

function tenGod(dayMaster: string, target: string): string {
  const sameYinYang = GAN_YINYANG[dayMaster] === GAN_YINYANG[target];
  switch (relation(GAN_WUXING[dayMaster], GAN_WUXING[target])) {
    case "同": return sameYinYang ? "比肩" : "劫财";
    case "生": return sameYinYang ? "食神" : "伤官";
    case "克": return sameYinYang ? "偏财" : "正财";
    case "被克": return sameYinYang ? "七杀" : "正官";
    case "被生": return sameYinYang ? "偏印" : "正印";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordText(record: Record<string, unknown>, key: string, fallback = ""): string {
  const value = record[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

function recordNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function seasonStrengthFor(monthBranch: string): Array<{ element: WuXing; state: string }> {
  if (["辰", "戌", "丑", "未"].includes(monthBranch)) return SEASON_STRENGTH.earth;
  if (["寅", "卯"].includes(monthBranch)) return SEASON_STRENGTH.spring;
  if (["巳", "午"].includes(monthBranch)) return SEASON_STRENGTH.summer;
  if (["申", "酉"].includes(monthBranch)) return SEASON_STRENGTH.autumn;
  return SEASON_STRENGTH.winter;
}

function termDateFor(year: number, monthIndex: number): { name: string; date: string } {
  const name = MONTH_TERMS[monthIndex - 1] ?? `${monthIndex}月`;
  const termYear = monthIndex === 12 ? year + 1 : year;
  const sample = Solar.fromYmd(termYear, monthIndex === 12 ? 1 : 7, 15);
  const term = sample.getLunar().getJieQiTable()[name];
  if (!term) return { name, date: "" };
  return { name, date: `${term.getMonth()}/${term.getDay()}` };
}

function cycleStars(dayMaster: string, ganZhi: string): { stemStar: string; branchStar: string } {
  const stem = ganZhi[0];
  const branch = ganZhi[1];
  const mainHiddenStem = HIDDEN_STEMS[branch]?.[0];
  return {
    stemStar: GAN_WUXING[stem] ? tenGod(dayMaster, stem) : "",
    branchStar: mainHiddenStem ? tenGod(dayMaster, mainHiddenStem) : ""
  };
}

export type BaziBirthTime = {
  birthDate: string;
  birthTime: string;
  second: number;
  source: "recorded" | "default";
  branch?: string;
};

function exactBirthInput(member: Member): BaziBirthTime | undefined {
  const exact = member.solarBirth?.match(/^(\d{4}-\d{2}-\d{2})\s(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!exact) return undefined;
  return {
    birthDate: exact[1],
    birthTime: `${exact[2]}:${exact[3]}`,
    second: Number(exact[4] ?? 0),
    source: "recorded"
  };
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function resolveBaziBirthTime(member: Member): BaziBirthTime | undefined {
  const exact = exactBirthInput(member);
  if (exact) return exact;

  const branch = member.lunarBirth.time?.match(/([子丑寅卯辰巳午未申酉戌亥])时/)?.[1];
  const windows = branch ? TIME_WINDOWS[branch] : undefined;
  if (!branch || !windows) return undefined;

  const solarDate = solarDateFor(member);
  const availableMinutes = windows.flatMap(([startHour, endHour]) => {
    const minutes: Array<{ hour: number; minute: number }> = [];
    for (let hour = startHour; hour <= endHour; hour += 1) {
      for (let minute = 0; minute < 60; minute += 1) minutes.push({ hour, minute });
    }
    return minutes;
  });
  const seed = `${member.id}|${member.name}|${member.lunarBirth.year}-${member.lunarBirth.month}-${member.lunarBirth.day}|${branch}`;
  const selected = availableMinutes[stableHash(seed) % availableMinutes.length];
  return {
    birthDate: solarDate.text,
    birthTime: `${String(selected.hour).padStart(2, "0")}:${String(selected.minute).padStart(2, "0")}`,
    second: 0,
    source: "default",
    branch
  };
}

function chartInputFor(member: Member) {
  const resolved = resolveBaziBirthTime(member);
  if (!resolved || !member.gender) return undefined;
  return {
    gender: member.gender === "女" ? "female" as const : "male" as const,
    calendar: "solar" as const,
    birthDate: resolved.birthDate,
    birthTime: resolved.birthTime,
    trueSolarTime: false,
    sect: 1 as const,
    locale: "zh-CN" as const
  };
}

function changSheng(stem: string, branch: string): string {
  const startIndex = BRANCHES.indexOf(CHANG_SHENG_START[stem]);
  const branchIndex = BRANCHES.indexOf(branch);
  const forward = GAN_YINYANG[stem] === "阳";
  const step = forward
    ? (branchIndex - startIndex + 12) % 12
    : (startIndex - branchIndex + 12) % 12;
  return CHANG_SHENG_ORDER[step];
}

function sortedShenSha(items: string[]): string[] {
  return [...new Set(items)].sort((left, right) => {
    const leftIndex = SHENSHA_ORDER.indexOf(left);
    const rightIndex = SHENSHA_ORDER.indexOf(right);
    return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
  });
}

function shenShaFor(
  pillars: BaziPillars,
  member: Member,
  birthDate: string,
  birthTime: string
): Record<BaziPillarDetails["key"], string[]> {
  const result: Record<BaziPillarDetails["key"], string[]> = { year: [], month: [], day: [], hour: [] };

  try {
    const chart = calculateChart({
      gender: member.gender === "女" ? "female" : "male",
      calendar: "solar",
      birthDate,
      birthTime,
      trueSolarTime: false,
      sect: 1,
      locale: "zh-CN"
    });
    const expected = [pillars.year, pillars.month, pillars.day, pillars.hour];
    const enginePillars = chart.normalizedChart.pillars as Array<Record<string, unknown>>;

    enginePillars.forEach((pillar, index) => {
      const key = pillar.type as BaziPillarDetails["key"];
      if (!result[key] || pillar.ganZhi !== expected[index]) return;
      const shenSha = Array.isArray(pillar.shenSha) ? pillar.shenSha.map(String) : [];
      result[key] = member.gender ? shenSha : shenSha.filter((name) => name !== "元辰");
    });
  } catch {
    // 神煞是补充层；引擎异常时保留四柱主体，不制造推算结果。
  }

  const stems = [pillars.year[0], pillars.month[0], pillars.day[0], pillars.hour[0]];
  ([0, 1] as const).forEach((start) => {
    if (SAN_QI.has(stems.slice(start, start + 3).join(""))) {
      const middleKey = (["year", "month", "day", "hour"] as const)[start + 1];
      result[middleKey].push("三奇贵人");
    }
  });

  return {
    year: sortedShenSha(result.year),
    month: sortedShenSha(result.month),
    day: sortedShenSha(result.day),
    hour: sortedShenSha(result.hour)
  };
}

function detailsFor(
  pillars: BaziPillars,
  shenSha: Record<BaziPillarDetails["key"], string[]>
): BaziPillarDetails[] {
  const dayMaster = pillars.day[0];
  const entries = [
    ["year", "年柱", pillars.year],
    ["month", "月柱", pillars.month],
    ["day", "日柱", pillars.day],
    ["hour", "时柱", pillars.hour]
  ] as const;

  return entries.map(([key, label, pillar]) => {
    const stem = pillar[0];
    const branch = pillar[1];
    const hiddenStems = HIDDEN_STEMS[branch] ?? [];
    return {
      key,
      label,
      mainStar: key === "day" ? "日主" : tenGod(dayMaster, stem),
      stem,
      branch,
      hiddenStems,
      secondaryStars: hiddenStems.map((hiddenStem) => tenGod(dayMaster, hiddenStem)),
      stage: changSheng(dayMaster, branch),
      selfStage: changSheng(stem, branch),
      void: LunarUtil.getXunKong(pillar),
      naYin: LunarUtil.NAYIN[pillar] ?? "待核",
      shenSha: shenSha[key]
    };
  });
}

function parseGanZhi(value: string): string {
  return value.slice(0, 2);
}

function accurateMonthGanZhi(solar: Solar): string {
  const lunar = solar.getLunar();
  const fallback = lunar.getMonthInGanZhi();
  const jieQiSolar = lunar.getJieQiTable()[lunar.getJieQi()];

  if (!jieQiSolar) return parseGanZhi(fallback);
  const sameDay = solar.getYear() === jieQiSolar.getYear()
    && solar.getMonth() === jieQiSolar.getMonth()
    && solar.getDay() === jieQiSolar.getDay();
  if (!sameDay) return parseGanZhi(fallback);

  const currentSeconds = solar.getHour() * 3600 + solar.getMinute() * 60 + solar.getSecond();
  const jieQiSeconds = jieQiSolar.getHour() * 3600 + jieQiSolar.getMinute() * 60 + jieQiSolar.getSecond();
  return currentSeconds < jieQiSeconds
    ? parseGanZhi(solar.next(-1).getLunar().getMonthInGanZhi())
    : parseGanZhi(fallback);
}

function pillarsAt(year: number, month: number, day: number, hour: number, minute: number, second = 0): BaziPillars {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, second);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const dayEightChar = (hour === 23 ? solar.next(1) : solar).getLunar().getEightChar();

  return {
    year: parseGanZhi(eightChar.getYear()),
    month: accurateMonthGanZhi(solar),
    day: parseGanZhi(dayEightChar.getDay()),
    hour: parseGanZhi(eightChar.getTime())
  };
}

function solarDateFor(member: Member): { year: number; month: number; day: number; text: string } {
  const exact = member.solarBirth?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (exact) {
    return { year: Number(exact[1]), month: Number(exact[2]), day: Number(exact[3]), text: `${exact[1]}-${exact[2]}-${exact[3]}` };
  }

  const birth = member.lunarBirth;
  const lunar = Lunar.fromYmd(birth.year, birth.leap ? -birth.month : birth.month, birth.day);
  const solar = lunar.getSolar();
  return {
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay(),
    text: solar.toYmd()
  };
}

export function getSolarDate(member: Member): string | undefined {
  try {
    return solarDateFor(member).text;
  } catch {
    return undefined;
  }
}

function keyOf(pillars: BaziPillars): string {
  return `${pillars.year}|${pillars.month}|${pillars.day}|${pillars.hour}`;
}

function resolvedResult(member: Member, solarDate: ReturnType<typeof solarDateFor>): BaziResult | undefined {
  const resolved = resolveBaziBirthTime(member);
  if (!resolved) return undefined;
  const [hour, minute] = resolved.birthTime.split(":").map(Number);
  const second = resolved.second;
  const pillars = pillarsAt(solarDate.year, solarDate.month, solarDate.day, hour, minute, second);
  const defaultLabel = resolved.branch ? `${resolved.branch}时内默认时刻` : "默认时刻";
  return {
    status: "ready",
    solarDate: solarDate.text,
    birthTime: resolved.birthTime,
    timeBasis: resolved.source,
    candidates: [{
      label: resolved.source === "recorded" ? `精确时刻 ${resolved.birthTime}` : `${defaultLabel} ${resolved.birthTime}`,
      pillars,
      dayMaster: pillars.day[0],
      details: detailsFor(pillars, shenShaFor(pillars, member, solarDate.text, resolved.birthTime))
    }],
    message: resolved.source === "recorded"
      ? "已按记录中的精确时刻排出四柱。"
      : `原始资料只记录${resolved.branch}时，暂按该时辰内固定生成的默认时刻 ${resolved.birthTime} 排盘；此时刻仅供估算，补录真实分钟后会自动替换。`
  };
}

export function calculateBaziFine(member: Member): BaziFineResult {
  const base: BaziFineResult = {
    status: "missing",
    message: "",
    seasonStrength: [],
    decades: []
  };

  if (!member.gender) {
    return { ...base, message: "细盘待补：需要先确认性别，才能确定大运顺逆。" };
  }

  const input = chartInputFor(member);
  if (!input) {
    return { ...base, message: "细盘待补：需要出生时辰，才能生成默认时刻并计算起运与交运日期。" };
  }

  const resolved = resolveBaziBirthTime(member);

  try {
    const chart = calculateChart(input);
    const normalized = chart.normalizedChart;
    const dayMaster = normalized.day_master;
    const monthBranch = normalized.month_pillar[1] ?? "";
    const rawDecades = Array.isArray(normalized.decade_cycles) ? normalized.decade_cycles : [];
    const decades = rawDecades.map((value) => {
      const record = isRecord(value) ? value : {};
      const ganZhi = recordText(record, "label") || "小运";
      const stars = ganZhi === "小运" ? { stemStar: "", branchStar: "" } : cycleStars(dayMaster, ganZhi);
      const rawYears = Array.isArray(record.yearly_cycles) ? record.yearly_cycles : [];
      const years = rawYears.map((yearValue) => {
        const yearRecord = isRecord(yearValue) ? yearValue : {};
        const yearGanZhi = recordText(yearRecord, "label");
        return {
          year: Number(recordText(yearRecord, "value")),
          ganZhi: yearGanZhi,
          ...cycleStars(dayMaster, yearGanZhi),
          active: yearRecord.active === true
        };
      }).filter((year) => Number.isFinite(year.year) && year.ganZhi.length >= 2);
      return {
        ganZhi,
        startYear: recordNumber(record, "start_year"),
        endYear: recordNumber(record, "end_year"),
        startAge: recordNumber(record, "start_age"),
        endAge: recordNumber(record, "end_age"),
        ...stars,
        active: record.active === true,
        years
      };
    }).filter((decade) => decade.startYear > 0 && decade.years.length > 0);
    const cycles = isRecord(chart.cycles) ? chart.cycles : {};
    const startYun = isRecord(cycles.start_yun) ? cycles.start_yun : {};
    return {
      status: "ready",
      birthTime: resolved?.birthTime,
      timeBasis: resolved?.source,
      message: resolved?.source === "default"
        ? `原始资料没有精确分钟，细盘暂按固定默认时刻 ${resolved.birthTime} 估算；大运、流年与流月由本地排盘引擎计算。`
        : member.baziFine?.source
        ? `起运与交运采用${member.baziFine.source}；大运、流年与流月由本地排盘引擎计算。`
        : "大运、流年与流月由本地排盘引擎计算；当前年份会自动高亮。",
      startYun: member.baziFine?.startYun ?? recordText(normalized, "start_yun_desc"),
      startDate: member.baziFine?.handover ?? recordText(normalized, "start_yun_date"),
      direction: startYun.forward === true ? "顺排" : "逆排",
      commandingStem: HIDDEN_STEMS[monthBranch]?.[0] ?? "待核",
      seasonStrength: seasonStrengthFor(monthBranch),
      taiYuan: recordText(normalized, "tai_yuan"),
      taiXi: recordText(normalized, "tai_xi"),
      mingGong: recordText(normalized, "ming_gong"),
      shenGong: recordText(normalized, "shen_gong"),
      decades
    };
  } catch {
    return { ...base, status: "invalid", message: "细盘计算失败，请核对性别、阳历日期与精确出生时间。" };
  }
}

export function calculateBaziMonths(member: Member, year: number): BaziMonthCycle[] {
  const input = chartInputFor(member);
  if (!input) return [];
  try {
    const current = new Date();
    const result = calculateCycles({
      ...input,
      targetYear: year,
      ...(year === current.getFullYear() ? { targetMonth: current.getMonth() + 1 } : {})
    });
    const dayMaster = calculateChart(input).normalizedChart.day_master;
    return result.monthlyCycles.map((value) => {
      const record = isRecord(value) ? value : {};
      const ganZhi = recordText(record, "label");
      const month = recordNumber(record, "month") || Number(recordText(record, "value"));
      const term = termDateFor(year, month);
      return {
        month,
        name: term.name,
        date: term.date,
        ganZhi,
        ...cycleStars(dayMaster, ganZhi),
        active: record.active === true
      };
    }).filter((month) => month.month > 0 && month.ganZhi.length >= 2);
  } catch {
    return [];
  }
}

export function calculateBazi(member: Member): BaziResult {
  try {
    const solarDate = solarDateFor(member);
    const resolved = resolvedResult(member, solarDate);
    if (resolved) return resolved;

    const branch = member.lunarBirth.time?.match(/([子丑寅卯辰巳午未申酉戌亥])时/)?.[1];
    if (!branch) {
      return {
        status: "missing",
        solarDate: solarDate.text,
        candidates: [],
        message: "缺少出生时辰，暂不能排出完整四柱。"
      };
    }

    const candidates: BaziCandidate[] = [];
    for (const [startHour, endHour, label] of TIME_WINDOWS[branch]) {
      let previousKey = "";
      let segmentStart = "";
      let previousTime = "";
      let previousPillars: BaziPillars | undefined;

      for (let hour = startHour; hour <= endHour; hour += 1) {
        for (let minute = 0; minute < 60; minute += 1) {
          const pillars = pillarsAt(solarDate.year, solarDate.month, solarDate.day, hour, minute);
          const key = keyOf(pillars);
          const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
          if (previousKey && key !== previousKey && previousPillars) {
            candidates.push({
              label: `${label.split(" ")[0]} ${segmentStart}–${previousTime}`,
              pillars: previousPillars,
              dayMaster: previousPillars.day[0],
              details: detailsFor(previousPillars, shenShaFor(previousPillars, member, solarDate.text, segmentStart))
            });
            segmentStart = time;
          }
          if (!previousKey) segmentStart = time;
          previousKey = key;
          previousTime = time;
          previousPillars = pillars;
        }
      }

      if (previousPillars) {
        candidates.push({
          label: candidates.length === 0 && startHour !== 0 && startHour !== 23 ? label : `${label.split(" ")[0]} ${segmentStart}–${previousTime}`,
          pillars: previousPillars,
          dayMaster: previousPillars.day[0],
          details: detailsFor(previousPillars, shenShaFor(previousPillars, member, solarDate.text, segmentStart))
        });
      }
    }

    const uniqueKeys = new Set(candidates.map((candidate) => keyOf(candidate.pillars)));
    const ambiguous = uniqueKeys.size > 1;
    return {
      status: ambiguous ? "ambiguous" : "ready",
      solarDate: solarDate.text,
      candidates,
      message: ambiguous
        ? "这个时辰范围会得到不同四柱，请补充准确钟点后确认。"
        : `已逐分钟核对整个${branch}时范围，四柱结果一致。`
    };
  } catch {
    return {
      status: "invalid",
      candidates: [],
      message: "当前农历日期无法可靠换算，请先核对原始生日记录。"
    };
  }
}
