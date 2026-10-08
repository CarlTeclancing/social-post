import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./lib/api";
import { Send, Calendar, RefreshCw, Plus, LogOut } from "lucide-react";
import "./style.css";
const platforms = ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "TIKTOK"];
function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [accounts, setAccounts] = useState([]),
    [posts, setPosts] = useState([]),
    [content, setContent] = useState(""),
    [selected, setSelected] = useState([]),
    [schedule, setSchedule] = useState(""),
    [mediaUrl, setMediaUrl] = useState(""),
    [mediaType, setMediaType] = useState("image/jpeg"),
    [mediaFile, setMediaFile] = useState(null),
    [isUploading, setIsUploading] = useState(false),
    [tab, setTab] = useState("compose"),
    [err, setErr] = useState("");
  const load = async () => {
    setAccounts(await api("/social"));
    setPosts(await api("/posts"));
  };
  useEffect(() => {
    if (token) load().catch((e) => setErr(e.message));
  }, [token]);
  if (!token)
    return (
      <Auth
        onToken={(t) => {
          localStorage.setItem("token", t);
          setToken(t);
        }}
      />
    );
  async function submit() {
    setErr("");
    try {
      await api("/posts", {
        method: "POST",
        body: JSON.stringify({
          content,
          scheduledAt: schedule || null,
          accountIds: selected,
          media: mediaUrl ? [{ url: mediaUrl, type: mediaType }] : [],
        }),
      });
      setContent("");
      setSchedule("");
      setMediaUrl("");
      setMediaType("image/jpeg");
      setMediaFile(null);
      setTimeout(load, 1200);
      setTab("history");
    } catch (e) {
      setErr(e.message);
    }
  }
  async function uploadMedia(file) {
    if (!file) return;
    setErr("");
    setIsUploading(true);
    try {
      const result = await api("/media", {
        method: "POST",
        body: (() => {
          const form = new FormData();
          form.append("file", file);
          return form;
        })(),
      });
      setMediaUrl(result.url);
      setMediaType(result.type);
      setMediaFile(file);
    } catch (e) {
      setErr(e.message);
      setMediaUrl("");
      setMediaType("image/jpeg");
      setMediaFile(null);
    } finally {
      setIsUploading(false);
    }
  }
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          OnePost<span>.</span>
        </div>
        <button
          className={tab === "compose" ? "active" : ""}
          onClick={() => setTab("compose")}
        >
          <Plus />
          Create post
        </button>
        <button
          className={tab === "history" ? "active" : ""}
          onClick={() => {
            setTab("history");
            load();
          }}
        >
          <Calendar />
          Publishing
        </button>
        <button
          className={tab === "accounts" ? "active" : ""}
          onClick={() => setTab("accounts")}
        >
          <Send />
          Accounts
        </button>
        <div className="spacer" />
        <button
          onClick={() => {
            localStorage.clear();
            setToken(null);
          }}
        >
          <LogOut />
          Logout
        </button>
      </aside>
      <main>
        {err && <div className="error">{err}</div>}
        {tab === "compose" && (
          <>
            <header>
              <h1>Create post</h1>
              <p>Publish once. Reach every channel.</p>
            </header>
            <section className="card composer">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to share?"
              />
              <div className="field media-field">
                <label>
                  Image or video <small>(max 50 MB)</small>
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => uploadMedia(e.target.files?.[0])}
                />
                {mediaFile && (
                  <p className="media-preview">
                    {mediaFile.name} ({mediaType.startsWith("video/") ? "Video" : "Image"})
                  </p>
                )}
                {isUploading && <p className="muted">Uploading to Cloudflare...</p>}
              </div>
              <h3>Publish to</h3>
              <div className="channels">
                {accounts.map((a) => (
                  <label
                    className={
                      selected.includes(a.id) ? "channel chosen" : "channel"
                    }
                    key={a.id}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(a.id)}
                      onChange={() =>
                        setSelected((s) =>
                          s.includes(a.id)
                            ? s.filter((x) => x !== a.id)
                            : [...s, a.id],
                        )
                      }
                    />
                    <b>{a.platform}</b>
                    <span>{a.displayName || a.platformAccountId}</span>
                  </label>
                ))}
              </div>
              {!accounts.length && (
                <p className="muted">Connect an account first.</p>
              )}
              <div className="actions">
                <input
                  type="datetime-local"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                />
                <button
                  className="primary"
                  onClick={submit}
                  disabled={!content || !selected.length}
                >
                  {schedule ? <Calendar /> : <Send />}
                  {schedule ? "Schedule" : "Post now"}
                </button>
              </div>
            </section>
          </>
        )}
        {tab === "accounts" && <Accounts accounts={accounts} reload={load} />}{" "}
        {tab === "history" && (
          <>
            <header>
              <h1>Publishing</h1>
              <p>Scheduled, successful and failed publications.</p>
            </header>
            <div className="grid">
              {posts.map((p) => (
                <section className="card post" key={p.id}>
                  <div className="row">
                    <span className={"badge " + p.status.toLowerCase()}>
                      {p.status}
                    </span>
                    <small>{new Date(p.createdAt).toLocaleString()}</small>
                  </div>
                  <p>{p.content}</p>
                  {p.destinations.map((d) => (
                    <div className="destination" key={d.id}>
                      <b>{d.platform}</b>
                      <span>{d.status}</span>
                      {d.errorMessage && (
                        <small>{d.errorMessage.slice(0, 120)}</small>
                      )}
                    </div>
                  ))}
                  {p.status.includes("FAILED") && (
                    <button
                      onClick={async () => {
                        await api(`/posts/${p.id}/retry`, { method: "POST" });
                        setTimeout(load, 1000);
                      }}
                    >
                      <RefreshCw />
                      Retry failed
                    </button>
                  )}
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
function Auth({ onToken }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [mode, setMode] = useState("login"),
    [err, setErr] = useState("");
  async function go() {
    try {
      const d = await api("/auth/" + mode, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onToken(d.token);
    } catch (e) {
      setErr(e.message);
    }
  }
  return (
    <div className="auth">
      <div className="authbox">
        <div className="brand">
          OnePost<span>.</span>
        </div>
        <h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
        {err && <div className="error">{err}</div>}
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="primary" onClick={go}>
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button
          className="link"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Create an account" : "Already have an account?"}
        </button>
      </div>
    </div>
  );
}
function Accounts({ accounts, reload }) {
  const [f, setF] = useState({
    platform: "FACEBOOK",
    platformAccountId: "",
    displayName: "",
    accessToken: "",
    refreshToken: "",
  });
  async function add() {
    await api("/social/manual", { method: "POST", body: JSON.stringify(f) });
    setF({
      ...f,
      platformAccountId: "",
      displayName: "",
      accessToken: "",
      refreshToken: "",
    });
    reload();
  }
  return (
    <>
      <header>
        <h1>Social accounts</h1>
        <p>
          Add credentials/tokens from your developer apps. OAuth adapters can
          replace this manual MVP connection form.
        </p>
      </header>
      <section className="card">
        <div className="formgrid">
          <select
            value={f.platform}
            onChange={(e) => setF({ ...f, platform: e.target.value })}
          >
            {platforms.map((p) => (
              <option>{p}</option>
            ))}
          </select>
          <input
            placeholder="Account/Page ID or LinkedIn URN"
            value={f.platformAccountId}
            onChange={(e) => setF({ ...f, platformAccountId: e.target.value })}
          />
          <input
            placeholder="Display name"
            value={f.displayName}
            onChange={(e) => setF({ ...f, displayName: e.target.value })}
          />
          <input
            placeholder="Access token"
            value={f.accessToken}
            onChange={(e) => setF({ ...f, accessToken: e.target.value })}
          />
          <button className="primary" onClick={add}>
            Connect account
          </button>
        </div>
      </section>
      <div className="grid">
        {accounts.map((a) => (
          <section className="card account">
            <b>{a.platform}</b>
            <h3>{a.displayName || a.platformAccountId}</h3>
            <span className="connected">● Connected</span>
          </section>
        ))}
      </div>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
