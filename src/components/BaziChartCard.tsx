import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { calculateBazi, calculateBaziFine, elementOf } from "../bazi";
import { formatLunarDate } from "../format";
import type { Member } from "../types";
import { BaziFineChart } from "./BaziFineChart";
import { BaziLifeReading } from "./BaziLifeReading";

type BaziChartCardProps = {
  member: Member;
  compact?: boolean;
};

const ELEMENT_CLASS = {
  木: "wood",
  火: "fire",
  土: "earth",
  金: "metal",
  水: "water"
} as const;

function elementClass(value: string): string {
  const element = elementOf(value);
  return element ? `wuxing--${ELEMENT_CLASS[element]}` : "";
}

function BirthLabel({ member, solarDate, birthTime, timeBasis }: {
  member: Member;
  solarDate?: string;
  birthTime?: string;
  timeBasis?: "recorded" | "default";
}) {
  const chartType = member.gender === "男" ? "乾造" : member.gender === "女" ? "坤造" : "";
  return (
    <div className="native-bazi__birth">
      <p><span>农历</span>{formatLunarDate(member.lunarBirth)} {member.lunarBirth.time ?? "时辰待补"}{chartType && <b>{chartType}</b>}</p>
      <p><span>阳历</span>{solarDate ?? "日期待核"}{birthTime ? ` ${birthTime}` : ""}{timeBasis === "default" && <b>默认估算</b>}</p>
    </div>
  );
}

export function BaziChartCard({ member, compact = false }: BaziChartCardProps) {
  const result = useMemo(() => calculateBazi(member), [member]);
  const fineResult = useMemo(() => calculateBaziFine(member), [member]);
  const [activeIndex, setActiveIndex] = useState(0);
  const ready = result.status === "ready";
  const candidate = result.candidates[Math.min(activeIndex, Math.max(0, result.candidates.length - 1))];

  useEffect(() => setActiveIndex(0), [member.id]);

  return (
    <section className={`native-bazi${compact ? " native-bazi--compact" : ""}`} id={compact ? "person-bazi" : undefined}>
      <header className="native-bazi__hero">
        <div>
          <p className="native-bazi__eyebrow">基本排盘</p>
          <h2>{member.name}</h2>
          <BirthLabel member={member} solarDate={result.solarDate} birthTime={result.birthTime} timeBasis={result.timeBasis} />
        </div>
        <span className={`native-bazi__state native-bazi__state--${result.status}`}>
          {ready ? <CheckCircle2 size={17} /> : result.status === "ambiguous" ? <Clock3 size={17} /> : <AlertTriangle size={17} />}
          {ready ? (result.timeBasis === "default" ? "默认时刻" : "已排出") : result.status === "ambiguous" ? `${result.candidates.length} 个候选` : "资料待补"}
        </span>
      </header>

      {result.candidates.length > 1 && (
        <div className="native-bazi__tabs" role="tablist" aria-label="时辰候选">
          {result.candidates.map((item, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              className={activeIndex === index ? "is-active" : ""}
              key={item.label}
              onClick={() => setActiveIndex(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {candidate && (
        <div className="native-bazi__chart">
          <p className="native-bazi__candidate-label">{candidate.label}</p>
          <div className="bazi-detail-table" role="table" aria-label={`${member.name}的四柱命盘`}>
            <div className="bazi-detail-row bazi-detail-row--head" role="row">
              <span role="columnheader">日期</span>
              {candidate.details.map((pillar) => <strong role="columnheader" key={pillar.key}>{pillar.label}</strong>)}
            </div>
            <div className="bazi-detail-row" role="row">
              <span role="rowheader">主星</span>
              {candidate.details.map((pillar) => <div key={pillar.key}>{pillar.mainStar}</div>)}
            </div>
            <div className="bazi-detail-row bazi-detail-row--stem" role="row">
              <span role="rowheader">天干</span>
              {candidate.details.map((pillar) => <div className={elementClass(pillar.stem)} key={pillar.key}>{pillar.stem}</div>)}
            </div>
            <div className="bazi-detail-row bazi-detail-row--branch" role="row">
              <span role="rowheader">地支</span>
              {candidate.details.map((pillar) => <div className={elementClass(pillar.branch)} key={pillar.key}>{pillar.branch}</div>)}
            </div>
            <div className="bazi-detail-row bazi-detail-row--stack" role="row">
              <span role="rowheader">藏干</span>
              {candidate.details.map((pillar) => (
                <div key={pillar.key}>{pillar.hiddenStems.map((stem) => <b className={elementClass(stem)} key={stem}>{stem}</b>)}</div>
              ))}
            </div>
            <div className="bazi-detail-row bazi-detail-row--stack" role="row">
              <span role="rowheader">副星</span>
              {candidate.details.map((pillar) => <div key={pillar.key}>{pillar.secondaryStars.map((star) => <b key={star}>{star}</b>)}</div>)}
            </div>
            <div className="bazi-detail-row" role="row">
              <span role="rowheader">星运</span>
              {candidate.details.map((pillar) => <div key={pillar.key}>{pillar.stage}</div>)}
            </div>
            <div className="bazi-detail-row" role="row">
              <span role="rowheader">自坐</span>
              {candidate.details.map((pillar) => <div key={pillar.key}>{pillar.selfStage}</div>)}
            </div>
            <div className="bazi-detail-row" role="row">
              <span role="rowheader">空亡</span>
              {candidate.details.map((pillar) => <div key={pillar.key}>{pillar.void}</div>)}
            </div>
            <div className="bazi-detail-row bazi-detail-row--nayin" role="row">
              <span role="rowheader">纳音</span>
              {candidate.details.map((pillar) => <div key={pillar.key}>{pillar.naYin}</div>)}
            </div>
            <div className="bazi-detail-row bazi-detail-row--stack bazi-detail-row--shensha" role="row">
              <span role="rowheader">神煞</span>
              {candidate.details.map((pillar) => (
                <div key={pillar.key}>
                  {pillar.shenSha.length > 0
                    ? pillar.shenSha.map((name) => <b key={name}>{name}</b>)
                    : <b>—</b>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className={`native-bazi__message${result.status === "ambiguous" || result.timeBasis === "default" ? " native-bazi__message--warn" : ""}`}>{result.message}</p>
      <BaziFineChart member={member} result={fineResult} />
      <BaziLifeReading member={member} candidate={candidate} fineResult={fineResult} />
      <p className="native-bazi__method">四柱按北京时间与传统晚子时换日法计算，出生地暂不作真太阳时校正。神煞采用常用子平规则排出，不同流派结果可能略有差异。</p>
    </section>
  );
}
