"use client";

import Image from "next/image";
import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSearch,
  HeartPulse,
  Home,
  IdCard,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Stethoscope,
  User,
  UserPlus,
  Users
} from "lucide-react";

type Step =
  | "home"
  | "identify"
  | "register"
  | "specialty"
  | "doctor"
  | "schedule"
  | "confirm"
  | "scheduled"
  | "lookup"
  | "detail";

const specialties = [
  { name: "Medicina General", icon: Stethoscope },
  { name: "Pediatria", icon: HeartPulse },
  { name: "Cardiologia", icon: ShieldCheck },
  { name: "Dermatologia", icon: User },
  { name: "Odontologia", icon: CheckCircle2 }
];

const doctors = [
  {
    name: "Cualquier profesional disponible",
    specialty: "Asignacion automatica segun agenda",
    availability: "Mayor disponibilidad",
    icon: Users
  },
  {
    name: "Dr. Juan Perez",
    specialty: "Medicina General",
    availability: "Lunes, miercoles y viernes",
    icon: Stethoscope
  },
  {
    name: "Dra. Maria Garcia",
    specialty: "Medicina Interna",
    availability: "Martes y jueves",
    icon: HeartPulse
  },
  {
    name: "Dr. Roberto Gomez",
    specialty: "Cardiologia",
    availability: "Viernes en la tarde",
    icon: ShieldCheck
  }
];

const timeSlots = [
  { label: "8:00 a. m.", period: "Manana" },
  { label: "8:30 a. m.", period: "Manana" },
  { label: "10:00 a. m.", period: "Manana", selected: true },
  { label: "10:30 a. m.", period: "Manana", disabled: true },
  { label: "11:00 a. m.", period: "Manana" },
  { label: "11:30 a. m.", period: "Manana", disabled: true },
  { label: "2:00 p. m.", period: "Tarde" },
  { label: "2:30 p. m.", period: "Tarde", disabled: true },
  { label: "3:30 p. m.", period: "Tarde" },
  { label: "4:00 p. m.", period: "Tarde" }
];

export default function HomePage() {
  const [step, setStep] = useStep("home");

  return (
    <div className="clinic-app">
      <Header onNavigate={setStep} />
      <main className="app-canvas">
        {step === "home" ? <SideNav onNavigate={setStep} /> : null}
        <section className="content-panel">
          {step === "home" ? <HomeScreen onNavigate={setStep} /> : null}
          {step === "identify" ? <IdentificationScreen onNavigate={setStep} /> : null}
          {step === "register" ? <RegisterScreen onNavigate={setStep} /> : null}
          {step === "specialty" ? <SpecialtyScreen onNavigate={setStep} /> : null}
          {step === "doctor" ? <DoctorScreen onNavigate={setStep} /> : null}
          {step === "schedule" ? <ScheduleScreen onNavigate={setStep} /> : null}
          {step === "confirm" ? <ConfirmScreen onNavigate={setStep} /> : null}
          {step === "scheduled" ? <ScheduledScreen onNavigate={setStep} /> : null}
          {step === "lookup" ? <LookupScreen onNavigate={setStep} /> : null}
          {step === "detail" ? <DetailScreen onNavigate={setStep} /> : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function useStep(initial: Step): [Step, (step: Step) => void] {
  const state = React.useState<Step>(initial);
  return state;
}

function Logo() {
  return (
    <Image
      src="/logo-clinica-belen.png"
      alt="Clinica Belen de Fusagasuga"
      width={180}
      height={64}
      priority
      className="logo"
    />
  );
}

function Header({ onNavigate }: { onNavigate: (step: Step) => void }) {
  return (
    <header className="topbar">
      <button className="logo-button" type="button" onClick={() => onNavigate("home")}>
        <Logo />
      </button>
      <nav className="topnav" aria-label="Principal">
        <button className="nav-link active" type="button" onClick={() => onNavigate("home")}>
          Home
        </button>
        <button className="nav-link" type="button" onClick={() => onNavigate("lookup")}>
          Citas
        </button>
        <button className="nav-link" type="button" onClick={() => onNavigate("specialty")}>
          Especialidades
        </button>
        <button className="nav-link" type="button" onClick={() => onNavigate("detail")}>
          Contacto
        </button>
      </nav>
      <button className="primary-pill desktop-only" type="button" onClick={() => onNavigate("identify")}>
        Sign In
      </button>
      <button className="icon-button mobile-only" type="button" aria-label="Abrir menu">
        <Menu size={24} />
      </button>
    </header>
  );
}

function SideNav({ onNavigate }: { onNavigate: (step: Step) => void }) {
  return (
    <aside className="sidenav">
      <button className="side-link active" type="button" onClick={() => onNavigate("home")}>
        <Home size={24} />
        Inicio
      </button>
      <button className="side-link" type="button" onClick={() => onNavigate("identify")}>
        <CalendarDays size={24} />
        Agendar
      </button>
      <button className="side-link" type="button" onClick={() => onNavigate("lookup")}>
        <User size={24} />
        Perfil
      </button>
    </aside>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  const cards = [
    {
      title: "Agendar cita",
      description: "Programe una nueva consulta medica con nuestros especialistas.",
      action: "Comenzar",
      icon: CalendarPlus,
      next: "identify" as Step,
      tone: "blue"
    },
    {
      title: "Consultar cita",
      description: "Verifique horarios, modifique o cancele sus citas programadas.",
      action: "Revisar",
      icon: Search,
      next: "lookup" as Step,
      tone: "gray"
    },
    {
      title: "Registrar paciente",
      description: "Unase a nuestra red para acceder a todos nuestros servicios medicos.",
      action: "Registrarse",
      icon: UserPlus,
      next: "register" as Step,
      tone: "mint"
    }
  ];

  return (
    <div className="home-screen">
      <div className="hero-copy">
        <h1>Bienvenido a Clinica Belen</h1>
        <p>Gestione sus citas medicas de forma rapida y sencilla.</p>
      </div>
      <div className="action-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button className={`action-card ${card.tone}`} key={card.title} type="button" onClick={() => onNavigate(card.next)}>
              <span className="corner-shape" />
              <span className="card-icon">
                <Icon size={34} />
              </span>
              <strong>{card.title}</strong>
              <span>{card.description}</span>
              <span className="card-action">
                {card.action}
                <ArrowRight size={18} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IdentificationScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  return (
    <FormShell title="Identificacion del Paciente" subtitle="Ingrese sus datos para iniciar el agendamiento de una cita.">
      <label>
        Tipo de documento
        <select defaultValue="">
          <option disabled value="">
            Seleccione...
          </option>
          <option>Cedula de Ciudadania</option>
          <option>Cedula de Extranjeria</option>
          <option>Tarjeta de Identidad</option>
          <option>Pasaporte</option>
        </select>
      </label>
      <label>
        Numero de documento
        <input placeholder="Ingrese su numero de documento" />
      </label>
      <button className="primary-button" type="button" onClick={() => onNavigate("specialty")}>
        Continuar
        <ArrowRight size={20} />
      </button>
      <button className="text-button" type="button" onClick={() => onNavigate("register")}>
        Soy nuevo paciente, registrarme
      </button>
    </FormShell>
  );
}

function RegisterScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  return (
    <FormShell title="Registro de Nuevo Paciente" subtitle="Complete la informacion basica para crear su perfil.">
      <div className="form-grid">
        <label>
          Tipo de documento
          <select defaultValue="">
            <option disabled value="">
              Seleccione...
            </option>
            <option>DNI</option>
            <option>Pasaporte</option>
            <option>Carnet de Extranjeria</option>
          </select>
        </label>
        <label>
          Numero de documento
          <input placeholder="1020304050" />
        </label>
        <label>
          Nombres
          <input placeholder="Nombres" />
        </label>
        <label>
          Apellidos
          <input placeholder="Apellidos" />
        </label>
        <label>
          Fecha de nacimiento
          <input type="date" />
        </label>
        <label>
          Telefono
          <input placeholder="+57 300 000 0000" />
        </label>
      </div>
      <label>
        Correo electronico
        <input type="email" placeholder="paciente@correo.com" />
      </label>
      <button className="primary-button" type="button" onClick={() => onNavigate("specialty")}>
        Registrarme y continuar
        <ArrowRight size={20} />
      </button>
    </FormShell>
  );
}

function SpecialtyScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  return (
    <FlowShell title="Seleccione una Especialidad" onBack={() => onNavigate("identify")}>
      <div className="choice-grid">
        {specialties.map(({ name, icon: Icon }) => (
          <button className="choice-card" key={name} type="button" onClick={() => onNavigate("doctor")}>
            <span className="choice-icon">
              <Icon size={34} />
            </span>
            <strong>{name}</strong>
          </button>
        ))}
      </div>
    </FlowShell>
  );
}

function DoctorScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  return (
    <FlowShell title="Seleccione un Profesional" subtitle="Elija un profesional o permita que el sistema asigne la disponibilidad mas cercana." onBack={() => onNavigate("specialty")}>
      <div className="doctor-grid">
        {doctors.map(({ name, specialty, availability, icon: Icon }) => (
          <button className="doctor-card" key={name} type="button" onClick={() => onNavigate("schedule")}>
            <span className="doctor-avatar">
              <Icon size={30} />
            </span>
            <span>
              <strong>{name}</strong>
              <small>{specialty}</small>
              <small>{availability}</small>
            </span>
          </button>
        ))}
      </div>
    </FlowShell>
  );
}

function ScheduleScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  const days = ["", "", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "", ""];
  const disabled = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "19", "20", "26", "27"]);

  return (
    <FlowShell title="Seleccione Fecha y Hora" subtitle="Seleccione un dia disponible en el calendario y luego el horario." onBack={() => onNavigate("doctor")}>
      <div className="schedule-grid">
        <article className="panel-card">
          <div className="calendar-header">
            <button className="icon-button" type="button" aria-label="Mes anterior">
              <ChevronLeft size={22} />
            </button>
            <h2>Octubre 2026</h2>
            <button className="icon-button" type="button" aria-label="Mes siguiente">
              <ChevronRight size={22} />
            </button>
          </div>
          <div className="weekdays">
            {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((day, index) => (
              <button
                className={`date-button ${day === "" ? "empty" : ""} ${disabled.has(day) ? "disabled" : ""} ${day === "18" ? "selected" : ""}`}
                disabled={day === "" || disabled.has(day)}
                key={`${day}-${index}`}
                type="button"
              >
                {day}
              </button>
            ))}
          </div>
          <div className="legend">
            <span><i className="dot selected-dot" />Seleccionado</span>
            <span><i className="dot available-dot" />Disponible</span>
            <span><i className="dot unavailable-dot" />No disponible</span>
          </div>
        </article>
        <article className="panel-card">
          <h2 className="panel-title">
            Horarios Disponibles
            <small>Viernes, 18 de Octubre</small>
          </h2>
          {["Manana", "Tarde"].map((period) => (
            <div className="slot-section" key={period}>
              <h3>{period}</h3>
              <div className="slot-grid">
                {timeSlots
                  .filter((slot) => slot.period === period)
                  .map((slot) => (
                    <button className={`time-slot ${slot.selected ? "selected" : ""}`} disabled={slot.disabled} key={slot.label} type="button">
                      {slot.label}
                    </button>
                  ))}
              </div>
            </div>
          ))}
          <div className="selected-summary">
            <CheckCircle2 size={22} />
            Has seleccionado el <strong>18 de Octubre a las 10:00 a. m.</strong>
          </div>
        </article>
      </div>
      <div className="flow-actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate("doctor")}>
          Volver
        </button>
        <button className="primary-button compact" type="button" onClick={() => onNavigate("confirm")}>
          Continuar
        </button>
      </div>
    </FlowShell>
  );
}

function ConfirmScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  return (
    <FlowShell title="Confirmacion de su Cita" subtitle="Revise la informacion antes de confirmar el agendamiento." onBack={() => onNavigate("schedule")}>
      <AppointmentSummary />
      <div className="flow-actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate("schedule")}>
          Modificar
        </button>
        <button className="primary-button compact" type="button" onClick={() => onNavigate("scheduled")}>
          Confirmar cita
        </button>
      </div>
    </FlowShell>
  );
}

function ScheduledScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  return (
    <div className="success-screen">
      <CheckCircle2 size={78} />
      <h1>Tu cita fue agendada correctamente</h1>
      <AppointmentSummary />
      <button className="primary-button compact" type="button" onClick={() => onNavigate("home")}>
        Volver al inicio
      </button>
    </div>
  );
}

function LookupScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  return (
    <FormShell title="Consultar mis Citas" subtitle="Ingrese sus datos para consultar, modificar o cancelar sus citas programadas.">
      <label>
        Tipo de documento
        <select defaultValue="dni">
          <option value="dni">DNI - Documento Nacional de Identidad</option>
          <option value="nie">NIE - Numero de Identidad de Extranjero</option>
          <option value="pasaporte">Pasaporte</option>
        </select>
      </label>
      <label>
        Numero de documento
        <input placeholder="Ingrese su numero de documento" />
      </label>
      <button className="primary-button" type="button" onClick={() => onNavigate("detail")}>
        <FileSearch size={20} />
        Buscar cita
      </button>
    </FormShell>
  );
}

function DetailScreen({ onNavigate }: { onNavigate: (step: Step) => void }) {
  const [showCancel, setShowCancel] = React.useState(false);

  return (
    <FlowShell title="Detalle de su Cita" onBack={() => onNavigate("lookup")}>
      <AppointmentSummary />
      <div className="contact-strip">
        <span><MapPin size={18} />Sede principal, Fusagasuga</span>
        <span><Phone size={18} />+57 601 000 0000</span>
        <span><Mail size={18} />citas@clinicabelen.co</span>
      </div>
      <div className="flow-actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate("schedule")}>
          Reprogramar
        </button>
        <button className="danger-button" type="button" onClick={() => setShowCancel(true)}>
          Cancelar cita
        </button>
      </div>
      {showCancel ? (
        <div className="modal-backdrop">
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3>Esta seguro que desea cancelar esta cita?</h3>
            <p>La accion dejara libre el horario seleccionado.</p>
            <div className="flow-actions">
              <button className="secondary-button" type="button" onClick={() => setShowCancel(false)}>
                Conservar cita
              </button>
              <button className="danger-button" type="button" onClick={() => setShowCancel(false)}>
                Confirmar cancelacion
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </FlowShell>
  );
}

function FlowShell({
  title,
  subtitle,
  children,
  onBack
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <div className="flow-screen">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={20} />
        Volver
      </button>
      <div className="page-heading">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function FormShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="form-screen">
      <div className="form-card">
        <div className="form-icon">
          <IdCard size={32} />
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <form>{children}</form>
      </div>
    </div>
  );
}

function AppointmentSummary() {
  const rows = [
    ["Paciente", "Laura Martinez"],
    ["Especialidad", "Medicina General"],
    ["Profesional", "Dr. Juan Perez"],
    ["Fecha", "18 de Octubre de 2026"],
    ["Hora", "10:00 a. m."],
    ["Estado", "Confirmada"]
  ];

  return (
    <article className="summary-card">
      <div className="summary-header">
        <CalendarCheck size={30} />
        <div>
          <h2>Medicina General</h2>
          <p>Codigo de cita: BEL-2026-1018</p>
        </div>
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="summary-action">
        <Clock3 size={20} />
        Presentese 15 minutos antes de la hora programada.
      </div>
    </article>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <Logo />
      <nav aria-label="Legal">
        <a href="#">Politica de Privacidad</a>
        <a href="#">Terminos del Servicio</a>
        <a href="#">Derechos del Paciente</a>
        <a href="#">Contactar Soporte</a>
      </nav>
      <p>© 2026 Clinica Belen. Todos los derechos reservados.</p>
    </footer>
  );
}
