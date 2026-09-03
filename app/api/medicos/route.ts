import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    data: [
      { name: "Dr. Juan Perez", specialty: "Medicina General" },
      { name: "Dra. Maria Garcia", specialty: "Medicina Interna" },
      { name: "Dr. Roberto Gomez", specialty: "Cardiologia" }
    ]
  });
}
