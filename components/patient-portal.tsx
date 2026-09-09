"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarCheck, ChevronLeft, ChevronRight, Home, Menu, Stethoscope, UserRound } from "lucide-react";
import HomeScreen from "./portal-home";
import { clinicDate, doctors, documentTypes, identitySchema, registrationSchema, specialties, type Appointment, type Patient, type Slot } from "@/lib/clinic";

export type PortalStep = "home" | "identify" | "register" | "specialty" | "doctor" | "schedule" | "confirm" | "scheduled" | "lookup" | "detail" | "contact" | "account" | "reports" | "professionals";
type Props = { initialStep?: PortalStep };
class RequestError extends Error { constructor(message: string, public status: number) { super(message); } }
async function request<T>(url = "/api/portal", body?: unknown): Promise<T> {
  const response = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  const json = await response.json();
  if (!response.ok) throw new RequestError(json.error || "No se pudo completar la solicitud.", response.status);
  return json.data;
}
function dateLabel(date: string) { return new Date(`${date}T12:00:00-05:00`).toLocaleDateString("es-CO", { timeZone: "America/Bogota", weekday: "long", day: "numeric", month: "long", year: "numeric" }); }

export default function PatientPortal({ initialStep = "home" }: Props) {
  const [step, setStep] = useState<PortalStep>(initialStep);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [items, setItems] = useState<Appointment[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});
  const [specialty, setSpecialty] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [month, setMonth] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotRevision, setSlotRevision] = useState(0);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [next, setNext] = useState<PortalStep>("specialty");
  const [filter, setFilter] = useState("TODAS");
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  async function refresh() {
    const data = await request<{ patient: Patient | null; appointments: Appointment[] }>();
    setPatient(data.patient); setItems(data.appointments);
  }
  useEffect(() => {
    setMonth(clinicDate().slice(0, 7));
    request<{ patient: Patient | null; appointments: Appointment[] }>().then(data => {
      setPatient(data.patient); setItems(data.appointments);
      if (!data.patient && ["lookup", "account", "reports"].includes(initialStep)) { setNext(initialStep); setStep("identify"); }
    }).catch(e => setError(e.message)).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (step !== "schedule" || !date) return;
    let active = true;
    setLoadingSlots(true); setSlots([]); setTime("");
    const params = new URLSearchParams({ action: "availability", specialty, doctorId, date, exclude: editing ? selected?.id || "" : "" });
    request<Slot[]>(`/api/portal?${params}`).then(data => { if (active) setSlots(data); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoadingSlots(false); });
    return () => { active = false; };
  }, [step, date, specialty, doctorId, editing, selected?.id, slotRevision]);
  function navigate(target: PortalStep) {
    if (busy) return;
    setError(""); setNotice(""); setFields({}); setMenu(false);
    if (target === "register" && step !== "identify") setNext("specialty");
    if (["identify", "specialty"].includes(target)) { setEditing(false); setSelected(null); setDate(""); setTime(""); }
    if (target === "identify") { setNext("specialty"); setStep(patient ? "specialty" : "identify"); }
    else if (["lookup", "account", "reports"].includes(target) && !patient) { setNext(target); setStep("identify"); }
    else setStep(target);
  }
  function hasActiveSpecialty(value: string) {
    return items.some(appointment => appointment.specialty === value && appointment.status !== "CANCELADA" && new Date(`${appointment.date}T${appointment.time}:00-05:00`).getTime() > Date.now());
  }
  function chooseSpecialty(value: string) {
    setError(""); setNotice("");
    if (patient && hasActiveSpecialty(value)) {
      setError(`Ya tiene una cita activa de ${value}. Debe cancelarla o asistir antes de agendar otra.`);
      return;
    }
    setSpecialty(value); setDoctorId(""); setDate("");
    if (!patient) { setNext("doctor"); setStep("identify"); }
    else setStep("doctor");
  }
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar con el servidor. Intente nuevamente.");
      if (e instanceof RequestError && e.status === 401 && patient) { setPatient(null); setItems([]); setNext("lookup"); setStep("identify"); }
    }
    finally { lock.current = false; setBusy(false); }
  }
  function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = (step === "register" ? registrationSchema : identitySchema).safeParse(values);
    if (!parsed.success) { setFields(parsed.error.flatten().fieldErrors); setError("Revise los campos indicados."); return; }
    setFields({});
    void run(async () => {
      const p = await request<Patient>("/api/portal", { ...parsed.data, action: step === "register" ? "register" : "login" });
      const data = await request<{ patient: Patient | null; appointments: Appointment[] }>();
      setPatient(p); setItems(data.appointments);
      if (next === "doctor" && data.appointments.some(appointment => appointment.specialty === specialty && appointment.status !== "CANCELADA" && new Date(`${appointment.date}T${appointment.time}:00-05:00`).getTime() > Date.now())) {
        setStep("specialty");
        setError(`Ya tiene una cita activa de ${specialty}. Debe cancelarla o asistir antes de agendar otra.`);
        return;
      }
      setStep(next); setNotice("Sesión iniciada correctamente.");
    });
  }
  const activeAppointment = selected && selected.status !== "CANCELADA" && new Date(`${selected.date}T${selected.time}:00-05:00`).getTime() > Date.now();
  async function status(action: "confirm" | "cancel") {
    if (!selected) return;
    await run(async () => {
      const updated = await request<Appointment>("/api/portal", { action, id: selected.id });
      setSelected(updated); setItems(old => old.map(a => a.id === updated.id ? updated : a));
      dialog.current?.close(); setNotice(action === "cancel" ? "La cita fue cancelada y el horario quedó disponible." : "Asistencia confirmada.");
    });
  }
  const title: Record<PortalStep, string> = { home: "", identify: "Identificación del Paciente", register: "Registro de Nuevo Paciente", specialty: "Seleccione una Especialidad", doctor: "Seleccione un Profesional", schedule: "Seleccione Fecha y Hora", confirm: "Confirmación de su Cita", scheduled: "Tu cita fue agendada correctamente", lookup: "Consultar mis Citas", detail: "Detalle de su Cita", contact: "Información de atención", account: "Mi cuenta", reports: "Resumen de mis citas", professionals: "Nuestros profesionales" };
  const field = (name: string, label: string, type = "text") => <label key={name}>{label}<input aria-label={label} name={name} type={type} required autoComplete={name === "password" ? step === "register" ? "new-password" : "current-password" : undefined} maxLength={name === "password" ? 128 : 160} max={type === "date" ? clinicDate() : undefined} min={type === "date" ? "1900-01-01" : undefined} aria-invalid={Boolean(fields[name])} aria-describedby={fields[name] ? `${name}-error` : undefined} />{fields[name] && <span id={`${name}-error`} className="field-error">{fields[name]?.[0]}</span>}</label>;
  const summary = (appointment?: Appointment) => <article className="summary-card"><div className="summary-header"><CalendarCheck /><div><h2>{appointment?.specialty || specialty}</h2><p>{appointment ? `Código de cita: ${appointment.code}` : "Revise sus datos antes de guardar."}</p></div></div><dl>{Object.entries({ Paciente: `${patient?.firstName || ""} ${patient?.lastName || ""}`, Profesional: doctors.find(d => d.id === (appointment?.doctorId || slots.find(s => s.time === time)?.doctorId || doctorId))?.name || "Asignación automática", Fecha: dateLabel(appointment?.date || date), Hora: `${appointment?.time || time} (Colombia)`, Estado: appointment?.status || "Por guardar" }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="summary-action">Preséntese 15 minutos antes de la hora programada.</p></article>;
  const back = () => navigate(({ doctor: "specialty", schedule: editing ? "detail" : "doctor", confirm: "schedule", detail: "lookup", register: "identify" } as Partial<Record<PortalStep, PortalStep>>)[step] || "home");
  const calendar = () => {
    const [year, m] = month.split("-").map(Number);
    const start = new Date(year, m - 1, 1), count = new Date(year, m, 0).getDate(), offset = (start.getDay() + 6) % 7;
    const changeMonth = (delta: number) => { const value = new Date(year, m - 1 + delta, 1); setMonth(`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`); setDate(""); setTime(""); setSlots([]); };
    const maxDay = clinicDate(new Date(Date.now() + 180 * 86400000));
    return <article className="panel-card"><div className="calendar-header"><button type="button" className="icon-button" aria-label="Mes anterior" disabled={month <= clinicDate().slice(0, 7)} onClick={() => changeMonth(-1)}><ChevronLeft /></button><h2>{start.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}</h2><button type="button" className="icon-button" aria-label="Mes siguiente" disabled={month >= maxDay.slice(0, 7)} onClick={() => changeMonth(1)}><ChevronRight /></button></div><div className="weekdays">{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => <span key={d}>{d}</span>)}</div><div className="calendar-grid">{Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: count }, (_, i) => { const day = `${month}-${String(i + 1).padStart(2, "0")}`; const weekday = new Date(year, m - 1, i + 1).getDay(); const disabled = day < clinicDate() || day > maxDay || weekday === 0; return <button key={day} type="button" aria-label={day} aria-pressed={date === day} disabled={disabled} className={`date-button ${disabled ? "disabled" : ""} ${date === day ? "selected" : ""}`} onClick={() => { setDate(day); setTime(""); setError(""); }}>{i + 1}</button>; })}</div><p className="legend">Lunes a sábado · Sábados hasta las 2:00 p. m. · Hora de Colombia · Hasta 180 días</p></article>;
  };

  return <div className="clinic-app"><header className="topbar"><button className="logo-button" onClick={() => navigate("home")} aria-label="Inicio"><Image src="/logo-clinica-belen.png" alt="Clínica Belén" width={180} height={64} className="logo" priority /></button><nav className={`topnav ${menu ? "menu-open" : ""}`} aria-label="Principal">{([["home", "Inicio"], ["lookup", "Citas"], ["specialty", "Especialidades"], ["contact", "Contacto"]] as [PortalStep, string][]).map(([target, label]) => <button key={target} className={`nav-link ${step === target ? "active" : ""}`} disabled={!ready || busy} onClick={() => navigate(target)}>{label}</button>)}</nav>{patient ? <button className="account-avatar desktop-only" type="button" aria-label="Mi cuenta" title={patient.firstName} disabled={!ready || busy} onClick={() => navigate("account")}>{patient.firstName.trim().charAt(0).toLocaleUpperCase("es-CO")}</button> : <button className="primary-pill desktop-only" disabled={!ready || busy} onClick={() => navigate("identify")}>Ingresar</button>}<button className="icon-button mobile-only" aria-label="Abrir menú" aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu /></button></header>
    <main className="app-canvas"><aside className="sidenav" aria-label="Navegación lateral"><button type="button" className={`side-link ${step === "home" ? "active" : ""}`} aria-current={step === "home" ? "page" : undefined} disabled={!ready || busy} onClick={() => navigate("home")}><Home size={25} aria-hidden="true" />Inicio</button><button type="button" className={`side-link ${["account", "identify", "register"].includes(step) ? "active" : ""}`} aria-current={step === "account" ? "page" : undefined} disabled={!ready || busy} onClick={() => navigate(patient ? "account" : "identify")}><UserRound size={25} aria-hidden="true" />Perfil</button></aside><section className="content-panel"><div aria-live="polite">{!ready && <p role="status">Cargando portal…</p>}{busy && <p role="status">Guardando…</p>}{notice && <p className="notice" role="status">{notice}</p>}</div>{error && <div className="error-banner" role="alert">{error}{!patient && ready && <button className="text-button" onClick={() => navigate("identify")}>Ingresar</button>}</div>}
      {ready && <fieldset className="portal-content" disabled={busy}>
      {step === "home" ? <HomeScreen onNavigate={navigate} /> : <div className="flow-screen"><button className="back-button" type="button" onClick={back}><ArrowLeft size={20} />Volver</button><div className="page-heading"><h1>{title[step]}</h1></div>
      {(step === "identify" || step === "register") && <div className="form-card"><p>{step === "register" ? "Complete su información y cree una contraseña para gestionar sus citas." : "Ingrese con el documento y la contraseña de su registro."}</p><form onSubmit={authenticate} noValidate><label>Tipo de documento<select name="documentType" defaultValue="CC">{Object.entries(documentTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{field("documentNumber", "Número de documento")}{step === "register" && <>{field("firstName", "Nombres")}{field("lastName", "Apellidos")}{field("birthDate", "Fecha de nacimiento", "date")}{field("phone", "Teléfono", "tel")}{field("email", "Correo electrónico", "email")}</>}{field("password", "Contraseña", "password")}<button className="primary-button" type="submit">{step === "register" ? "Registrarme y continuar" : "Continuar"}</button>{step === "identify" && <button className="text-button" type="button" onClick={() => navigate("register")}>Soy nuevo paciente, registrarme</button>}</form></div>}
      {step === "specialty" && <div className="choice-grid">{specialties.map(s => <button className="choice-card" key={s} onClick={() => chooseSpecialty(s)}><span className="choice-icon"><Stethoscope /></span><strong>{s}</strong></button>)}</div>}
      {step === "professionals" && <div className="doctor-grid">{doctors.map(d => <button className="doctor-card" key={d.id} onClick={() => { setSpecialty(d.specialty); setDoctorId(d.id); setDate(""); setTime(""); setEditing(false); if (patient) setStep("schedule"); else { setNext("schedule"); setStep("identify"); } }}><Stethoscope /><span><strong>{d.name}</strong><small>{d.specialty}</small><small>Ver disponibilidad</small></span></button>)}</div>}
      {step === "doctor" && <><p>{specialty}</p><div className="doctor-grid">{[{ id: "", name: "Cualquier profesional disponible", specialty }, ...doctors.filter(d => d.specialty === specialty)].map(d => <button className="doctor-card" key={d.id} onClick={() => { setDoctorId(d.id); setDate(""); setTime(""); setStep("schedule"); }}><Stethoscope /><span><strong>{d.name}</strong><small>{d.specialty}</small><small>Lunes a sábado</small></span></button>)}</div></>}
      {step === "schedule" && <><p>{specialty} · {doctors.find(d => d.id === doctorId)?.name || "Asignación automática"}</p><div className="schedule-grid">{month && calendar()}<article className="panel-card"><h2 className="panel-title">Horarios disponibles<small>{date ? dateLabel(date) : "Seleccione un día en el calendario"}</small></h2>{loadingSlots ? <p role="status">Consultando disponibilidad…</p> : <><div className="slot-grid">{slots.map(s => <button className={`time-slot ${time === s.time ? "selected" : ""}`} key={s.time} disabled={!s.available} aria-pressed={time === s.time} onClick={() => setTime(s.time)}>{s.time}{!s.available ? " · No disponible" : ""}</button>)}</div>{date && !slots.some(s => s.available) && <p>No hay horarios disponibles. Seleccione otro día.</p>}</>}{time && <p className="selected-summary">Seleccionó {dateLabel(date)} a las {time}.</p>}</article></div><div className="flow-actions"><button className="secondary-button" onClick={back}>Volver</button><button className="primary-button compact" disabled={!time || loadingSlots} onClick={() => setStep("confirm")}>Continuar</button></div></>}
      {step === "confirm" && <>{summary()}<div className="flow-actions"><button className="secondary-button" onClick={() => setStep("schedule")}>Modificar</button><button className="primary-button compact" onClick={() => void run(async () => { try { const a = await request<Appointment>("/api/portal", { action: "book", specialty, doctorId, date, time, ...(editing ? { id: selected?.id } : {}) }); setSelected(a); setItems(old => [a, ...old.filter(item => item.id !== a.id)]); setStep("scheduled"); setNotice(editing ? "Su cita fue reprogramada." : "Guarde el código de su cita."); setEditing(false); } catch (e) { setStep("schedule"); setSlotRevision(v => v + 1); throw e; } })}>{editing ? "Guardar reprogramación" : "Confirmar cita"}</button></div></>}
      {step === "scheduled" && selected && <>{summary(selected)}<div className="flow-actions"><button className="secondary-button" onClick={() => navigate("lookup")}>Ver mis citas</button><button className="primary-button compact" onClick={() => navigate("home")}>Volver al inicio</button></div></>}
      {step === "lookup" && patient && <><p>{patient.firstName}, estas son sus citas registradas.</p><label>Filtrar por estado<select value={filter} onChange={e => setFilter(e.target.value)}>{["TODAS", "PENDIENTE", "CONFIRMADA", "CANCELADA"].map(v => <option key={v}>{v}</option>)}</select></label><div className="appointment-list">{items.filter(a => filter === "TODAS" || a.status === filter).map(a => <button className="doctor-card" key={a.id} onClick={() => { setSelected(a); setEditing(false); setStep("detail"); }}><CalendarCheck /><span><strong>{a.specialty}</strong><small>{dateLabel(a.date)} · {a.time}</small><small>{a.code} · {a.status}</small></span></button>)}</div>{!items.some(a => filter === "TODAS" || a.status === filter) && <p>No hay citas para mostrar.</p>}<button className="primary-button" onClick={() => navigate("identify")}>Agendar nueva cita</button></>}
      {step === "detail" && selected && <>{summary(selected)}{activeAppointment ? <div className="flow-actions">{selected.status === "PENDIENTE" && <button className="primary-button compact" onClick={() => void status("confirm")}>Confirmar asistencia</button>}<button className="secondary-button" onClick={() => { setEditing(true); setSpecialty(selected.specialty); setDoctorId(selected.doctorId); setDate(""); setTime(""); setStep("schedule"); }}>Reprogramar</button><button className="danger-button" onClick={() => dialog.current?.showModal()}>Cancelar cita</button></div> : <p>Esta cita ya no admite modificaciones.</p>}<dialog ref={dialog} className="modal-card" aria-labelledby="cancel-title"><h3 id="cancel-title">¿Desea cancelar esta cita?</h3><p>El horario quedará disponible para otro paciente.</p><div className="flow-actions"><button className="secondary-button" autoFocus onClick={() => dialog.current?.close()}>Conservar cita</button><button className="danger-button" onClick={() => void status("cancel")}>Confirmar cancelación</button></div></dialog></>}
      {step === "account" && patient && <article className="summary-card"><h2>{patient.firstName} {patient.lastName}</h2><p>{patient.documentType} {patient.documentNumber}</p><p>{patient.email}</p><p>{patient.phone}</p><div className="flow-actions"><button className="secondary-button" onClick={() => navigate("lookup")}>Mis citas</button><button className="primary-button" onClick={() => void run(async () => { await request("/api/portal", { action: "logout" }); setPatient(null); setItems([]); setSelected(null); setStep("home"); })}>Cerrar sesión</button></div></article>}
      {step === "reports" && patient && <><p>Resumen personal de las citas registradas.</p><div className="choice-grid">{["PENDIENTE", "CONFIRMADA", "CANCELADA"].map(s => <article className="panel-card" key={s}><h2>{items.filter(a => a.status === s).length}</h2><p>{s}</p></article>)}</div><button className="secondary-button" onClick={() => navigate("lookup")}>Consultar detalle</button></>}
      {step === "contact" && <article className="panel-card"><h2>Clínica Belén de Fusagasugá</h2><p>Consulte con recepción los canales oficiales de atención, las políticas de privacidad y los derechos del paciente.</p><p>La agenda ofrece consultas de lunes a viernes, de 8:00 a 12:00 y de 14:00 a 17:00; los sábados, de 8:00 a 14:00, en hora de Colombia.</p><button className="primary-button" onClick={() => navigate("identify")}>Agendar cita</button></article>}
      </div>}</fieldset>}
    </section></main><footer className="footer"><Image src="/logo-clinica-belen.png" alt="Clínica Belén" width={180} height={64} className="logo" /><nav aria-label="Enlaces del portal"><Link href="/">Inicio</Link><button className="text-button" onClick={() => navigate("contact")}>Información de atención</button><button className="text-button" onClick={() => navigate("account")}>Mi cuenta</button></nav><p>© {new Date().getFullYear()} Clínica Belén.</p></footer></div>;
}
