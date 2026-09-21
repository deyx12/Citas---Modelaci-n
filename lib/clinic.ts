import { z } from "zod";

export const documentTypes = { CC: "Cédula de Ciudadanía", CE: "Cédula de Extranjería", TI: "Tarjeta de Identidad", PASAPORTE: "Pasaporte" };
const identityFields = z.object({
  documentType: z.enum(["CC", "CE", "TI", "PASAPORTE"]),
  documentNumber: z.string().trim().min(4, "El número de documento debe tener entre 4 y 20 caracteres.").max(20, "El número de documento debe tener entre 4 y 20 caracteres."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(128)
});
function validateDocument(data: z.infer<typeof identityFields>, context: z.RefinementCtx) {
  const valid = data.documentType === "PASAPORTE" ? /^[a-zA-Z0-9]+$/.test(data.documentNumber) : /^\d+$/.test(data.documentNumber);
  if (!valid) context.addIssue({ code: z.ZodIssueCode.custom, path: ["documentNumber"], message: data.documentType === "PASAPORTE" ? "El pasaporte solo puede contener letras y números." : "El número de documento solo puede contener números." });
}
export const identitySchema = identityFields.superRefine(validateDocument);
export function clinicDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export const registrationSchema = identityFields.extend({
  firstName: z.string().trim().min(2, "Ingrese sus nombres.").max(80).regex(/^[\p{L} ]+$/u, "Los nombres solo pueden contener letras y espacios."),
  lastName: z.string().trim().min(2, "Ingrese sus apellidos.").max(80).regex(/^[\p{L} ]+$/u, "Los apellidos solo pueden contener letras y espacios."),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ingrese su fecha de nacimiento.").refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v && v <= clinicDate() && v >= "1900-01-01", "La fecha de nacimiento no es válida."),
  phone: z.string().trim().regex(/^\d{10}$/, "El celular debe tener exactamente 10 dígitos."),
  email: z.string().trim().email("Ingrese un correo válido.").max(160)
}).superRefine(validateDocument);
export const specialties = ["Medicina General", "Pediatría", "Cardiología", "Dermatología", "Odontología"];
export const doctors = [
  { id: "general-1", name: "Dr. Juan Pérez", specialty: specialties[0] },
  { id: "general-2", name: "Dra. María García", specialty: specialties[0] },
  { id: "pediatria-1", name: "Dra. Ana López", specialty: specialties[1] },
  { id: "cardiologia-1", name: "Dr. Roberto Gómez", specialty: specialties[2] },
  { id: "dermatologia-1", name: "Dra. Paula Rodríguez", specialty: specialties[3] },
  { id: "odontologia-1", name: "Dr. Carlos Ruiz", specialty: specialties[4] }
];
export const weekdayHours = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
export const saturdayHours = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"];
export const hours = [...new Set([...weekdayHours, ...saturdayHours])];
export const bookingSchema = z.object({
  specialty: z.string().refine(value => specialties.includes(value), "Seleccione una especialidad válida."),
  doctorId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccione una fecha válida."),
  time: z.string().refine(value => hours.includes(value), "Seleccione un horario válido."),
  id: z.string().uuid().optional()
});
export function validSlot(date: string, time: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !hours.includes(time)) return false;
  const day = new Date(`${date}T12:00:00-05:00`);
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date || day.getUTCDay() === 0) return false;
  if (!(day.getUTCDay() === 6 ? saturdayHours : weekdayHours).includes(time)) return false;
  const startsAt = new Date(`${date}T${time}:00-05:00`).getTime();
  return startsAt > now.getTime() && startsAt <= now.getTime() + 180 * 86400000;
}
export function hoursForDate(date: string) {
  const day = new Date(`${date}T12:00:00-05:00`);
  return day.getUTCDay() === 6 ? saturdayHours : weekdayHours;
}
export type Patient = { id: string; documentType: string; documentNumber: string; firstName: string; lastName: string; birthDate: string; phone: string; email: string };
export type Appointment = { id: string; code: string; patientId: string; specialty: string; doctorId: string; date: string; time: string; status: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" };
export type Slot = { time: string; available: boolean; doctorId: string | null };
