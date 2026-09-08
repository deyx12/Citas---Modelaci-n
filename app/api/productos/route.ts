import { specialties } from "@/lib/clinic";
export function GET() { return Response.json({ data: specialties }); }
