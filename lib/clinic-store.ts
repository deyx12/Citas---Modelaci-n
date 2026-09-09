import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import type postgres from "postgres";
import { doctors, hours, validSlot, type Patient, type Appointment } from "./clinic";
import { database, table } from "./clinic-db";

export class ClinicError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
type PatientRow = Patient & { password: string };
type Query = postgres.Sql | postgres.TransactionSql;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
function publicPatient(row: PatientRow | undefined): Patient | null {
  if (!row) return null;
  const { password: _, ...patient } = row;
  return patient;
}
function uniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function register(input: Omit<Patient, "id"> & { password: string }) {
  const sql = database();
  const salt = randomBytes(16).toString("hex");
  const row = { ...input, id: randomUUID(), documentNumber: input.documentNumber.toUpperCase(), password: `${salt}:${scryptSync(input.password, salt, 64).toString("hex")}` };
  try {
    const [patient] = await sql<PatientRow[]>`INSERT INTO ${sql(table("patients"))} ${sql(row)} RETURNING *`;
    return publicPatient(patient)!;
  } catch (error) {
    if (uniqueViolation(error)) throw new ClinicError("El documento ya está registrado. Inicie sesión.", 409);
    throw error;
  }
}

export async function login(input: { documentType: string; documentNumber: string; password: string }) {
  const sql = database();
  const key = digest(`${input.documentType}:${input.documentNumber.toUpperCase()}`);
  // Commit failed attempts before reporting an error. Serialize per identity across instances.
  const outcome = await sql.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
    const [attempt] = await tx`SELECT * FROM ${tx(table("attempts"))} WHERE key = ${key}`;
    if (attempt && Number(attempt.expires) > Date.now() && Number(attempt.count) >= 10) return { status: 429 as const };
    const [row] = await tx<PatientRow[]>`SELECT * FROM ${tx(table("patients"))} WHERE "documentType" = ${input.documentType} AND "documentNumber" = ${input.documentNumber.toUpperCase()}`;
    const [salt, hash] = row ? row.password.split(":") : ["invalid", "00".repeat(64)];
    if (!timingSafeEqual(scryptSync(input.password, salt, 64), Buffer.from(hash, "hex")) || !row) {
      const now = Date.now();
      await tx`INSERT INTO ${tx(table("attempts"))} AS a (key, count, expires) VALUES (${key}, 1, ${now + 900000})
        ON CONFLICT (key) DO UPDATE SET count = CASE WHEN a.expires <= ${now} THEN 1 ELSE a.count + 1 END,
        expires = CASE WHEN a.expires <= ${now} THEN EXCLUDED.expires ELSE a.expires END`;
      return { status: 401 as const };
    }
    await tx`DELETE FROM ${tx(table("attempts"))} WHERE key = ${key}`;
    return { status: 200 as const, patient: publicPatient(row)! };
  });
  if (outcome.status === 429) throw new ClinicError("Demasiados intentos. Espere 15 minutos.", 429);
  if (outcome.status === 401) throw new ClinicError("Documento o contraseña incorrectos.", 401);
  return outcome.patient;
}

export async function session(patientId: string) {
  const sql = database(), token = randomBytes(32).toString("hex");
  await sql`DELETE FROM ${sql(table("sessions"))} WHERE expires <= ${Date.now()}`;
  await sql`INSERT INTO ${sql(table("sessions"))} (token, "patientId", expires) VALUES (${digest(token)}, ${patientId}, ${Date.now() + 8 * 3600000})`;
  return token;
}
export async function currentPatient(token: string) {
  if (!token) return null;
  const sql = database();
  const [row] = await sql<PatientRow[]>`SELECT p.* FROM ${sql(table("patients"))} p JOIN ${sql(table("sessions"))} s ON p.id = s."patientId" WHERE s.token = ${digest(token)} AND s.expires > ${Date.now()}`;
  return publicPatient(row);
}
export async function logout(token: string) {
  if (!token) return;
  const sql = database();
  await sql`DELETE FROM ${sql(table("sessions"))} WHERE token = ${digest(token)}`;
}
export async function appointments(patientId: string) {
  const sql = database();
  return await sql<Appointment[]>`SELECT * FROM ${sql(table("appointments"))} WHERE "patientId" = ${patientId} ORDER BY date DESC, time DESC`;
}
async function availableSlots(sql: Query, patientId: string, specialty: string, doctorId: string, date: string, exclude = "") {
  const candidates = doctors.filter(d => d.specialty === specialty && (!doctorId || d.id === doctorId));
  const booked = await sql<Appointment[]>`SELECT * FROM ${sql(table("appointments"))} WHERE date = ${date} AND status != 'CANCELADA' AND id::text != ${exclude}`;
  return hours.map(time => {
    const doctor = validSlot(date, time) && !booked.some(a => a.patientId === patientId && a.time === time) ? candidates.find(d => !booked.some(a => a.doctorId === d.id && a.time === time)) : undefined;
    return { time, available: Boolean(doctor), doctorId: doctor?.id || null };
  });
}
export async function availability(patientId: string, specialty: string, doctorId: string, date: string, exclude = "") {
  return availableSlots(database(), patientId, specialty, doctorId, date, exclude);
}
export async function saveAppointment(patientId: string, input: { specialty: string; doctorId: string; date: string; time: string; id?: string }) {
  const sql = database();
  try {
    return await sql.begin(async tx => {
      // Serialize bookings per patient and specialty so concurrent requests cannot
      // create two active appointments for the same kind of care.
      await tx`SELECT pg_advisory_xact_lock(hashtextextended(${`clinic-specialty:${patientId}:${input.specialty}`}, 0))`;
      await tx`SELECT pg_advisory_xact_lock(hashtextextended(${`clinic-slot:${input.date}:${input.time}`}, 0))`;
      if (input.id) await mutableAppointment(tx, patientId, input.id);
      const active = await tx<Appointment[]>`SELECT * FROM ${tx(table("appointments"))}
        WHERE "patientId" = ${patientId}
          AND specialty = ${input.specialty}
          AND status != 'CANCELADA'
          AND id::text != ${input.id || ""}`;
      if (active.some(appointment => new Date(`${appointment.date}T${appointment.time}:00-05:00`).getTime() > Date.now())) {
        throw new ClinicError(`Ya tiene una cita activa de ${input.specialty}. Debe cancelarla o asistir antes de agendar otra.`, 409);
      }
      const slot = (await availableSlots(tx, patientId, input.specialty, input.doctorId, input.date, input.id)).find(s => s.time === input.time && s.available);
      if (!slot?.doctorId) throw new ClinicError("El horario ya no está disponible. Seleccione otro.", 409);
      if (input.id) {
        const [row] = await tx<Appointment[]>`UPDATE ${tx(table("appointments"))} SET "doctorId" = ${slot.doctorId}, specialty = ${input.specialty}, date = ${input.date}, time = ${input.time}, status = 'PENDIENTE' WHERE id = ${input.id} AND "patientId" = ${patientId} RETURNING *`;
        return row;
      }
      const row: Appointment = { id: randomUUID(), code: `BEL-${randomBytes(6).toString("hex").toUpperCase()}`, patientId, specialty: input.specialty, doctorId: slot.doctorId, date: input.date, time: input.time, status: "PENDIENTE" };
      const [saved] = await tx<Appointment[]>`INSERT INTO ${tx(table("appointments"))} ${tx(row)} RETURNING *`;
      return saved;
    });
  } catch (error) {
    if (uniqueViolation(error)) throw new ClinicError("El horario ya no está disponible. Seleccione otro.", 409);
    throw error;
  }
}
async function mutableAppointment(sql: Query, patientId: string, id: string) {
  const [appointment] = await sql<Appointment[]>`SELECT * FROM ${sql(table("appointments"))} WHERE id = ${id} AND "patientId" = ${patientId} FOR UPDATE`;
  if (!appointment) throw new ClinicError("No se encontró la cita.", 404);
  if (appointment.status === "CANCELADA" || new Date(`${appointment.date}T${appointment.time}:00-05:00`).getTime() <= Date.now()) throw new ClinicError("Solo puede modificar citas futuras activas.", 409);
  return appointment;
}
export async function changeStatus(patientId: string, id: string, status: "CONFIRMADA" | "CANCELADA") {
  return await database().begin(async tx => {
    await mutableAppointment(tx, patientId, id);
    const [row] = await tx<Appointment[]>`UPDATE ${tx(table("appointments"))} SET status = ${status} WHERE id = ${id} AND "patientId" = ${patientId} RETURNING *`;
    return row;
  });
}
