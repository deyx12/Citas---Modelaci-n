import { doctors } from "@/lib/clinic";
export function GET() { return Response.json({ data: doctors }); }
