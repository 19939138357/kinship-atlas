export type LunarBirth = {
  year: number;
  month: number;
  day: number;
  leap?: boolean;
  time?: string;
};

export type Member = {
  id: string;
  name: string;
  relation?: string;
  gender?: "男" | "女";
  zodiac?: string;
  birthPlace?: string;
  fatherId?: string;
  motherId?: string;
  spouseIds?: string[];
  childIds?: string[];
  generationName?: string;
  lunarBirth: LunarBirth;
  solarBirth?: string;
  baziFine?: {
    startYun?: string;
    handover?: string;
    source?: string;
  };
  death?: {
    value: string;
    calendar: string;
    time?: string;
  };
  note?: string;
};

export type SiteData = {
  meta: {
    title: string;
    updatedAt: string;
    memberCount: number;
    relationshipsComplete: boolean;
  };
  members: Member[];
  sources: Array<{
    title: string;
    date: string;
    description: string;
  }>;
};

export type ViewName =
  | "home"
  | "tree"
  | "people"
  | "archive"
  | "bazi";
