import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { identitySchema, registrationSchema, bookingSchema, specialties, doctors } from "@/lib/clinic";
import * as store from "@/lib/clinic-store";

export const runtime = "nodejs";
const cookie = "clinic_session";
function result(data: unknown) { return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } }); }
function error(e: unknown) {
  if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues.map(i => i.message).join(" "), fields: e.flatten().fieldErrors }, { status: 400 });
  if (e instanceof store.ClinicError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof SyntaxError) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  console.error("Portal:", e);
  return NextResponse.json({ error: "No se pudo guardar la información. Intente nuevamente." }, { status: 500 });
}
export async function GET(request: NextRequest) {
  try {
    const patient = await store.currentPatient(request.cookies.get(cookie)?.value || "");
    if (request.nextUrl.searchParams.get("action") === "availability") {
      if (!patient) throw new store.ClinicError("Inicie sesión para ver la agenda.", 401);
      const p = request.nextUrl.searchParams;
      return result(await store.availability(patient.id, p.get("specialty") || "", p.get("doctorId") || "", p.get("date") || "", p.get("exclude") || ""));
    }
    return result({ patient, appointments: patient ? await store.appointments(patient.id) : [], specialties, doctors });
  } catch (e) { return error(e); }
}
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || !/^https?:\/\//.test(origin) || new URL(origin).host !== request.headers.get("host")) throw new store.ClinicError("Origen de solicitud inválido.", 403);
    const body = z.object({ action: z.enum(["register", "login", "logout", "book", "confirm", "cancel"]) }).passthrough().parse(await request.json());
    if (body.action === "register" || body.action === "login") {
      const patient = body.action === "register" ? await store.register(registrationSchema.parse(body)) : await store.login(identitySchema.parse(body));
      const response = result(patient);
      await store.logout(request.cookies.get(cookie)?.value || "");
      response.cookies.set(cookie, await store.session(patient.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600 });
      return response;
    }
    const token = request.cookies.get(cookie)?.value || "";
    const patient = await store.currentPatient(token);
    if (!patient) throw new store.ClinicError("Su sesión terminó. Inicie sesión nuevamente.", 401);
    if (body.action === "logout") { await store.logout(token); const response = result(null); response.cookies.delete(cookie); return response; }
    if (body.action === "book") {
      const input = bookingSchema.parse(body);
      return result(await store.saveAppointment(patient.id, input));
    }
    const input = z.object({ id: z.string().uuid(), action: z.enum(["confirm", "cancel"]) }).parse(body);
    return result(await store.changeStatus(patient.id, input.id, input.action === "confirm" ? "CONFIRMADA" : "CANCELADA"));
  } catch (e) { return error(e); }
}
