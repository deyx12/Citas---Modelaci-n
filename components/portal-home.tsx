"use client";
import { CalendarPlus, Search, UserPlus, ArrowRight } from "lucide-react";
import type { PortalStep } from "./patient-portal";
export default function HomeScreen({ onNavigate }: { onNavigate: (step: PortalStep) => void }) {
  const cards = [
    {
      title: "Agendar cita",
      description: "Programe una nueva consulta medica con nuestros especialistas.",
      action: "Comenzar",
      icon: CalendarPlus,
      next: "identify" as PortalStep,
      tone: "blue"
    },
    {
      title: "Consultar cita",
      description: "Verifique horarios, modifique o cancele sus citas programadas.",
      action: "Revisar",
      icon: Search,
      next: "lookup" as PortalStep,
      tone: "gray"
    },
    {
      title: "Registrar paciente",
      description: "Unase a nuestra red para acceder a todos nuestros servicios medicos.",
      action: "Registrarse",
      icon: UserPlus,
      next: "register" as PortalStep,
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

