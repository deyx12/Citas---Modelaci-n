import { z } from "zod";

export const patientSchema = z.object({
  documentType: z.enum(["CC", "CE", "TI", "PASAPORTE", "DNI"]),
  documentNumber: z.string().min(4),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  birthDate: z.coerce.date().optional(),
  phone: z.string().min(7).optional(),
  email: z.string().email().optional()
});
