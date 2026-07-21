import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin, displayName } from "@/lib/auth";
import {
  updateStationLog,
  deleteStationLog,
  getStationLogOwner,
} from "@/lib/station-maintenance";
import { STATIONS } from "@/lib/stations";
import { errorMessage } from "@/lib/errors";

// Editing and deleting a log are limited to its submitter or an admin.
async function authorize(request: NextRequest, id: string) {
  const user = await getTokenUser(request);
  if (!user) return { error: "Unauthorized", status: 401 as const };

  const owner = await getStationLogOwner(id);
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
  const { station, workDone } = await request.json();

  const auth = await authorize(request, id);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!station || !workDone?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!STATIONS.some((s) => s.value === station)) {
    return NextResponse.json({ error: "Unknown station" }, { status: 400 });
  }

  try {
    await updateStationLog(id, station, workDone.trim());
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to update station log:", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
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

  try {
    await deleteStationLog(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to delete station log:", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}
