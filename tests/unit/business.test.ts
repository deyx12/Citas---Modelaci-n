import { describe, expect, it } from "vitest";
import { createAppointmentCode, isFutureAppointment } from "@/lib/business";

describe("createAppointmentCode", () => {
  it("formats clinic appointment codes", () => {
    expect(createAppointmentCode(new Date("2026-10-18T10:00:00"), 7)).toBe("BEL-20261018-007");
  });
});

describe("isFutureAppointment", () => {
  it("returns true when the appointment is after now", () => {
    expect(isFutureAppointment(new Date("2026-10-18T10:00:00"), new Date("2026-10-01T10:00:00"))).toBe(true);
  });
});
