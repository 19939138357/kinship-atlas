import { BookOpen, BrainCircuit, BriefcaseBusiness, Compass, HeartHandshake, MapPinned, Palette, ScrollText, ShieldCheck, Sparkles, Sprout, WalletCards } from "lucide-react";
import { buildBaziLifeReading, type PracticalAdviceId, type ReadingThemeId } from "../bazi-reading";
import type { BaziCandidate, BaziFineResult } from "../bazi";
import type { Member } from "../types";

type BaziLifeReadingProps = {
  member: Member;
  candidate?: BaziCandidate;
  fineResult: BaziFineResult;
};

const THEME_ICONS = {
  personality: Compass,
  learning: BookOpen,
  career: BriefcaseBusiness,
  wealth: WalletCards,
  relationship: HeartHandshake,
  wellbeing: Sprout
} satisfies Record<ReadingThemeId, typeof Compass>;

const PRACTICAL_ICONS = {
  location: MapPinned,
  career: BriefcaseBusiness,
  hobbies: Palette,
  partner: HeartHandshake
} satisfies Record<PracticalAdviceId, typeof Compass>;

export function BaziLifeReading({ member, candidate, fineResult }: BaziLifeReadingProps) {
  const reading = candidate ? buildBaziLifeReading(member, candidate, fineResult) : undefined;

  if (!reading) {
    return (
      <section className="bazi-life bazi-life--missing" aria-label="人生解读">
        <div>
          <ScrollText size={22} />
          <p><strong>人生解读待补充</strong><span>{fineResult.message || "需要完整四柱、性别与准确到分钟的出生时刻。"}</span></p>
        </div>
      </section>
    );
  }

  return (
    <section className="bazi-life" aria-label={`${member.name}的人生解读`}>
      <header className="bazi-life__heading">
        <div>
          <p>命盘小传</p>
          <h3>{member.name}的人生解读</h3>
        </div>
        <span><ShieldCheck size={17} />{fineResult.timeBasis === "default" ? `按默认时刻 ${fineResult.birthTime} 估算` : "资料完整 · 依据已确认排盘"}</span>
      </header>

      <div className="bazi-life__overview">
        <span className="bazi-life__seal" aria-hidden="true">命</span>
        <div>
          <h4>{reading.headline}</h4>
          <p>{reading.overview}</p>
          <div className="bazi-life__evidence" aria-label="总论依据">
            {reading.evidence.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
      </div>

      <div className="bazi-life__themes">
        {reading.themes.map((theme) => {
          const Icon = THEME_ICONS[theme.id];
          return (
            <article key={theme.id}>
              <header><Icon size={19} /><h4>{theme.title}</h4></header>
              <p>{theme.summary}</p>
              <strong>建议</strong>
              <p>{theme.advice}</p>
              <div className="bazi-life__evidence">{theme.evidence.map((item) => <span key={item}>{item}</span>)}</div>
            </article>
          );
        })}
      </div>

      <section className="bazi-life__stages">
        <header>
          <div><p>人生阶段</p><h4>每十年看一个主题</h4></div>
          <span>横向滑动查看全部大运</span>
        </header>
        <div className="bazi-life__stage-scroll">
          {reading.stages.map((stage) => (
            <article className={stage.active ? "is-current" : ""} key={stage.key}>
              <div><time>{stage.yearRange}</time>{stage.active && <span>当前</span>}</div>
              <small>{stage.ageRange}</small>
              <b>{stage.ganZhi}</b>
              <h5>{stage.title}</h5>
              <p>{stage.summary}</p>
              <strong>{stage.advice}</strong>
            </article>
          ))}
        </div>
      </section>

      {reading.years.length > 0 && (
        <section className="bazi-life__years">
          <header><p>近三年</p><h4>把流年当成行动提醒</h4></header>
          <div>
            {reading.years.map((year) => (
              <article className={year.current ? "is-current" : ""} key={year.year}>
                <time>{year.year}</time><span>{year.ganZhi}</span><h5>{year.title}</h5><p>{year.summary}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="bazi-life__practical">
        <header>
          <div><p>生活建议</p><h4>把命盘线索落到现实选择</h4></div>
          <span>先看现实条件，再作个人决定</span>
        </header>
        <div className="bazi-life__practical-grid">
          {reading.practicalAdvice.map((advice) => {
            const Icon = PRACTICAL_ICONS[advice.id];
            return (
              <article key={advice.id}>
                <header><Icon size={20} /><h5>{advice.title}</h5></header>
                <p>{advice.summary}</p>
                <ul>{advice.suggestions.map((item) => <li key={item}>{item}</li>)}</ul>
                <div className="bazi-life__evidence">{advice.evidence.map((item) => <span key={item}>{item}</span>)}</div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bazi-life__identity">
        <header>
          <div><p>性格参考</p><h4>MBTI 猜测与太阳星座</h4></div>
          <span>娱乐参考，不替代正式测评</span>
        </header>
        <div className="bazi-life__identity-grid">
          <article className="bazi-life__mbti">
            <header><BrainCircuit size={21} /><div><small>命盘主题推测</small><h5>{reading.mbti.type}</h5></div></header>
            <p>{reading.mbti.summary}</p>
            <div className="bazi-life__axis-list">{reading.mbti.axes.map((axis) => <span key={axis}>{axis}</span>)}</div>
            <div className="bazi-life__evidence">{reading.mbti.evidence.map((item) => <span key={item}>{item}</span>)}</div>
          </article>

          {reading.astrology ? (
            <article className="bazi-life__astrology">
              <header><span aria-hidden="true">{reading.astrology.symbol}</span><div><small>太阳星座</small><h5>{reading.astrology.sign}</h5></div></header>
              <p>{reading.astrology.personality}</p>
              <div className="bazi-life__horoscope">
                <strong><Sparkles size={15} />{reading.astrology.monthLabel} · {reading.astrology.monthTheme}</strong>
                <p><b>工作</b>{reading.astrology.workAdvice}</p>
                <p><b>关系</b>{reading.astrology.relationshipAdvice}</p>
                <p><b>兴趣</b>{reading.astrology.hobbyAdvice}</p>
              </div>
              <div className="bazi-life__evidence">
                <span>{reading.astrology.element} · {reading.astrology.modality}</span>
                <span>本月太阳位于{reading.astrology.currentSunSign}</span>
                <span>太阳黄经 {reading.astrology.solarLongitude}°</span>
              </div>
              <small className="bazi-life__astrology-note">{reading.astrology.caveat}</small>
            </article>
          ) : (
            <article className="bazi-life__astrology bazi-life__astrology--missing"><p>出生日期不足，暂不能计算太阳星座。</p></article>
          )}
        </div>
      </section>

      <p className="bazi-life__disclaimer"><ShieldCheck size={15} />以上内容由已确认的四柱、十神、季节旺衰和大运流年整理，仅供传统文化研究与自我反思；不预测寿命、疾病或灾祸，也不构成医疗、投资、婚姻和法律建议。</p>
    </section>
  );
}
