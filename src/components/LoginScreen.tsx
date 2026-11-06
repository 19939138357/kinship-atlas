import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Brand } from "./Brand";

type LoginScreenProps = {
  onLogin: (password: string) => Promise<void>;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onLogin(password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="simple-login">
      <header className="simple-login__header"><Brand /></header>
      <div className="login-spread">
      <div className="album-cover" aria-hidden="true"><div className="album-twine" /><div className="album-label">族譜</div></div>
      <section className="simple-login__form" aria-labelledby="login-title">
        <h1 id="login-title">打开家谱</h1>
        <p>输入共享密码，查阅人物与世系。</p>
        <i aria-hidden="true" />
        <form onSubmit={handleSubmit}>
          <label htmlFor="password">访问密码</label>
          <div className={`simple-password ${error ? "simple-password--error" : ""}`}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入访问密码"
              autoComplete="current-password"
              autoFocus
              disabled={submitting}
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "隐藏密码" : "显示密码"}>
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          <p className="simple-login__error" aria-live="polite">{error}</p>
          <button className="simple-primary" type="submit" disabled={!password || submitting}>
            {submitting ? "正在验证…" : "进入家谱"}
          </button>
        </form>
      </section>
      </div>
      <footer>Kinship Atlas</footer>
    </main>
  );
}
