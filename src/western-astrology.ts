import { SunPosition } from "astronomy-engine";
import { resolveBaziBirthTime } from "./bazi";
import type { Member } from "./types";

export type WesternAstrologyProfile = {
  sign: string;
  symbol: string;
  element: string;
  modality: string;
  personality: string;
  solarLongitude: number;
  currentSunSign: string;
  monthLabel: string;
  monthTheme: string;
  workAdvice: string;
  relationshipAdvice: string;
  hobbyAdvice: string;
  caveat: string;
};

const SIGNS = [
  { name: "白羊座", symbol: "♈", element: "火象", modality: "开创", personality: "行动直接、喜欢快速开始，也需要练习耐心与收尾" },
  { name: "金牛座", symbol: "♉", element: "土象", modality: "固定", personality: "重视稳定、品质与长期积累，不喜欢被频繁催促改变节奏" },
  { name: "双子座", symbol: "♊", element: "风象", modality: "变动", personality: "好奇、反应快、喜欢交流新信息，需要避免兴趣过度分散" },
  { name: "巨蟹座", symbol: "♋", element: "水象", modality: "开创", personality: "重视归属感与照顾关系，对环境氛围较敏感" },
  { name: "狮子座", symbol: "♌", element: "火象", modality: "固定", personality: "重视表达、认可与创造舞台，也适合练习倾听和共享成果" },
  { name: "处女座", symbol: "♍", element: "土象", modality: "变动", personality: "善于观察细节、改进流程与解决具体问题，需要减少过度挑剔" },
  { name: "天秤座", symbol: "♎", element: "风象", modality: "开创", personality: "重视公平、合作与审美，会花时间权衡不同选择" },
  { name: "天蝎座", symbol: "♏", element: "水象", modality: "固定", personality: "专注、有洞察力、重视信任，对真正关心的事投入较深" },
  { name: "射手座", symbol: "♐", element: "火象", modality: "变动", personality: "喜欢探索、学习与更大的活动空间，需要把远景落成步骤" },
  { name: "摩羯座", symbol: "♑", element: "土象", modality: "开创", personality: "重视责任、结构和长期成果，压力大时容易忽略休息" },
  { name: "水瓶座", symbol: "♒", element: "风象", modality: "固定", personality: "看重独立思考、新方法和群体价值，不喜欢被刻板定义" },
  { name: "双鱼座", symbol: "♓", element: "水象", modality: "变动", personality: "感受细腻、想象力丰富，适合用清晰边界保护精力" }
] as const;

const TRANSIT_THEMES = {
  renewal: {
    theme: "自我更新",
    work: "适合梳理个人目标，主动提出一个真正想推进的项目。",
    relationship: "表达自己的需要，同时给对方明确回应。",
    hobby: "重启一个搁置已久、但仍然有兴趣的爱好。"
  },
  growth: {
    theme: "扩展与尝试",
    work: "适合学习新工具、认识新伙伴或尝试跨部门协作。",
    relationship: "多安排共同体验，新的话题会增加连接感。",
    hobby: "选择课程、旅行、舞蹈或创作等能带来新鲜感的项目。"
  },
  adjustment: {
    theme: "调整与取舍",
    work: "先处理优先级冲突，少同时开启过多任务。",
    relationship: "意见不同时先确认事实和边界，再讨论谁来配合。",
    hobby: "适合规律运动、整理空间或完成半成品。"
  },
  cooperation: {
    theme: "合作与平衡",
    work: "重要决定适合多听一位可靠伙伴的意见。",
    relationship: "把不同需求说具体，避免用猜测代替沟通。",
    hobby: "适合双人运动、社群活动或与朋友共同学习。"
  },
  connection: {
    theme: "连接与表达",
    work: "适合汇报成果、维护关系和寻找互补资源。",
    relationship: "轻松交流比反复试探更有效。",
    hobby: "适合摄影、写作、音乐或短途出行。"
  },
  steady: {
    theme: "稳步积累",
    work: "保持原有节奏，先把一个可验证成果做扎实。",
    relationship: "用稳定行动表达在意，不急于给关系下结论。",
    hobby: "适合阅读、健身或持续练习一项基础技能。"
  }
} as const;

function signIndex(longitude: number): number {
  return Math.floor(((longitude % 360) + 360) % 360 / 30);
}

function themeForDistance(distance: number): keyof typeof TRANSIT_THEMES {
  if (distance === 0) return "renewal";
  if (distance === 4 || distance === 8) return "growth";
  if (distance === 3 || distance === 9) return "adjustment";
  if (distance === 6) return "cooperation";
  if (distance === 2 || distance === 10) return "connection";
  return "steady";
}

function chinaTimeToUtc(date: string, time: string, second: number): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second));
}

export function getWesternAstrologyProfile(member: Member, now = new Date()): WesternAstrologyProfile | undefined {
  const birth = resolveBaziBirthTime(member);
  if (!birth) return undefined;

  try {
    const birthLongitude = SunPosition(chinaTimeToUtc(birth.birthDate, birth.birthTime, birth.second)).elon;
    const natalIndex = signIndex(birthLongitude);
    const currentLongitude = SunPosition(now).elon;
    const currentIndex = signIndex(currentLongitude);
    const distance = (currentIndex - natalIndex + 12) % 12;
    const theme = TRANSIT_THEMES[themeForDistance(distance)];
    const sign = SIGNS[natalIndex];
    const currentSign = SIGNS[currentIndex];
    return {
      sign: sign.name,
      symbol: sign.symbol,
      element: sign.element,
      modality: sign.modality,
      personality: sign.personality,
      solarLongitude: Number(birthLongitude.toFixed(2)),
      currentSunSign: currentSign.name,
      monthLabel: `${now.getFullYear()}年${now.getMonth() + 1}月`,
      monthTheme: theme.theme,
      workAdvice: theme.work,
      relationshipAdvice: theme.relationship,
      hobbyAdvice: theme.hobby,
      caveat: "仅按太阳黄经计算太阳星座与当月太阳位置；未计算月亮、上升、宫位及其他行星过境。"
    };
  } catch {
    return undefined;
  }
}
