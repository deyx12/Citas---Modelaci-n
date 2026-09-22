import { describe, expect, it } from "vitest";
import { identitySchema, registrationSchema, validSlot } from "@/lib/clinic";

const patient = { documentType: "CC", documentNumber: "1020304050", password: "PruebaSegura123", firstName: "Ana María", lastName: "Gómez López", birthDate: "1990-05-20", phone: "3001234567", email: "ana@example.com" };
describe("validaciones del paciente", () => {
  it("acepta datos completos", () => expect(registrationSchema.safeParse(patient).success).toBe(true));
  it.each(["1234", "123456789", "1234567890"])("acepta documentos numéricos entre 4 y 10 dígitos: %s", documentNumber => expect(identitySchema.safeParse({ documentType: "CC", documentNumber, password: "PruebaSegura123" }).success).toBe(true));
  it("acepta letras y números en el pasaporte", () => expect(identitySchema.safeParse({ documentType: "PASAPORTE", documentNumber: "AB123456", password: "PruebaSegura123" }).success).toBe(true));
  it("acepta un pasaporte de 12 caracteres", () => expect(identitySchema.safeParse({ documentType: "PASAPORTE", documentNumber: "AB1234567890", password: "PruebaSegura123" }).success).toBe(true));
  it.each([
    { firstName: "  " }, { firstName: "Ana2" }, { firstName: "Ana Maria Fernanda Isabel" }, { lastName: " " }, { lastName: "Gómez3" }, { lastName: "Gomez Rodriguez Martinez" }, { documentNumber: "123" }, { documentNumber: "12345678901" }, { documentNumber: "ABC1234567" }, { documentNumber: "12<>567890" },
    { birthDate: "2025-02-30" }, { birthDate: "2099-01-01" }, { birthDate: "" },
    { phone: "300123456" }, { phone: "30012345678" }, { phone: "300 1234567" }, { phone: "abcdefghij" }, { email: "invalido" }, { email: "correo-demasiado-largo-para-el-limite@example.com" }, { password: "123" }, { password: "1234567890123456" }
  ])("rechaza datos inválidos %j", value => expect(registrationSchema.safeParse({ ...patient, ...value }).success).toBe(false));
  it("rechaza pasaportes de más de 12 caracteres", () => expect(identitySchema.safeParse({ documentType: "PASAPORTE", documentNumber: "AB12345678901", password: "PruebaSegura123" }).success).toBe(false));
  it("rechaza DNI", () => expect(identitySchema.safeParse({ documentType: "DNI", documentNumber: "12345678", password: "PruebaSegura123" }).success).toBe(false));
});
describe("agenda en hora de Colombia", () => {
  const now = new Date("2026-09-08T13:15:00Z");
  it("acepta el siguiente horario del día", () => expect(validSlot("2026-09-08", "08:30", now)).toBe(true));
  it.each([["2026-09-12", "10:00"], ["2026-09-12", "13:30"]])("acepta el sábado %s a las %s", (date, time) => expect(validSlot(date, time, now)).toBe(true));
  it.each([["2026-09-08", "08:00"], ["2026-09-12", "14:00"], ["2026-09-13", "10:00"], ["2026-09-09", "12:00"], ["2026-09-31", "10:00"], ["2027-09-09", "10:00"], ["invalid", "10:00"]])("rechaza %s %s", (date, time) => expect(validSlot(date, time, now)).toBe(false));
});
