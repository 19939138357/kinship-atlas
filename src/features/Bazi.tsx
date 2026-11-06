import { BaziChartCard } from "../components/BaziChartCard";
import type { Member } from "../types";

type Props = {
  members: Member[];
  selectedId: string;
  onSelectedChange: (id: string) => void;
};

export default function Bazi({ members, selectedId, onSelectedChange }: Props) {
  const member = members.find((person) => person.id === selectedId) ?? members[0];
  return (
    <div className="bazi-page">
      <header className="simple-page-heading">
        <h1>八字排盘</h1><p>按档案中的生辰在本机推算，供传统历法研究。</p>
      </header>
      {member ? <>
        <label className="tree-picker">当前人物
          <select value={member.id} onChange={(e) => onSelectedChange(e.target.value)}>
            {members.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.id}</option>)}
          </select>
        </label>
        <BaziChartCard key={member.id} member={member}/>
      </> : <p className="record-empty-inline">暂无可选人物。</p>}
    </div>
  );
}
