import { registrationSchema } from "@/lib/clinic";
export const patientSchema = registrationSchema.omit({ password: true });
