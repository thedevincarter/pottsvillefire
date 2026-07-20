import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, displayName } from "@/lib/auth";
import { createMaintenanceLog } from "@/lib/maintenance";

function parseMileage(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { apparatusId, mileage, workDone } = await request.json();
  if (!apparatusId || !workDone?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const id = await createMaintenanceLog(
    apparatusId,
    parseMileage(mileage),
    workDone.trim(),
    displayName(user)
  );
  return NextResponse.json({ id });
}
