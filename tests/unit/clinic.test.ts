import { describe, expect, it } from "vitest";
import { registrationSchema, validSlot } from "@/lib/clinic";

const patient = { documentType: "CC", documentNumber: "1020304050", password: "PruebaSegura123", firstName: "Ana", lastName: "Gómez", birthDate: "1990-05-20", phone: "+57 3001234567", email: "ana@example.com" };
describe("validaciones del paciente", () => {
  it("acepta datos completos", () => expect(registrationSchema.safeParse(patient).success).toBe(true));
  it.each([
    { firstName: "  " }, { lastName: " " }, { documentNumber: "123" }, { documentNumber: "12<>56" },
    { birthDate: "2025-02-30" }, { birthDate: "2099-01-01" }, { birthDate: "" },
    { phone: "-------" }, { phone: "abc1234" }, { email: "invalido" }, { password: "123" }
  ])("rechaza datos inválidos %j", value => expect(registrationSchema.safeParse({ ...patient, ...value }).success).toBe(false));
});
describe("agenda en hora de Colombia", () => {
  const now = new Date("2026-09-08T13:15:00Z");
  it("acepta el siguiente horario del día", () => expect(validSlot("2026-09-08", "08:30", now)).toBe(true));
  it.each([["2026-09-12", "10:00"], ["2026-09-12", "13:30"]])("acepta el sábado %s a las %s", (date, time) => expect(validSlot(date, time, now)).toBe(true));
  it.each([["2026-09-08", "08:00"], ["2026-09-12", "14:00"], ["2026-09-13", "10:00"], ["2026-09-09", "12:00"], ["2026-09-31", "10:00"], ["2027-09-09", "10:00"], ["invalid", "10:00"]])("rechaza %s %s", (date, time) => expect(validSlot(date, time, now)).toBe(false));
});
