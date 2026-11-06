import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarRange } from "lucide-react";
import {
  calculateBaziMonths,
  elementOf,
  type BaziDecadeCycle,
  type BaziFineResult
} from "../bazi";
import type { Member } from "../types";

type BaziFineChartProps = {
  member: Member;
  result: BaziFineResult;
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

function firstDecadeIndex(decades: BaziDecadeCycle[]): number {
  const currentYear = new Date().getFullYear();
  const active = decades.findIndex((item) => item.active || (currentYear >= item.startYear && currentYear <= item.endYear));
  return active >= 0 ? active : 0;
}

function GanZhiCell({ ganZhi, stemStar, branchStar }: { ganZhi: string; stemStar: string; branchStar: string }) {
  if (ganZhi === "小运") return <div className="fine-gan-zhi fine-gan-zhi--small"><strong>小运</strong></div>;
  return (
    <div className="fine-gan-zhi">
      <div><strong className={elementClass(ganZhi[0])}>{ganZhi[0]}</strong><small>{stemStar || "—"}</small></div>
      <div><strong className={elementClass(ganZhi[1])}>{ganZhi[1]}</strong><small>{branchStar || "—"}</small></div>
    </div>
  );
}

export function BaziFineChart({ member, result }: BaziFineChartProps) {
  const [decadeIndex, setDecadeIndex] = useState(() => firstDecadeIndex(result.decades));
  const selectedDecade = result.decades[Math.min(decadeIndex, Math.max(0, result.decades.length - 1))];
  const currentYear = new Date().getFullYear();
  const defaultYear = selectedDecade?.years.find((item) => item.active || item.year === currentYear)?.year
    ?? selectedDecade?.years[0]?.year
    ?? currentYear;
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  useEffect(() => {
    const nextIndex = firstDecadeIndex(result.decades);
    setDecadeIndex(nextIndex);
    const decade = result.decades[nextIndex];
    setSelectedYear(decade?.years.find((item) => item.active || item.year === currentYear)?.year ?? decade?.years[0]?.year ?? currentYear);
  }, [member.id, result.decades, currentYear]);

  useEffect(() => {
    if (!selectedDecade) return;
    const nextYear = selectedDecade.years.find((item) => item.active || item.year === currentYear)?.year ?? selectedDecade.years[0]?.year;
    if (nextYear) setSelectedYear(nextYear);
  }, [decadeIndex, selectedDecade, currentYear]);

  const months = useMemo(
    () => result.status === "ready" ? calculateBaziMonths(member, selectedYear) : [],
    [member, result.status, selectedYear]
  );

  if (result.status !== "ready") {
    return (
      <section className="bazi-fine bazi-fine--missing" aria-label="专业细盘">
        <div>
          <AlertTriangle size={19} />
          <p><strong>专业细盘待补充</strong><span>{result.message}</span></p>
        </div>
      </section>
    );
  }

  return (
    <section className="bazi-fine" aria-label={`${member.name}的专业细盘`}>
      <header className="bazi-fine__heading">
        <div>
          <p>专业细盘</p>
          <h3>大运 · 流年 · 流月</h3>
        </div>
        <CalendarRange size={24} aria-hidden="true" />
      </header>

      <div className="bazi-fine__facts">
        <p><span>起运</span><strong>{result.startYun}</strong></p>
        <p><span>交运</span><strong>{result.startDate}</strong></p>
        <p><span>排法</span><strong>{result.direction}</strong></p>
        <p><span>司令</span><strong>{result.commandingStem}</strong></p>
      </div>

      <div className="bazi-cycle-section">
        <div className="bazi-cycle-section__label"><span>大运</span><small>点击切换</small></div>
        <div className="bazi-cycle-scroll" role="tablist" aria-label="大运">
          {result.decades.map((decade, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={decadeIndex === index}
              className={`bazi-cycle-card${decadeIndex === index ? " is-active" : ""}`}
              key={`${decade.startYear}-${decade.ganZhi}`}
              onClick={() => setDecadeIndex(index)}
            >
              <span>{decade.startYear}</span>
              <small>{decade.startAge}–{decade.endAge}岁</small>
              <GanZhiCell ganZhi={decade.ganZhi} stemStar={decade.stemStar} branchStar={decade.branchStar} />
            </button>
          ))}
        </div>
      </div>

      {selectedDecade && (
        <div className="bazi-cycle-section">
          <div className="bazi-cycle-section__label"><span>流年</span><small>{selectedDecade.startYear}–{selectedDecade.endYear}</small></div>
          <div className="bazi-cycle-scroll" role="tablist" aria-label="流年">
            {selectedDecade.years.map((year) => (
              <button
                type="button"
                role="tab"
                aria-selected={selectedYear === year.year}
                className={`bazi-cycle-card${selectedYear === year.year ? " is-active" : ""}${year.active ? " is-current" : ""}`}
                key={year.year}
                onClick={() => setSelectedYear(year.year)}
              >
                <span>{year.year}</span>
                <GanZhiCell ganZhi={year.ganZhi} stemStar={year.stemStar} branchStar={year.branchStar} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bazi-cycle-section">
        <div className="bazi-cycle-section__label"><span>流月</span><small>{selectedYear}年</small></div>
        <div className="bazi-cycle-scroll" role="list" aria-label={`${selectedYear}年流月`}>
          {months.map((month) => (
            <div className={`bazi-cycle-card bazi-cycle-card--month${month.active ? " is-current" : ""}`} role="listitem" key={month.month}>
              <span>{month.name}</span>
              <small>{month.date}</small>
              <GanZhiCell ganZhi={month.ganZhi} stemStar={month.stemStar} branchStar={month.branchStar} />
            </div>
          ))}
        </div>
      </div>

      <div className="bazi-season-strip" aria-label="五行旺衰">
        {result.seasonStrength.map((item) => (
          <span className={elementClass(item.element)} key={item.element}>{item.element}<b>{item.state}</b></span>
        ))}
      </div>

      <div className="bazi-fine__palaces">
        <p><span>胎元</span><strong>{result.taiYuan}</strong></p>
        <p><span>胎息</span><strong>{result.taiXi}</strong></p>
        <p><span>命宫</span><strong>{result.mingGong}</strong></p>
        <p><span>身宫</span><strong>{result.shenGong}</strong></p>
      </div>

      <p className="bazi-fine__note">{result.message} 不同排法的起运日期可能有差异。</p>
    </section>
  );
}
