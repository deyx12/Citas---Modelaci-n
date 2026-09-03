import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    data: [
      {
        code: "BEL-2026-1018",
        specialty: "Medicina General",
        doctor: "Dr. Juan Perez",
        date: "2026-10-18T10:00:00.000Z",
        status: "CONFIRMADA"
      }
    ]
  });
}
