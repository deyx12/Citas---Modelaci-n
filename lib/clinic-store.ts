import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { doctors, hours, validSlot, type Patient, type Appointment } from "./clinic";

const path = resolve(/* turbopackIgnore: true */ process.env.CLINIC_DB_PATH || "data/clinic.sqlite");
mkdirSync(dirname(path), { recursive: true });
const db = new DatabaseSync(path);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, documentType TEXT NOT NULL, documentNumber TEXT NOT NULL, firstName TEXT NOT NULL, lastName TEXT NOT NULL, birthDate TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, password TEXT NOT NULL, UNIQUE(documentType, documentNumber));
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, patientId TEXT NOT NULL REFERENCES patients(id), expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS appointments (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, patientId TEXT NOT NULL REFERENCES patients(id), specialty TEXT NOT NULL, doctorId TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, status TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS doctor_slot ON appointments(doctorId, date, time) WHERE status != 'CANCELADA';
CREATE UNIQUE INDEX IF NOT EXISTS patient_slot ON appointments(patientId, date, time) WHERE status != 'CANCELADA';
CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);`);
export class ClinicError extends Error { constructor(message: string, public status = 400) { super(message); } }
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
function publicPatient(row: Record<string, unknown> | undefined): Patient | null {
  if (!row) return null;
  const { password: _, ...patient } = row;
  return patient as Patient;
}
export function register(input: Omit<Patient, "id"> & { password: string }) {
  const id = randomUUID(), salt = randomBytes(16).toString("hex");
  const password = `${salt}:${scryptSync(input.password, salt, 64).toString("hex")}`;
  try { db.prepare("INSERT INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, input.documentType, input.documentNumber.toUpperCase(), input.firstName, input.lastName, input.birthDate, input.phone, input.email, password); }
  catch (e) { if (String(e).includes("UNIQUE")) throw new ClinicError("El documento ya está registrado. Inicie sesión.", 409); throw e; }
  return publicPatient(db.prepare("SELECT * FROM patients WHERE id = ?").get(id))!;
}
export function login(input: { documentType: string; documentNumber: string; password: string }) {
  const key = digest(`${input.documentType}:${input.documentNumber.toUpperCase()}`);
  const attempt = db.prepare("SELECT * FROM attempts WHERE key = ?").get(key);
  if (attempt && Number(attempt.expires) > Date.now() && Number(attempt.count) >= 10) throw new ClinicError("Demasiados intentos. Espere 15 minutos.", 429);
  const row = db.prepare("SELECT * FROM patients WHERE documentType = ? AND documentNumber = ?").get(input.documentType, input.documentNumber.toUpperCase());
  const [salt, hash] = row ? String(row.password).split(":") : ["invalid", "00".repeat(64)];
  if (!timingSafeEqual(scryptSync(input.password, salt, 64), Buffer.from(hash, "hex")) || !row) {
    db.prepare("INSERT INTO attempts VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN expires < ? THEN 1 ELSE count + 1 END, expires = CASE WHEN expires < ? THEN excluded.expires ELSE expires END").run(key, Date.now() + 900000, Date.now(), Date.now());
    throw new ClinicError("Documento o contraseña incorrectos.", 401);
  }
  db.prepare("DELETE FROM attempts WHERE key = ?").run(key);
  return publicPatient(row)!;
}
export function session(patientId: string) {
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES (?, ?, ?)").run(digest(token), patientId, Date.now() + 8 * 3600000);
  return token;
}
export function currentPatient(token: string) {
  return publicPatient(db.prepare("SELECT patients.* FROM patients JOIN sessions ON patients.id = sessions.patientId WHERE token = ? AND expires > ?").get(digest(token), Date.now()));
}
export function logout(token: string) { db.prepare("DELETE FROM sessions WHERE token = ?").run(digest(token)); }
export function appointments(patientId: string) { return db.prepare("SELECT * FROM appointments WHERE patientId = ? ORDER BY date DESC, time DESC").all(patientId) as Appointment[]; }
export function availability(patientId: string, specialty: string, doctorId: string, date: string, exclude = "") {
  const candidates = doctors.filter(d => d.specialty === specialty && (!doctorId || d.id === doctorId));
  const booked = db.prepare("SELECT * FROM appointments WHERE date = ? AND status != 'CANCELADA' AND id != ?").all(date, exclude) as Appointment[];
  return hours.map(time => {
    const doctor = validSlot(date, time) && !booked.some(a => a.patientId === patientId && a.time === time) ? candidates.find(d => !booked.some(a => a.doctorId === d.id && a.time === time)) : undefined;
    return { time, available: Boolean(doctor), doctorId: doctor?.id || null };
  });
}
export function saveAppointment(patientId: string, input: { specialty: string; doctorId: string; date: string; time: string; id?: string }) {
  db.exec("BEGIN IMMEDIATE");
  try {
    if (input.id) mutableAppointment(patientId, input.id);
    const slot = availability(patientId, input.specialty, input.doctorId, input.date, input.id).find(s => s.time === input.time && s.available);
    if (!slot) throw new ClinicError("El horario ya no está disponible. Seleccione otro.", 409);
    const id = input.id || randomUUID();
    if (input.id) db.prepare("UPDATE appointments SET doctorId = ?, specialty = ?, date = ?, time = ?, status = 'PENDIENTE' WHERE id = ?").run(slot.doctorId, input.specialty, input.date, input.time, id);
    else db.prepare("INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')").run(id, `BEL-${randomBytes(6).toString("hex").toUpperCase()}`, patientId, input.specialty, slot.doctorId, input.date, input.time);
    db.exec("COMMIT");
    return appointments(patientId).find(a => a.id === id)!;
  } catch (e) { db.exec("ROLLBACK"); throw e; }
}
function mutableAppointment(patientId: string, id: string) {
  const appointment = appointments(patientId).find(a => a.id === id);
  if (!appointment) throw new ClinicError("No se encontró la cita.", 404);
  if (appointment.status === "CANCELADA" || new Date(`${appointment.date}T${appointment.time}:00-05:00`).getTime() <= Date.now()) throw new ClinicError("Solo puede modificar citas futuras activas.", 409);
  return appointment;
}
export function changeStatus(patientId: string, id: string, status: "CONFIRMADA" | "CANCELADA") {
  db.exec("BEGIN IMMEDIATE");
  try { mutableAppointment(patientId, id); db.prepare("UPDATE appointments SET status = ? WHERE id = ? AND patientId = ?").run(status, id, patientId); db.exec("COMMIT"); }
  catch (e) { db.exec("ROLLBACK"); throw e; }
  return appointments(patientId).find(a => a.id === id)!;
}
