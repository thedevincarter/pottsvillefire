import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin, displayName } from "@/lib/auth";
import {
  updateMaintenanceLog,
  deleteMaintenanceLog,
  getMaintenanceLogOwner,
} from "@/lib/maintenance";

function parseMileage(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Editing and deleting a log are limited to its submitter or an admin.
async function authorize(request: NextRequest, id: string) {
  const user = await getTokenUser(request);
  if (!user) return { error: "Unauthorized", status: 401 as const };

  const owner = await getMaintenanceLogOwner(id);
  if (owner === null) return { error: "Not found", status: 404 as const };

  if (!isAdmin(user) && owner !== displayName(user)) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { user };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const auth = await authorize(request, id);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { apparatusId, mileage, workDone } = body;
  if (!apparatusId || !workDone?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await updateMaintenanceLog(id, apparatusId, parseMileage(mileage), workDone.trim());
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await authorize(request, id);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await deleteMaintenanceLog(id);
  return NextResponse.json({ ok: true });
}
