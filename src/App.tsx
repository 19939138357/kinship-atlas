import { lazy, Suspense, useEffect, useState } from "react";
import { fetchSession, fetchSiteData, login, logout } from "./api";
import { AppShell } from "./components/AppShell";
import { LoginScreen } from "./components/LoginScreen";
import { FamilyTree } from "./features/FamilyTree";
import { FamilyArchive } from "./features/FamilyArchive";
import { Home } from "./features/Home";
import { People } from "./features/People";
import { PersonRecord } from "./features/PersonRecord";
import type { Member, SiteData, ViewName } from "./types";

const Bazi = lazy(() => import("./features/Bazi"));

type AuthState = "checking" | "guest" | "member" | "error";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [message, setMessage] = useState("");
  const [logoutPending, setLogoutPending] = useState(false);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<SiteData | null>(null);
  const [view, setView] = useState<ViewName>("home");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [baziMemberId, setBaziMemberId] = useState("");
  const [treeMemberId, setTreeMemberId] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const authenticated = await fetchSession();
        if (!active) return;
        if (!authenticated) {
          setAuthState("guest");
          return;
        }
        const siteData = await fetchSiteData();
        if (!active) return;
        setData(siteData);
        setAuthState("member");
      } catch {
        if (active) {
          setMessage("暂时无法读取家谱，请检查连接后重试。");
          setAuthState("error");
        }
      }
    }
    initialize();
    return () => { active = false; };
  }, [retry]);

  async function handleLogin(password: string) {
    await login(password);
    const siteData = await fetchSiteData();
    setData(siteData);
    setAuthState("member");
  }

  async function handleLogout() {
    setData(null);
    setSelectedMember(null);
    setGlobalQuery("");
    setTreeMemberId("");
    setBaziMemberId("");
    setView("home");
    setAuthState("checking");
    try {
      await logout();
      setLogoutPending(false);
      setAuthState("guest");
    } catch {
      setLogoutPending(true);
      setMessage("当前页面已关闭，退出请求尚未送达。请恢复连接后重试。");
      setAuthState("error");
    }
  }

  function handleViewChange(nextView: ViewName) {
    setSelectedMember(null);
    if (nextView === "tree") setTreeMemberId("");
    setView(nextView);
  }

  function handleSelectMember(member: Member) {
    setSelectedMember(member);
    setView("people");
  }

  function showSelectedInTree() {
    setTreeMemberId(selectedMember?.id ?? "");
    setSelectedMember(null);
    setView("tree");
  }

  function openMemberBazi(member: Member) {
    setBaziMemberId(member.id);
    setSelectedMember(null);
    setView("bazi");
  }

  if (authState === "checking") {
    return <main className="loading-screen"><span>谱</span><p>正在启卷…</p></main>;
  }

  if (authState === "error") {
    return <main className="loading-screen"><p role="alert">{message}</p>
      <button className="simple-primary retry-button" onClick={() => {
        if (logoutPending) { void handleLogout(); return; }
        setAuthState("checking");
        setRetry((attempt) => attempt + 1);
      }}>重试</button>
    </main>;
  }

  if (authState === "guest" || !data) return <LoginScreen onLogin={handleLogin} />;

  return (
    <AppShell
      view={view}
      contentKey={`${view}:${selectedMember?.id ?? "index"}`}
      data={data}
      query={globalQuery}
      onQueryChange={setGlobalQuery}
      onSelectMember={handleSelectMember}
      onViewChange={handleViewChange}
      onLogout={handleLogout}
    >
      {view === "home" && <Home data={data} onNavigate={handleViewChange} onSelectMember={handleSelectMember} />}
      {view === "tree" && <FamilyTree focusId={treeMemberId} onFocus={setTreeMemberId} members={data.members} onOpenPerson={handleSelectMember} onOpenPeople={() => handleViewChange("people")} />}
      {view === "people" && selectedMember && <PersonRecord member={selectedMember} members={data.members} onBack={() => setSelectedMember(null)} onShowTree={showSelectedInTree} onOpenBazi={() => openMemberBazi(selectedMember)} onOpenPerson={handleSelectMember} />}
      {view === "people" && !selectedMember && <People members={data.members} onSelect={handleSelectMember} />}
      {view === "archive" && <FamilyArchive sources={data.sources} members={data.members} onSelectMember={handleSelectMember} />}
      {view === "bazi" && <Suspense fallback={<p className="record-empty-inline">正在载入排盘…</p>}><Bazi members={data.members} selectedId={baziMemberId} onSelectedChange={setBaziMemberId} /></Suspense>}
    </AppShell>
  );
}
