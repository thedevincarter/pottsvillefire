import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin, isOfficer, displayName } from "@/lib/auth";
import {
  updateRequest,
  updateRequestStatus,
  updateRequestAssignment,
  deleteRequest,
  getRequestOwner,
  isRequestStatus,
} from "@/lib/maintenance-requests";
import { STATIONS } from "@/lib/stations";
import { isRosterName } from "@/lib/runs";
import { errorMessage } from "@/lib/errors";

// PATCH handles three edits:
//  - { status }: resolve/reopen the request — officers and admins.
//  - { assignedTo }: hand the request to a member — officers and admins.
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

  // Status change — officers and admins.
  if ("status" in body) {
    if (!isOfficer(user)) {
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

  // Assignment change — officers and admins.
  if ("assignedTo" in body) {
    if (!isOfficer(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const assignedTo =
      typeof body.assignedTo === "string" && body.assignedTo.trim()
        ? body.assignedTo.trim()
        : null;
    if (assignedTo && !(await isRosterName(assignedTo))) {
      return NextResponse.json({ error: "Unknown member" }, { status: 400 });
    }
    try {
      await updateRequestAssignment(id, assignedTo);
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("Failed to update request assignment:", e);
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
