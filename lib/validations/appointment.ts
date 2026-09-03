import { z } from "zod";

export const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  specialtyId: z.string().uuid(),
  doctorId: z.string().uuid().optional(),
  startsAt: z.coerce.date(),
  notes: z.string().max(500).optional()
});
