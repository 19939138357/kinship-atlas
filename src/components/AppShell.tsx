import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { LogOut, Search, X } from "lucide-react";
import { formatLunarDate } from "../format";
import type { Member, SiteData, ViewName } from "../types";
import { Brand } from "./Brand";

type AppShellProps = {
  view: ViewName;
  contentKey: string;
  data: SiteData;
  query: string;
  onQueryChange: (query: string) => void;
  onSelectMember: (member: Member) => void;
  onViewChange: (view: ViewName) => void;
  onLogout: () => void;
  children: ReactNode;
};

const navItems: Array<{ view: ViewName; label: string }> = [
  { view: "home", label: "家谱" },
  { view: "people", label: "人物" },
  { view: "archive", label: "家族志" },
  { view: "bazi", label: "八字" }
];

export function AppShell({
  view,
  contentKey,
  data,
  query,
  onQueryChange,
  onSelectMember,
  onViewChange,
  onLogout,
  children
}: AppShellProps) {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [contentKey]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return data.members
      .filter((member) => [member.name, member.id, member.zodiac, member.relation]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized)))
      .slice(0, 6);
  }, [data.members, query]);

  function changeView(nextView: ViewName) {
    onQueryChange("");
    onViewChange(nextView);
  }

  function selectMember(member: Member) {
    onSelectMember(member);
    onQueryChange("");
  }

  return (
    <div className="simple-shell">
      <header className="simple-header">
        <Brand />
        <nav aria-label="主要导航">
          {navItems.map((item) => {
            const selected = view === item.view || (item.view === "home" && view === "tree");
            return (
              <button
                key={item.view}
                type="button"
                className={selected ? "simple-nav__active" : ""}
                onClick={() => changeView(item.view)}
                aria-current={selected ? "page" : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="simple-search">
          <Search size={19} strokeWidth={1.6} aria-hidden="true" />
          <input value={query} onKeyDown={(event) => { if (event.key === "Escape") onQueryChange(""); }} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索家族成员" aria-label="搜索家族成员" />
          {query && <button type="button" onClick={() => onQueryChange("")} aria-label="清除搜索"><X size={17} /></button>}
          {query && (
            <div className="simple-search__results" role="group" aria-label="搜索结果">
              {results.length > 0 ? results.map((member) => (
                <button key={member.id} type="button" onClick={() => selectMember(member)}>
                  <span>{member.name.slice(0, 1)}</span>
                  <span><strong>{member.name}</strong><small>{formatLunarDate(member.lunarBirth)}</small></span>
                </button>
              )) : <p>没有找到相关人物</p>}
            </div>
          )}
        </div>
        <button className="simple-logout" type="button" onClick={onLogout} aria-label="退出家谱" title="退出家谱"><LogOut size={20} strokeWidth={1.5} /></button>
      </header>

      <main ref={mainRef} className="simple-main">{children}</main>
    </div>
  );
}
