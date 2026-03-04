import { useState, useEffect } from "react";

// ─── Helpers para localStorage ────────────────────────────────────────────────
function loadStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}
function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ─── Datos iniciales (solo se usan la primera vez) ───────────────────────────
const DEFAULT_STAFF = [
  "María González", "Carmen Rodríguez", "Lucía Martínez",
  "Ana López", "Isabel Fernández", "Rosa Sánchez",
];

const DEFAULT_LOCATIONS = [
  { id: 1, name: "Casa Familia Pérez", type: "casa", address: "Las Condes #245" },
  { id: 2, name: "Oficina Central Torre A", type: "oficina", address: "Providencia #1200, Piso 5" },
  { id: 3, name: "Casa Familia Ruiz", type: "casa", address: "Vitacura #890" },
  { id: 4, name: "Oficina Startup Hub", type: "oficina", address: "Las Condes #3300, Piso 2" },
  { id: 5, name: "Casa Familia Torres", type: "casa", address: "Ñuñoa #567" },
  { id: 6, name: "Oficina Clínica Norte", type: "oficina", address: "Independencia #450" },
];

const DEFAULT_ASSIGNMENTS = {
  1: "María González", 2: "Carmen Rodríguez", 3: "Lucía Martínez",
  4: "Ana López", 5: null, 6: null,
};

const CHECKLIST_ITEMS = {
  "Entrada / Hall": ["Barrer y fregar el suelo","Limpiar espejos y superficies","Limpiar molduras y rodapiés","Limpiar puertas y marcos","Vaciar papeleras"],
  "Sala / Living": ["Aspirar alfombras y tapizados","Fregar suelos duros","Limpiar polvo de muebles","Limpiar ventanas interiores","Limpiar lámparas y apliques","Ordenar cojines y decoración"],
  "Cocina": ["Limpiar encimera y zona de trabajo","Limpiar electrodomésticos (exterior)","Fregar suelo","Limpiar fregadero y grifo","Desengrasado de campana","Limpiar interior microondas","Vaciar y limpiar papelera"],
  "Baños": ["Limpiar y desinfectar inodoro","Limpiar lavabo y grifo","Limpiar ducha / bañera","Fregar suelo","Limpiar espejos","Reponer papel higiénico y jabón","Vaciar papelera"],
  "Dormitorios": ["Tender / hacer camas","Aspirar o fregar suelo","Limpiar polvo de superficies","Limpiar mesitas de noche","Limpiar espejo (si aplica)"],
  "Áreas Generales": ["Sacar basura a contenedor","Limpiar pasillos","Limpiar escaleras (si aplica)","Ventilación de ambientes","Revisión final general"],
};

const ALL_ITEMS = Object.values(CHECKLIST_ITEMS).flat();
const SUPERVISOR_PASSWORD = "super2024";

const C = {
  bg: "#F0F4F0", card: "#FFFFFF", primary: "#2D6A4F", primaryLight: "#52B788",
  accent: "#B7E4C7", text: "#1B2926", textMid: "#4A6358", textLight: "#8FAF9F",
  border: "#D8EDE3", danger: "#E53935",
};

function TypeTag({ type }) {
  return type === "casa"
    ? <span style={{ fontSize: 11, fontWeight: 600, background: "#E8F5E9", color: "#2D6A4F", padding: "3px 10px", borderRadius: 20 }}>🏠 Casa</span>
    : <span style={{ fontSize: 11, fontWeight: 600, background: "#E3F2FD", color: "#1565C0", padding: "3px 10px", borderRadius: 20 }}>🏢 Oficina</span>;
}

// ─── Toast de confirmación ─────────────────────────────────────────────────
function Toast({ message }) {
  return (
    <div style={{
      position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)",
      background: C.primary, color: "#fff", padding: "12px 24px", borderRadius: 30,
      fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      whiteSpace: "nowrap", animation: "fadeInUp 0.3s ease",
    }}>
      {message}
    </div>
  );
}

export default function App() {
  // ─── Estado persistido ───────────────────────────────────────────────────
  const [locations, setLocations] = useState(() => loadStorage("ct_locations", DEFAULT_LOCATIONS));
  const [assignments, setAssignments] = useState(() => loadStorage("ct_assignments", DEFAULT_ASSIGNMENTS));
  const [completedReports, setCompletedReports] = useState(() => loadStorage("ct_reports", []));
  const [checklistData, setChecklistData] = useState(() => loadStorage("ct_checklist", {}));
  const [nextId, setNextId] = useState(() => loadStorage("ct_nextid", 7));

  // ─── Estado local (no persiste) ──────────────────────────────────────────
  const [screen, setScreen] = useState("home");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [toast, setToast] = useState(null);

  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [shaking, setShaking] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("casa");
  const [newAddr, setNewAddr] = useState("");
  const [newStaff, setNewStaff] = useState("");
  const [formErr, setFormErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ─── Auto-guardar en localStorage cuando cambian datos ───────────────────
  useEffect(() => { saveStorage("ct_locations", locations); }, [locations]);
  useEffect(() => { saveStorage("ct_assignments", assignments); }, [assignments]);
  useEffect(() => { saveStorage("ct_reports", completedReports); }, [completedReports]);
  useEffect(() => { saveStorage("ct_checklist", checklistData); }, [checklistData]);
  useEffect(() => { saveStorage("ct_nextid", nextId); }, [nextId]);

  // ─── Toast helper ────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleLogin = () => {
    if (pwInput === SUPERVISOR_PASSWORD) {
      setPwInput(""); setPwError(false); setScreen("supervisor");
    } else {
      setPwError(true); setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPwInput("");
    }
  };

  const openAddModal = () => {
    setNewName(""); setNewType("casa"); setNewAddr(""); setNewStaff(""); setFormErr("");
    setShowAddModal(true);
  };

  const handleAdd = () => {
    if (!newName.trim()) { setFormErr("El nombre es obligatorio."); return; }
    if (!newAddr.trim()) { setFormErr("La dirección es obligatoria."); return; }
    const id = nextId;
    setNextId((n) => n + 1);
    setLocations((prev) => [...prev, { id, name: newName.trim(), type: newType, address: newAddr.trim() }]);
    setAssignments((prev) => ({ ...prev, [id]: newStaff || null }));
    setShowAddModal(false);
    showToast("✓ Propiedad guardada");
  };

  const handleDelete = (id) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    setAssignments((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setChecklistData((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setConfirmDelete(null);
    showToast("Propiedad eliminada");
  };

  const handleAssignChange = (locId, value) => {
    setAssignments((prev) => ({ ...prev, [locId]: value || null }));
    setEditingLocation(null);
    showToast("✓ Asignación guardada");
  };

  const getProgress = (id) => {
    const data = checklistData[id] || {};
    const checked = ALL_ITEMS.filter((i) => data[i]).length;
    return { checked, total: ALL_ITEMS.length, pct: Math.round((checked / ALL_ITEMS.length) * 100) };
  };

  const toggleItem = (locId, item) => {
    setChecklistData((prev) => ({
      ...prev,
      [locId]: { ...(prev[locId] || {}), [item]: !prev[locId]?.[item] },
    }));
  };

  const sendReport = () => {
    setCompletedReports((prev) => [{
      id: Date.now(), staff: selectedStaff, location: selectedLocation,
      date: new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }),
      time: new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      progress: getProgress(selectedLocation.id),
    }, ...prev]);
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setScreen("staff"); }, 2500);
  };

  const myLocations = selectedStaff ? locations.filter((l) => assignments[l.id] === selectedStaff) : [];

  // ─── Estilos base ─────────────────────────────────────────────────────────
  const st = {
    root: { minHeight: "100dvh", background: C.bg, fontFamily: "'Georgia','Times New Roman',serif", color: C.text, paddingBottom: 60 },
    wrap: { maxWidth: 480, margin: "0 auto", padding: "32px 20px" },
    back: { background: "none", border: "none", color: C.textMid, fontSize: 14, cursor: "pointer", padding: "8px 0", marginBottom: 20, display: "block" },
    card: { background: C.card, border: `2px solid ${C.border}`, borderRadius: 16, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", marginBottom: 12 },
    bar: { height: 6, background: C.accent, borderRadius: 3, overflow: "hidden", margin: "10px 0 4px" },
    label: { display: "block", fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 6, letterSpacing: "0.4px", textTransform: "uppercase" },
    input: { width: "100%", padding: "12px 14px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 15, fontFamily: "'Georgia',serif", color: C.text, background: "#FAFFFE", boxSizing: "border-box", outline: "none" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 },
    modal: { background: C.card, borderRadius: 24, padding: "32px 28px", maxWidth: 440, width: "100%", boxShadow: "0 16px 48px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" },
  };

  // ════════════════════════════════════════════════════════════════════════════
  // HOME
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "home") return (
    <div style={st.root}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      {toast && <Toast message={toast} />}
      <div style={{ ...st.wrap, textAlign: "center", paddingTop: 80 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 28, color: C.primary }}>✦</span>
          <span style={{ fontSize: 32, fontWeight: 700, color: C.primary, letterSpacing: "-0.5px" }}>CleanTrack</span>
        </div>
        <p style={{ fontSize: 15, color: C.textMid, marginBottom: 48, fontStyle: "italic" }}>Gestión de limpieza profesional</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <button onClick={() => setScreen("selectStaff")} style={{ background: C.primary, color: "#fff", border: "none", borderRadius: 20, padding: "28px 24px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, boxShadow: "0 4px 20px rgba(45,106,79,0.25)", fontFamily: "'Georgia',serif" }}>
            <span style={{ fontSize: 28, marginBottom: 4 }}>🧹</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>Soy Encargada</span>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Ver mis asignaciones y registrar limpieza</span>
          </button>
          <button onClick={() => { setPwInput(""); setPwError(false); setShowPw(false); setScreen("password"); }} style={{ background: C.card, color: C.primary, border: `2px solid ${C.border}`, borderRadius: 20, padding: "28px 24px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.06)", fontFamily: "'Georgia',serif" }}>
            <span style={{ fontSize: 28, marginBottom: 4 }}>📋</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>Supervisora</span>
            <span style={{ fontSize: 13, opacity: 0.8 }}>Gestionar asignaciones y ver reportes</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PASSWORD
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "password") return (
    <div style={st.root}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}} @keyframes fadeInUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      {toast && <Toast message={toast} />}
      <div style={{ ...st.wrap, paddingTop: 60 }}>
        <button style={st.back} onClick={() => { setPwInput(""); setPwError(false); setScreen("home"); }}>← Volver</button>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(45,106,79,0.3)" }}>🔒</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.primary, margin: "0 0 6px" }}>Acceso Supervisora</h1>
          <p style={{ fontSize: 14, color: C.textMid, fontStyle: "italic" }}>Ingresa tu contraseña para continuar</p>
        </div>
        <div style={{ background: C.card, borderRadius: 24, padding: "32px 28px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", border: `2px solid ${pwError ? C.danger : C.border}`, animation: shaking ? "shake 0.4s ease" : "none", transition: "border-color 0.2s" }}>
          <label style={st.label}>Contraseña</label>
          <div style={{ position: "relative", marginBottom: pwError ? 8 : 20 }}>
            <input type={showPw ? "text" : "password"} value={pwInput} autoFocus
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              style={{ ...st.input, paddingRight: 50, border: `2px solid ${pwError ? C.danger : C.border}`, background: pwError ? "#FFF5F5" : "#FAFFFE", letterSpacing: showPw ? "0" : "4px" }} />
            <button onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMid, padding: 0 }}>{showPw ? "🙈" : "👁"}</button>
          </div>
          {pwError && <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.danger, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>⚠ Contraseña incorrecta. Inténtalo de nuevo.</div>}
          <button onClick={handleLogin} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: C.primary, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Georgia',serif", boxShadow: "0 4px 16px rgba(45,106,79,0.3)" }}>Ingresar →</button>
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: C.textLight, marginTop: 20, fontStyle: "italic" }}>Solo el personal autorizado puede acceder a este panel.</p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SELECT STAFF
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "selectStaff") return (
    <div style={st.root}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      {toast && <Toast message={toast} />}
      <div style={st.wrap}>
        <button style={st.back} onClick={() => setScreen("home")}>← Volver</button>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.primary, margin: "0 0 6px" }}>¿Quién eres?</h1>
        <p style={{ fontSize: 14, color: C.textMid, marginBottom: 28, fontStyle: "italic" }}>Selecciona tu nombre para ver tus asignaciones</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DEFAULT_STAFF.map((name) => (
            <button key={name} onClick={() => { setSelectedStaff(name); setScreen("staff"); }} style={{ background: C.card, border: `2px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", fontFamily: "'Georgia',serif" }}>
              <span style={{ width: 42, height: 42, borderRadius: "50%", background: C.accent, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{name[0]}</span>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 600, textAlign: "left" }}>{name}</span>
              <span style={{ color: C.primaryLight, fontSize: 18 }}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // STAFF DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "staff") return (
    <div style={st.root}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      {toast && <Toast message={toast} />}
      <div style={st.wrap}>
        <button style={st.back} onClick={() => setScreen("selectStaff")}>← Cambiar encargada</button>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 24 }}>{selectedStaff[0]}</div>
          <div><div style={{ fontSize: 14, color: C.textMid }}>Hola,</div><div style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>{selectedStaff}</div></div>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 14 }}>Mis Asignaciones</h2>
        {myLocations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.textMid, background: C.card, borderRadius: 16, fontSize: 15 }}>
            <div style={{ fontSize: 40 }}>📭</div><p>No tienes asignaciones por ahora.</p>
          </div>
        ) : myLocations.map((loc) => {
          const prog = getProgress(loc.id);
          const done = completedReports.find((r) => r.location.id === loc.id && r.staff === selectedStaff);
          return (
            <button key={loc.id} onClick={() => { setSelectedLocation(loc); setScreen("checklist"); }} style={{ ...st.card, cursor: "pointer", textAlign: "left", fontFamily: "'Georgia',serif", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <TypeTag type={loc.type} />
                {done && <span style={{ fontSize: 11, fontWeight: 600, background: "#E8F5E9", color: "#2D6A4F", padding: "3px 10px", borderRadius: 20 }}>✓ Enviado</span>}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{loc.name}</div>
              <div style={{ fontSize: 13, color: C.textMid, marginBottom: 4 }}>{loc.address}</div>
              <div style={st.bar}><div style={{ height: "100%", background: C.primary, borderRadius: 3, width: `${prog.pct}%`, transition: "width 0.3s" }} /></div>
              <div style={{ fontSize: 12, color: C.textMid }}>{prog.checked}/{prog.total} tareas · {prog.pct}%</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // CHECKLIST
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "checklist") {
    const prog = getProgress(selectedLocation.id);
    const allDone = prog.checked === prog.total;
    return (
      <div style={st.root}>
        <style>{`@keyframes fadeInUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
        {toast && <Toast message={toast} />}
        {showSuccess && (
          <div style={st.overlay}>
            <div style={{ background: "#fff", borderRadius: 24, padding: "48px 40px", textAlign: "center", maxWidth: 320, width: "90%" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.primary, color: "#fff", fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>✓</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.primary, marginBottom: 8 }}>¡Reporte enviado!</div>
              <div style={{ fontSize: 14, color: C.textMid }}>Tu supervisora ha sido notificada.</div>
            </div>
          </div>
        )}
        <div style={st.wrap}>
          <button style={st.back} onClick={() => setScreen("staff")}>← Mis asignaciones</button>
          <div style={{ background: C.primary, color: "#fff", borderRadius: 20, padding: "24px", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 20 }}>{selectedLocation.type === "casa" ? "🏠 Casa" : "🏢 Oficina"}</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 4px", color: "#fff" }}>{selectedLocation.name}</h1>
            <p style={{ fontSize: 13, opacity: 0.8, margin: "0 0 16px" }}>{selectedLocation.address}</p>
            <div style={{ height: 8, background: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: "100%", background: C.accent, borderRadius: 4, width: `${prog.pct}%`, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>{prog.checked} de {prog.total} tareas completadas ({prog.pct}%)</div>
          </div>
          {Object.entries(CHECKLIST_ITEMS).map(([section, items]) => (
            <div key={section} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.primaryLight, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8, paddingLeft: 4 }}>{section}</div>
              {items.map((item) => {
                const checked = checklistData[selectedLocation.id]?.[item] || false;
                return (
                  <button key={item} onClick={() => toggleItem(selectedLocation.id, item)} style={{ width: "100%", background: checked ? "#F0FBF4" : C.card, border: `1.5px solid ${checked ? C.primaryLight : C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", fontFamily: "'Georgia',serif" }}>
                    <span style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${checked ? C.primary : C.border}`, background: checked ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{checked && "✓"}</span>
                    <span style={{ fontSize: 14, color: checked ? C.textLight : C.text, textDecoration: checked ? "line-through" : "none" }}>{item}</span>
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ padding: "24px 0 8px", textAlign: "center" }}>
            <button onClick={allDone ? sendReport : undefined} disabled={!allDone} style={{ width: "100%", padding: "18px", borderRadius: 16, border: "none", fontSize: 16, fontWeight: 700, cursor: allDone ? "pointer" : "not-allowed", fontFamily: "'Georgia',serif", background: allDone ? C.primary : C.border, color: allDone ? "#fff" : C.textLight, boxShadow: allDone ? "0 6px 24px rgba(45,106,79,0.35)" : "none" }}>
              {allDone ? "✉ Enviar reporte a supervisora" : `Faltan ${prog.total - prog.checked} tareas`}
            </button>
            {!allDone && <p style={{ fontSize: 13, color: C.textMid, marginTop: 10 }}>Completa todas las tareas para poder enviar el reporte.</p>}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUPERVISOR
  // ════════════════════════════════════════════════════════════════════════════
  if (screen === "supervisor") return (
    <div style={st.root}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      {toast && <Toast message={toast} />}

      {/* MODAL AGREGAR */}
      {showAddModal && (
        <div style={st.overlay}>
          <div style={st.modal}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: C.primary, margin: 0 }}>➕ Nueva Propiedad</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: 22, color: C.textMid, cursor: "pointer", padding: 0 }}>✕</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={st.label}>Tipo de propiedad</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["casa", "oficina"].map((t) => (
                  <button key={t} onClick={() => setNewType(t)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${newType === t ? C.primary : C.border}`, background: newType === t ? "#F0FBF4" : C.card, color: newType === t ? C.primary : C.textMid, fontWeight: newType === t ? 700 : 400, cursor: "pointer", fontSize: 15, fontFamily: "'Georgia',serif" }}>
                    {t === "casa" ? "🏠 Casa" : "🏢 Oficina"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={st.label}>Nombre <span style={{ color: C.danger }}>*</span></label>
              <input value={newName} onChange={(e) => { setNewName(e.target.value); setFormErr(""); }}
                placeholder={newType === "casa" ? "Ej: Casa Familia García" : "Ej: Oficina Torre Norte"}
                style={{ ...st.input, border: `2px solid ${formErr && !newName.trim() ? C.danger : C.border}` }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={st.label}>Dirección <span style={{ color: C.danger }}>*</span></label>
              <input value={newAddr} onChange={(e) => { setNewAddr(e.target.value); setFormErr(""); }}
                placeholder="Ej: Las Condes #123, Piso 2"
                style={{ ...st.input, border: `2px solid ${formErr && !newAddr.trim() ? C.danger : C.border}` }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={st.label}>Asignar encargada <span style={{ color: C.textLight, fontSize: 11, fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
              <select value={newStaff} onChange={(e) => setNewStaff(e.target.value)} style={{ ...st.input, cursor: "pointer" }}>
                <option value="">— Sin asignar por ahora —</option>
                {DEFAULT_STAFF.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {formErr && <div style={{ background: "#FFF5F5", border: `1.5px solid ${C.danger}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.danger, marginBottom: 16 }}>⚠ {formErr}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: `2px solid ${C.border}`, background: "none", color: C.textMid, fontSize: 15, cursor: "pointer", fontFamily: "'Georgia',serif" }}>Cancelar</button>
              <button onClick={handleAdd} style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Georgia',serif", boxShadow: "0 4px 14px rgba(45,106,79,0.3)" }}>✓ Guardar propiedad</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {confirmDelete && (
        <div style={st.overlay}>
          <div style={{ ...st.modal, maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>¿Eliminar propiedad?</h3>
            <p style={{ fontSize: 14, color: C.textMid, marginBottom: 24 }}>Se eliminará <strong>"{locations.find((l) => l.id === confirmDelete)?.name}"</strong> y todo su progreso.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: `2px solid ${C.border}`, background: "none", color: C.textMid, fontSize: 15, cursor: "pointer", fontFamily: "'Georgia',serif" }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: C.danger, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Georgia',serif" }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div style={st.wrap}>
        <button style={st.back} onClick={() => setScreen("home")}>← Cerrar sesión</button>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>📋</div>
          <div><div style={{ fontSize: 14, color: C.textMid }}>Panel de</div><div style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>Supervisora</div></div>
        </div>

        {/* REPORTES */}
        {completedReports.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>📬 Reportes Recibidos ({completedReports.length})</h2>
              <button onClick={() => { if (window.confirm("¿Borrar todos los reportes?")) { setCompletedReports([]); showToast("Reportes eliminados"); } }}
                style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: C.textMid, cursor: "pointer", fontFamily: "'Georgia',serif" }}>
                🗑 Limpiar
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {completedReports.map((r) => (
                <div key={r.id} style={{ background: "#F0FBF4", border: `2px solid ${C.primaryLight}`, borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>✓ Completado</span>
                    <span style={{ fontSize: 12, color: C.textMid }}>{r.date} · {r.time}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{r.location.name}</div>
                  <div style={{ fontSize: 13, color: C.textMid, marginTop: 2 }}>Por: {r.staff}</div>
                  <div style={{ fontSize: 12, color: C.primaryLight, marginTop: 4 }}>{r.progress.checked}/{r.progress.total} tareas · {r.progress.pct}%</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PROPIEDADES */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>🗂 Propiedades ({locations.length})</h2>
          <button onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Georgia',serif", boxShadow: "0 3px 12px rgba(45,106,79,0.3)" }}>＋ Agregar</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {locations.map((loc) => {
            const prog = getProgress(loc.id);
            const isEditing = editingLocation === loc.id;
            return (
              <div key={loc.id} style={st.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <TypeTag type={loc.type} />
                  <button onClick={() => setConfirmDelete(loc.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#ddd", padding: "2px 4px" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = C.danger}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#ddd"}>🗑</button>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{loc.name}</div>
                <div style={{ fontSize: 13, color: C.textMid, marginBottom: 4 }}>{loc.address}</div>
                <div style={st.bar}><div style={{ height: "100%", background: C.primary, borderRadius: 3, width: `${prog.pct}%` }} /></div>
                <div style={{ fontSize: 12, color: C.textMid, marginBottom: 10 }}>{prog.pct}% completado</div>
                {isEditing ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <select value={assignments[loc.id] || ""} onChange={(e) => handleAssignChange(loc.id, e.target.value)}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `2px solid ${C.primary}`, fontSize: 14, color: C.text, background: "#fff", fontFamily: "'Georgia',serif" }}>
                      <option value="">— Sin asignar —</option>
                      {DEFAULT_STAFF.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <button onClick={() => setEditingLocation(null)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "0 12px", cursor: "pointer", fontSize: 16, color: C.textMid }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: assignments[loc.id] ? C.primary : C.textLight, fontStyle: assignments[loc.id] ? "normal" : "italic" }}>
                      {assignments[loc.id] ? `👤 ${assignments[loc.id]}` : "Sin asignar"}
                    </span>
                    <button onClick={() => setEditingLocation(loc.id)} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: C.textMid, cursor: "pointer", fontFamily: "'Georgia',serif" }}>✎ Cambiar</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return null;
}

  return null;
}
