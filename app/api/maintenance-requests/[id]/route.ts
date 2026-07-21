import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin, displayName } from "@/lib/auth";
import {
  updateRequest,
  updateRequestStatus,
  deleteRequest,
  getRequestOwner,
  isRequestStatus,
} from "@/lib/maintenance-requests";
import { STATIONS } from "@/lib/stations";
import { errorMessage } from "@/lib/errors";

// PATCH handles two edits:
//  - { status }: resolve/reopen the request — admins only.
//  - { apparatusId|station, description }: edit content — submitter or admin.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Status change — admins only.
  if ("status" in body) {
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!isRequestStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    try {
      await updateRequestStatus(id, body.status, displayName(user));
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("Failed to update request status:", e);
      return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
    }
  }

  // Content edit — submitter or admin.
  const owner = await getRequestOwner(id);
  if (owner === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isAdmin(user) && owner !== displayName(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { apparatusId, station, description } = body;
  if (!description?.trim()) {
    return NextResponse.json({ error: "A description is required" }, { status: 400 });
  }
  if (!apparatusId === !station) {
    return NextResponse.json(
      { error: "Provide either an apparatus or a station" },
      { status: 400 }
    );
  }
  if (station && !STATIONS.some((s) => s.value === station)) {
    return NextResponse.json({ error: "Unknown station" }, { status: 400 });
  }

  try {
    await updateRequest(id, {
      apparatusId: apparatusId || undefined,
      station: station || undefined,
      description: description.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to update request:", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

// The submitter or an admin can delete a request.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const owner = await getRequestOwner(id);
  if (owner === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isAdmin(user) && owner !== displayName(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await deleteRequest(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to delete request:", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}
