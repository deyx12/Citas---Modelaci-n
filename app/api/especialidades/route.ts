import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    data: ["Medicina General", "Pediatria", "Cardiologia", "Dermatologia", "Odontologia"]
  });
}
