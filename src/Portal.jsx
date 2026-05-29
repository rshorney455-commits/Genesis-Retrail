// ── Genesis Retail Client Portal ─────────────────────────────────────────────
// Two views: /portal (retailer login + dashboard) and /admin (Genesis Retail admin)
// Uses URL hash routing: #portal, #admin, #dashboard
// Data stored in localStorage with simple PIN authentication

import { useState, useEffect, useCallback } from "react";

// ── Palette (matches main assessor) ──────────────────────────────────────────
const P = {
  dark:    "#0c1024",
  navy:    "#1e3a8a",
  blue:    "#2d55c8",
  gold:    "#c8a84b",
  pale:    "#dde4f5",
  card:    "#f0f2f8",
  bg:      "#f5f6fa",
  text:    "#1a2144",
  light:   "#5a6fa8",
  border:  "#c8cfe8",
  red:     "#d62828",
  amber:   "#e07020",
};

const S = {
  page: { minHeight:"100vh", background:P.bg, fontFamily:"'Segoe UI', Calibri, sans-serif" },
  card: { background:"#fff", border:`1px solid ${P.border}`, borderRadius:12, padding:24, marginBottom:16 },
  input: { width:"100%", padding:"12px 14px", border:`1.5px solid ${P.border}`, borderRadius:8,
           fontFamily:"inherit", fontSize:15, outline:"none", color:P.text, background:"#fff" },
  btn: { padding:"12px 24px", background:P.navy, border:"none", borderRadius:8, color:"#fff",
         cursor:"pointer", fontFamily:"inherit", fontSize:15, fontWeight:700 },
  btnGold: { padding:"12px 24px", background:P.gold, border:"none", borderRadius:8, color:P.dark,
             cursor:"pointer", fontFamily:"inherit", fontSize:15, fontWeight:700 },
  btnSm: { padding:"7px 14px", background:P.card, border:`1px solid ${P.border}`, borderRadius:6,
           cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, color:P.navy },
  label: { fontSize:11, fontWeight:700, color:P.light, textTransform:"uppercase",
           letterSpacing:".08em", display:"block", marginBottom:6 },
};

// ── Sample client data shape ──────────────────────────────────────────────────
const EMPTY_CLIENT = {
  id: "", name: "", siteName: "", address: "", postcode: "", password: "",
  assessmentDate: "", consultant: "Genesis Retail",
  verdict: "Strong Opportunity", roi: 0, netProfit: 0, investment: 0,
  payback: 0, weeklyTurnover: 0, annualSales: 0, grossMargin: 0,
  symbolGroup: "Nisa",
  milestones: [
    { id:1, label:"Site assessment completed",   done:true,  date:"" },
    { id:2, label:"Symbol group application",    done:false, date:"" },
    { id:3, label:"Lease heads of terms agreed", done:false, date:"" },
    { id:4, label:"Finance approved",            done:false, date:"" },
    { id:5, label:"Refit contractor appointed",  done:false, date:"" },
    { id:6, label:"Refit commenced",             done:false, date:"" },
    { id:7, label:"Refit completed",             done:false, date:"" },
    { id:8, label:"Store opens for trading",     done:false, date:"" },
  ],
  messages: [],
  notes: "",
};

const ADMIN_PIN = "genesis2025";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = n => "£" + Math.round(Math.abs(n)).toLocaleString("en-GB");
const pct  = n => parseFloat(n).toFixed(1) + "%";
const genId = () => Math.random().toString(36).substr(2,9);
const now  = () => new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});

function getClients() {
  try { return JSON.parse(localStorage.getItem("gr_clients")||"[]"); } catch { return []; }
}
function saveClients(clients) {
  localStorage.setItem("gr_clients", JSON.stringify(clients));
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ title, sub, onBack, adminMode }) {
  return (
    <div style={{ background:P.dark, padding:"0 24px", position:"sticky", top:0, zIndex:100,
                  boxShadow:"0 4px 20px rgba(12,16,36,0.4)" }}>
      <div style={{ maxWidth:960, margin:"0 auto", display:"flex", alignItems:"center",
                    justifyContent:"space-between", height:64 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {onBack && (
            <button onClick={onBack} style={{ ...S.btnSm, background:"transparent",
              border:"1px solid rgba(255,255,255,0.2)", color:"#fff", padding:"6px 12px" }}>
              ← Back
            </button>
          )}
          <div>
            <div style={{ fontSize:10, color:P.gold, letterSpacing:".2em", fontWeight:700,
                          textTransform:"uppercase" }}>Genesis Retail</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", lineHeight:1.2 }}>{title}</div>
          </div>
        </div>
        {sub && <div style={{ fontSize:12, color:"#8fa8d8" }}>{sub}</div>}
        {adminMode && <div style={{ fontSize:11, color:P.gold, fontWeight:700,
          padding:"4px 10px", border:`1px solid ${P.gold}`, borderRadius:6 }}>ADMIN</div>}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function Stat({ label, value, sub, col }) {
  return (
    <div style={{ background:"#fff", border:`1px solid ${P.border}`, borderRadius:10,
                  padding:"14px 16px", textAlign:"center" }}>
      <div style={{ fontSize:9, color:P.light, textTransform:"uppercase", letterSpacing:".1em",
                    marginBottom:5, fontWeight:700 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color:col||P.navy, marginBottom:3 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:P.light }}>{sub}</div>}
    </div>
  );
}

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
function LoginScreen({ onRetailerLogin, onAdminLogin }) {
  const [clientId, setClientId] = useState("");
  const [password, setPassword] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [tab, setTab]     = useState("retailer");
  const [error, setError] = useState("");

  const handleRetailer = () => {
    const clients = getClients();
    const client = clients.find(c => c.id === clientId.trim() && c.password === password);
    if (client) { onRetailerLogin(client); }
    else { setError("Client ID or password incorrect. Contact Genesis Retail for access."); }
  };

  const handleAdmin = () => {
    if (adminPin === ADMIN_PIN) { onAdminLogin(); }
    else { setError("Incorrect admin PIN."); }
  };

  return (
    <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center",
                  background:`linear-gradient(135deg, ${P.dark} 0%, #1a2456 100%)` }}>
      <div style={{ width:"100%", maxWidth:420, padding:24 }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:11, color:P.gold, letterSpacing:".3em", fontWeight:700,
                        textTransform:"uppercase", marginBottom:6 }}>Genesis Retail</div>
          <div style={{ fontSize:26, fontWeight:800, color:"#fff", marginBottom:6 }}>
            Client Portal
          </div>
          <div style={{ fontSize:13, color:"#8fa8d8" }}>
            Site Viability Assessments & Progress Tracking
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display:"flex", gap:0, marginBottom:20, background:"rgba(255,255,255,0.08)",
                      borderRadius:10, padding:4 }}>
          {[["retailer","Retailer Login"],["admin","Admin"]].map(([t,l])=>(
            <button key={t} onClick={()=>{setTab(t);setError("");}}
              style={{ flex:1, padding:"10px", border:"none", borderRadius:8, cursor:"pointer",
                       fontFamily:"inherit", fontSize:13, fontWeight:700, transition:"all .2s",
                       background: tab===t ? "#fff" : "transparent",
                       color: tab===t ? P.navy : "#8fa8d8" }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:14, padding:24,
                      border:"1px solid rgba(255,255,255,0.1)" }}>
          {tab === "retailer" ? (
            <>
              <div style={{ marginBottom:16 }}>
                <label style={{ ...S.label, color:"#8fa8d8" }}>Client ID</label>
                <input style={{ ...S.input, background:"rgba(255,255,255,0.1)",
                  border:"1px solid rgba(255,255,255,0.2)", color:"#fff" }}
                  placeholder="e.g. GR-001"
                  value={clientId} onChange={e=>setClientId(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleRetailer()}
                />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ ...S.label, color:"#8fa8d8" }}>Password</label>
                <input style={{ ...S.input, background:"rgba(255,255,255,0.1)",
                  border:"1px solid rgba(255,255,255,0.2)", color:"#fff" }}
                  type="password" placeholder="Your password"
                  value={password} onChange={e=>setPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleRetailer()}
                />
              </div>
              <button style={{ ...S.btn, width:"100%", background:P.gold, color:P.dark,
                fontSize:16 }} onClick={handleRetailer}>
                Sign In →
              </button>
              <div style={{ textAlign:"center", marginTop:12, fontSize:11, color:"#5a6fa8" }}>
                Access details provided by Genesis Retail after your assessment.
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom:20 }}>
                <label style={{ ...S.label, color:"#8fa8d8" }}>Admin PIN</label>
                <input style={{ ...S.input, background:"rgba(255,255,255,0.1)",
                  border:"1px solid rgba(255,255,255,0.2)", color:"#fff" }}
                  type="password" placeholder="Genesis Retail staff only"
                  value={adminPin} onChange={e=>setAdminPin(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleAdmin()}
                />
              </div>
              <button style={{ ...S.btn, width:"100%", fontSize:16 }} onClick={handleAdmin}>
                Admin Access →
              </button>
            </>
          )}
          {error && (
            <div style={{ marginTop:14, padding:"10px 14px", background:"rgba(214,40,40,0.15)",
              border:"1px solid rgba(214,40,40,0.3)", borderRadius:8, fontSize:12, color:"#ff8080" }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── RETAILER DASHBOARD ────────────────────────────────────────────────────────
function RetailerDashboard({ client, onLogout, onUpdateClient }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [msgSent, setMsgSent] = useState(false);

  const verdictCol = client.roi >= 20 ? P.navy : client.roi >= 10 ? P.amber : P.red;
  const progress = client.milestones.filter(m=>m.done).length;
  const total = client.milestones.length;
  const pctDone = Math.round(progress / total * 100);

  const sendMessage = () => {
    if (!message.trim()) return;
    const updated = {
      ...client,
      messages: [...(client.messages||[]), {
        id: genId(), from:"retailer", text:message.trim(), date:now(), read:false
      }]
    };
    onUpdateClient(updated);
    setMessage("");
    setMsgSent(true);
    setTimeout(()=>setMsgSent(false), 3000);
  };

  const tabs = [
    { id:"overview",  label:"Overview" },
    { id:"financials",label:"Financials" },
    { id:"progress",  label:"Progress" },
    { id:"messages",  label:`Messages${(client.messages||[]).filter(m=>m.from==="genesis"&&!m.read).length>0?" ●":""}` },
  ];

  return (
    <div style={S.page}>
      <Header title={client.siteName || "My Site"} sub={client.address}
        onBack={onLogout} />

      {/* Tab bar */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${P.border}`,
                    position:"sticky", top:64, zIndex:99 }}>
        <div style={{ maxWidth:960, margin:"0 auto", display:"flex", gap:0, padding:"0 24px" }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{ padding:"14px 20px", border:"none", background:"transparent",
                cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:600,
                color: activeTab===t.id ? P.navy : P.light,
                borderBottom: activeTab===t.id ? `2px solid ${P.navy}` : "2px solid transparent",
                transition:"all .2s" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:24 }}>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <>
            {/* Verdict banner */}
            <div style={{ background:verdictCol, borderRadius:12, padding:"18px 24px",
                          marginBottom:20, display:"flex", justifyContent:"space-between",
                          alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.7)", letterSpacing:".15em",
                              fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>
                  Overall Verdict
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:"#fff" }}>{client.verdict}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:32, fontWeight:900, color:"#fff" }}>{pct(client.roi)}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>Return on Investment</div>
              </div>
            </div>

            {/* KPI grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12,
                          marginBottom:20 }}>
              <Stat label="Net Profit / Year" value={fmt(client.netProfit)} sub="After all costs" col={P.navy}/>
              <Stat label="Total Investment"  value={fmt(client.investment)} sub="Refit + stock" />
              <Stat label="Payback Period"    value={client.payback ? client.payback.toFixed(1)+" yrs":"N/A"} sub="From day 1 trading" />
              <Stat label="Weekly Turnover"   value={fmt(client.weeklyTurnover)} sub="Post-refit" />
              <Stat label="Annual Sales"      value={fmt(client.annualSales)} sub="Year 1 forecast" />
              <Stat label="Gross Margin"      value={pct(client.grossMargin)} sub="Blended" />
            </div>

            {/* Progress summary */}
            <div style={{ ...S.card }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                            marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:700, color:P.navy }}>Refit Progress</div>
                <div style={{ fontSize:13, fontWeight:700, color:P.navy }}>{progress}/{total} steps complete</div>
              </div>
              <div style={{ height:8, background:P.pale, borderRadius:4, marginBottom:10 }}>
                <div style={{ height:"100%", background:P.navy, borderRadius:4,
                              width:pctDone+"%", transition:"width .5s" }}/>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {client.milestones.map(m=>(
                  <div key={m.id} style={{ display:"flex", alignItems:"center", gap:5,
                    padding:"4px 10px", borderRadius:20,
                    background: m.done ? P.pale : P.card,
                    border: `1px solid ${m.done ? P.navy : P.border}` }}>
                    <div style={{ width:8, height:8, borderRadius:"50%",
                      background: m.done ? P.navy : P.border }}/>
                    <span style={{ fontSize:11, color: m.done ? P.navy : P.light,
                      fontWeight: m.done ? 700 : 400 }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessment details */}
            <div style={{ ...S.card }}>
              <div style={{ fontSize:14, fontWeight:700, color:P.navy, marginBottom:12 }}>
                Assessment Details
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  ["Site", client.siteName],
                  ["Address", client.address],
                  ["Postcode", client.postcode],
                  ["Assessment Date", client.assessmentDate],
                  ["Consultant", client.consultant],
                  ["Recommended Symbol Group", client.symbolGroup],
                ].map(([l,v])=>(
                  <div key={l} style={{ padding:"8px 12px", background:P.card,
                    borderRadius:6, fontSize:12 }}>
                    <span style={{ color:P.light, fontWeight:600 }}>{l}: </span>
                    <span style={{ color:P.text }}>{v || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── FINANCIALS ── */}
        {activeTab === "financials" && (
          <>
            <div style={{ ...S.card }}>
              <div style={{ fontSize:16, fontWeight:700, color:P.navy, marginBottom:16 }}>
                Financial Summary — Year 1
              </div>
              {[
                ["Sales Revenue", fmt(client.annualSales), "100%", true],
                ["Gross Profit", fmt(client.annualSales * client.grossMargin/100), pct(client.grossMargin), true],
                ["Net Profit", fmt(client.netProfit), pct(client.netProfit/client.annualSales*100||0), true],
                ["Total Investment", fmt(client.investment), "", false],
                ["Return on Investment", pct(client.roi), "Target: 20%+", false],
                ["Payback Period", client.payback ? client.payback.toFixed(1)+" years":"N/A", "", false],
              ].map(([l,v,s,hi])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"12px 0",
                  borderBottom:`1px solid ${P.border}` }}>
                  <div style={{ fontSize:13, color:P.text, fontWeight:hi?600:400 }}>{l}</div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:hi?16:14, fontWeight:700,
                      color:hi?P.navy:P.text }}>{v}</div>
                    {s&&<div style={{ fontSize:10, color:P.light }}>{s}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* ROI explanation */}
            <div style={{ ...S.card, background:P.pale, border:`1px solid ${P.navy}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:P.navy, marginBottom:8 }}>
                What does {pct(client.roi)} ROI mean?
              </div>
              <p style={{ fontSize:12, color:P.text, lineHeight:1.8, margin:0 }}>
                For every <strong>£100</strong> you invest in this business,{" "}
                <strong style={{ color:P.navy }}>£{parseFloat(client.roi).toFixed(0)}</strong> comes
                back as profit every year. A UK savings account pays around 4–5%.
                The Genesis Retail minimum threshold is 20%.
                At {pct(client.roi)}, this site{" "}
                <strong>{client.roi>=20?"comfortably exceeds":"meets"}</strong> that threshold.
              </p>
            </div>
          </>
        )}

        {/* ── PROGRESS TRACKER ── */}
        {activeTab === "progress" && (
          <div style={{ ...S.card }}>
            <div style={{ fontSize:16, fontWeight:700, color:P.navy, marginBottom:6 }}>
              Refit & Opening Progress
            </div>
            <div style={{ fontSize:12, color:P.light, marginBottom:20 }}>
              {progress} of {total} milestones completed · {pctDone}% of the journey done
            </div>
            <div style={{ height:8, background:P.pale, borderRadius:4, marginBottom:24 }}>
              <div style={{ height:"100%", background:P.navy, borderRadius:4,
                            width:pctDone+"%", transition:"width .5s" }}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {client.milestones.map((m,i)=>(
                <div key={m.id} style={{ display:"flex", alignItems:"flex-start", gap:16,
                  padding:"16px 0",
                  borderBottom: i<client.milestones.length-1 ? `1px solid ${P.border}` : "none" }}>
                  {/* Step indicator */}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                    flexShrink:0, width:32 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:14,
                      fontWeight:800,
                      background: m.done ? P.navy : P.card,
                      border: `2px solid ${m.done ? P.navy : P.border}`,
                      color: m.done ? "#fff" : P.light }}>
                      {m.done ? "✓" : i+1}
                    </div>
                    {i < client.milestones.length-1 && (
                      <div style={{ width:2, height:24, marginTop:4,
                        background: m.done ? P.navy : P.border }}/>
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ flex:1, paddingTop:4 }}>
                    <div style={{ fontSize:14, fontWeight:700,
                      color: m.done ? P.navy : P.text }}>{m.label}</div>
                    {m.date && (
                      <div style={{ fontSize:11, color:P.light, marginTop:3 }}>
                        Completed: {m.date}
                      </div>
                    )}
                    {!m.done && i === progress && (
                      <div style={{ marginTop:6, padding:"4px 10px", background:P.pale,
                        borderRadius:20, display:"inline-block",
                        fontSize:11, color:P.navy, fontWeight:600 }}>
                        ← Current step
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {activeTab === "messages" && (
          <>
            {/* Message history */}
            <div style={{ ...S.card, marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:P.navy, marginBottom:16 }}>
                Messages with Genesis Retail
              </div>
              {(client.messages||[]).length === 0 ? (
                <div style={{ textAlign:"center", padding:"24px 0", color:P.light, fontSize:13 }}>
                  No messages yet. Send your first message below.
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {client.messages.map(m=>(
                    <div key={m.id} style={{
                      padding:"12px 14px", borderRadius:10, maxWidth:"80%",
                      alignSelf: m.from==="retailer" ? "flex-end" : "flex-start",
                      background: m.from==="retailer" ? P.navy : P.card,
                      border: `1px solid ${m.from==="retailer" ? P.navy : P.border}` }}>
                      <div style={{ fontSize:11, color: m.from==="retailer" ?
                        "rgba(255,255,255,0.6)" : P.light, marginBottom:4, fontWeight:600 }}>
                        {m.from==="retailer" ? "You" : "Genesis Retail"} · {m.date}
                      </div>
                      <div style={{ fontSize:13, color: m.from==="retailer" ? "#fff" : P.text,
                        lineHeight:1.6 }}>{m.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Send message */}
            <div style={{ ...S.card }}>
              <div style={{ fontSize:13, fontWeight:700, color:P.navy, marginBottom:10 }}>
                Send a message to Genesis Retail
              </div>
              <textarea
                value={message}
                onChange={e=>setMessage(e.target.value)}
                placeholder="Ask a question, request an update, or share any concerns..."
                style={{ ...S.input, minHeight:100, resize:"vertical", lineHeight:1.7 }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                marginTop:10 }}>
                {msgSent ? (
                  <div style={{ fontSize:13, color:P.navy, fontWeight:600 }}>
                    ✓ Message sent — Genesis Retail will respond shortly
                  </div>
                ) : <div/>}
                <button style={{ ...S.btn }} onClick={sendMessage}>Send Message →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [clients, setClients] = useState(getClients);
  const [view, setView]       = useState("list"); // list | add | edit | messages
  const [selected, setSelected] = useState(null);
  const [form, setForm]       = useState(EMPTY_CLIENT);
  const [reply, setReply]     = useState("");
  const [saved, setSaved]     = useState(false);

  const refresh = () => {
    const c = getClients();
    setClients(c);
    return c;
  };

  const saveClient = () => {
    const all = getClients();
    if (form.id) {
      saveClients(all.map(c => c.id === form.id ? form : c));
    } else {
      const newClient = { ...form, id:"GR-"+String(all.length+1).padStart(3,"0") };
      saveClients([...all, newClient]);
    }
    refresh();
    setSaved(true);
    setTimeout(()=>{setSaved(false); setView("list");}, 1500);
  };

  const deleteClient = (id) => {
    if (!window.confirm("Delete this client?")) return;
    saveClients(getClients().filter(c=>c.id!==id));
    refresh();
  };

  const openEdit = (client) => {
    setForm({ ...EMPTY_CLIENT, ...client });
    setSelected(client);
    setView("edit");
  };

  const openMessages = (client) => {
    setSelected(client);
    setView("messages");
  };

  const sendReply = () => {
    if (!reply.trim() || !selected) return;
    const all = getClients();
    const updated = all.map(c => c.id === selected.id ? {
      ...c,
      messages: [...(c.messages||[]), {
        id:genId(), from:"genesis", text:reply.trim(), date:now(), read:false
      }]
    } : c);
    saveClients(updated);
    setSelected(updated.find(c=>c.id===selected.id));
    setReply("");
    refresh();
  };

  const toggleMilestone = (clientId, mId) => {
    const all = getClients();
    const updated = all.map(c => c.id === clientId ? {
      ...c,
      milestones: c.milestones.map(m =>
        m.id === mId ? { ...m, done: !m.done, date: !m.done ? now() : "" } : m
      )
    } : c);
    saveClients(updated);
    setSelected(updated.find(c=>c.id===clientId));
    refresh();
  };

  const F = (key, label, type="text", placeholder="") => (
    <div style={{ marginBottom:14 }}>
      <label style={S.label}>{label}</label>
      <input style={S.input} type={type} placeholder={placeholder}
        value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>
    </div>
  );

  const FN = (key, label, placeholder="") => (
    <div style={{ marginBottom:14 }}>
      <label style={S.label}>{label}</label>
      <input style={S.input} type="number" placeholder={placeholder}
        value={form[key]||""} onChange={e=>setForm(f=>({...f,[key]:parseFloat(e.target.value)||0}))}/>
    </div>
  );

  const unread = clients.reduce((s,c)=>s+(c.messages||[]).filter(m=>m.from==="retailer"&&!m.read).length,0);

  return (
    <div style={S.page}>
      <Header title="Admin Dashboard" sub={`${clients.length} clients`}
        onBack={view==="list" ? onLogout : ()=>setView("list")} adminMode />

      <div style={{ maxWidth:960, margin:"0 auto", padding:24 }}>

        {/* ── CLIENT LIST ── */}
        {view === "list" && (
          <>
            {/* Summary stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12,
                          marginBottom:20 }}>
              <Stat label="Total Clients" value={clients.length} />
              <Stat label="Strong Opportunity" col={P.navy}
                value={clients.filter(c=>c.roi>=20).length} sub="ROI ≥ 20%" />
              <Stat label="In Progress"
                value={clients.filter(c=>c.milestones?.some(m=>m.done)&&!c.milestones?.every(m=>m.done)).length}
                sub="Refit underway" />
              <Stat label="Unread Messages" value={unread} col={unread>0?P.amber:P.light}/>
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                          marginBottom:14 }}>
              <div style={{ fontSize:16, fontWeight:700, color:P.navy }}>All Clients</div>
              <button style={{ ...S.btn }}
                onClick={()=>{ setForm({...EMPTY_CLIENT}); setView("add"); }}>
                + Add New Client
              </button>
            </div>

            {clients.length === 0 ? (
              <div style={{ ...S.card, textAlign:"center", padding:40 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🏪</div>
                <div style={{ fontSize:16, fontWeight:700, color:P.navy, marginBottom:8 }}>
                  No clients yet
                </div>
                <div style={{ fontSize:13, color:P.light }}>
                  Add your first client after completing a site assessment.
                </div>
              </div>
            ) : (
              clients.map(c => {
                const msgs = (c.messages||[]).filter(m=>m.from==="retailer"&&!m.read).length;
                const prog = (c.milestones||[]).filter(m=>m.done).length;
                const tot  = (c.milestones||[]).length;
                return (
                  <div key={c.id} style={{ ...S.card, display:"flex", alignItems:"center",
                    gap:16, flexWrap:"wrap" }}>
                    {/* ID badge */}
                    <div style={{ background:P.navy, color:"#fff", padding:"6px 12px",
                      borderRadius:8, fontSize:12, fontWeight:800, flexShrink:0 }}>
                      {c.id}
                    </div>
                    {/* Details */}
                    <div style={{ flex:1, minWidth:180 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:P.text }}>
                        {c.siteName || "Unnamed site"}
                      </div>
                      <div style={{ fontSize:12, color:P.light }}>{c.address} · {c.postcode}</div>
                    </div>
                    {/* Verdict */}
                    <div style={{ textAlign:"center", minWidth:80 }}>
                      <div style={{ fontSize:18, fontWeight:800,
                        color:c.roi>=20?P.navy:c.roi>=10?P.amber:P.red }}>
                        {pct(c.roi)}
                      </div>
                      <div style={{ fontSize:10, color:P.light }}>ROI</div>
                    </div>
                    {/* Progress */}
                    <div style={{ minWidth:100 }}>
                      <div style={{ fontSize:11, color:P.light, marginBottom:4 }}>
                        {prog}/{tot} steps
                      </div>
                      <div style={{ height:5, background:P.pale, borderRadius:3 }}>
                        <div style={{ height:"100%", background:P.navy, borderRadius:3,
                          width:(prog/tot*100)+"%"}}/>
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                      {msgs > 0 && (
                        <div style={{ padding:"4px 8px", background:"#fff3cd",
                          border:`1px solid ${P.amber}`, borderRadius:6,
                          fontSize:11, color:P.amber, fontWeight:700 }}>
                          {msgs} new msg{msgs>1?"s":""}
                        </div>
                      )}
                      <button style={S.btnSm} onClick={()=>openMessages(c)}>Messages</button>
                      <button style={S.btnSm} onClick={()=>openEdit(c)}>Edit</button>
                      <button style={{ ...S.btnSm, color:P.red, borderColor:P.red }}
                        onClick={()=>deleteClient(c.id)}>Delete</button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── ADD / EDIT CLIENT ── */}
        {(view === "add" || view === "edit") && (
          <>
            <div style={{ fontSize:18, fontWeight:700, color:P.navy, marginBottom:20 }}>
              {view==="add" ? "Add New Client" : `Edit — ${form.siteName||form.id}`}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div style={{ ...S.card }}>
                <div style={{ fontSize:13, fontWeight:700, color:P.navy, marginBottom:14 }}>
                  Site Details
                </div>
                {F("siteName",   "Site Name",    "text", "e.g. Station Road Stores")}
                {F("address",    "Address",      "text", "Full address")}
                {F("postcode",   "Postcode",     "text", "e.g. WD17 1ET")}
                {F("assessmentDate","Assessment Date","text","e.g. 29 May 2026")}
                {F("symbolGroup","Recommended Symbol Group","text","e.g. Nisa")}
              </div>

              <div style={{ ...S.card }}>
                <div style={{ fontSize:13, fontWeight:700, color:P.navy, marginBottom:14 }}>
                  Portal Access
                </div>
                {F("password", "Client Password", "text", "Set a strong password")}
                {form.id && (
                  <div style={{ padding:"10px 14px", background:P.pale, borderRadius:8,
                    fontSize:12, color:P.navy, marginBottom:14 }}>
                    <strong>Client ID:</strong> {form.id}<br/>
                    <strong>Login URL:</strong> genesis-retrail.vercel.app/portal<br/>
                    Share these with the retailer.
                  </div>
                )}
                <div style={{ fontSize:13, fontWeight:700, color:P.navy, marginBottom:14,
                  marginTop:8 }}>
                  Financial Results
                </div>
                {FN("roi",           "ROI %",                  "e.g. 98.7")}
                {FN("netProfit",     "Net Profit (£/yr)",      "e.g. 109000")}
                {FN("investment",    "Total Investment (£)",   "e.g. 110000")}
                {FN("payback",       "Payback (years)",        "e.g. 1.0")}
                {FN("weeklyTurnover","Weekly Turnover (£)",    "e.g. 24000")}
                {FN("annualSales",   "Annual Sales (£)",       "e.g. 1227000")}
                {FN("grossMargin",   "Gross Margin %",         "e.g. 23.8")}
              </div>
            </div>

            {/* Verdict */}
            <div style={{ ...S.card }}>
              <label style={S.label}>Overall Verdict</label>
              <select style={{ ...S.input, cursor:"pointer" }}
                value={form.verdict||"Strong Opportunity"}
                onChange={e=>setForm(f=>({...f,verdict:e.target.value}))}>
                {["Strong Opportunity","Viable — Proceed with Care",
                  "Marginal — Review Costs","Not Viable"].map(v=>(
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Milestones */}
            <div style={{ ...S.card }}>
              <div style={{ fontSize:13, fontWeight:700, color:P.navy, marginBottom:14 }}>
                Refit Milestones
              </div>
              {(form.milestones||EMPTY_CLIENT.milestones).map((m,i)=>(
                <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"8px 0", borderBottom:`1px solid ${P.border}` }}>
                  <input type="checkbox" checked={m.done}
                    onChange={()=>setForm(f=>({...f,
                      milestones:f.milestones.map(ms=>ms.id===m.id?
                        {...ms,done:!ms.done,date:!ms.done?now():""}:ms)
                    }))} style={{ width:18, height:18, cursor:"pointer" }}/>
                  <span style={{ flex:1, fontSize:13, color:P.text }}>{m.label}</span>
                  {m.done && m.date && (
                    <span style={{ fontSize:11, color:P.light }}>{m.date}</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
              <button style={{ ...S.btnSm, padding:"12px 20px" }}
                onClick={()=>setView("list")}>Cancel</button>
              <button style={{ ...S.btn, minWidth:160 }} onClick={saveClient}>
                {saved ? "✓ Saved!" : view==="add" ? "Add Client" : "Save Changes"}
              </button>
            </div>
          </>
        )}

        {/* ── MESSAGES ── */}
        {view === "messages" && selected && (
          <>
            <div style={{ fontSize:16, fontWeight:700, color:P.navy, marginBottom:4 }}>
              Messages — {selected.siteName}
            </div>
            <div style={{ fontSize:12, color:P.light, marginBottom:20 }}>
              Client ID: {selected.id}
            </div>

            {/* Update milestones */}
            <div style={{ ...S.card, marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:P.navy, marginBottom:12 }}>
                Update Progress
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {selected.milestones.map(m=>(
                  <div key={m.id}
                    onClick={()=>toggleMilestone(selected.id, m.id)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
                      borderRadius:8, cursor:"pointer",
                      background: m.done ? P.pale : P.card,
                      border:`1px solid ${m.done?P.navy:P.border}` }}>
                    <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0,
                      background:m.done?P.navy:P.border,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:10,color:"#fff",fontWeight:700 }}>
                      {m.done?"✓":""}
                    </div>
                    <span style={{ fontSize:11, color:m.done?P.navy:P.light,
                      fontWeight:m.done?700:400 }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Message thread */}
            <div style={{ ...S.card }}>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16,
                minHeight:80 }}>
                {(selected.messages||[]).length === 0 ? (
                  <div style={{ color:P.light, fontSize:13 }}>No messages yet.</div>
                ) : selected.messages.map(m=>(
                  <div key={m.id} style={{
                    padding:"10px 14px", borderRadius:10, maxWidth:"80%",
                    alignSelf: m.from==="genesis" ? "flex-end" : "flex-start",
                    background: m.from==="genesis" ? P.navy : P.card,
                    border:`1px solid ${m.from==="genesis"?P.navy:P.border}` }}>
                    <div style={{ fontSize:10, color:m.from==="genesis"?
                      "rgba(255,255,255,0.6)":P.light, marginBottom:3, fontWeight:600 }}>
                      {m.from==="genesis"?"Genesis Retail":"Retailer"} · {m.date}
                    </div>
                    <div style={{ fontSize:13, color:m.from==="genesis"?"#fff":P.text,
                      lineHeight:1.6 }}>{m.text}</div>
                  </div>
                ))}
              </div>

              <textarea value={reply} onChange={e=>setReply(e.target.value)}
                placeholder="Reply to this retailer..."
                style={{ ...S.input, minHeight:80, marginBottom:10 }}/>
              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <button style={S.btn} onClick={sendReply}>Send Reply →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function Portal() {
  const [view, setView]       = useState("login"); // login | retailer | admin
  const [client, setClient]   = useState(null);

  const updateClient = useCallback((updated) => {
    const all = getClients();
    saveClients(all.map(c => c.id === updated.id ? updated : c));
    setClient(updated);
  }, []);

  if (view === "login") return (
    <LoginScreen
      onRetailerLogin={c=>{ setClient(c); setView("retailer"); }}
      onAdminLogin={()=>setView("admin")}
    />
  );
  if (view === "retailer") return (
    <RetailerDashboard client={client}
      onLogout={()=>{ setClient(null); setView("login"); }}
      onUpdateClient={updateClient}
    />
  );
  if (view === "admin") return (
    <AdminDashboard onLogout={()=>setView("login")} />
  );
}
