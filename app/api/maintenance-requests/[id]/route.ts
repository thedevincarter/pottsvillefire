import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin, displayName } from "@/lib/auth";
import {
  updateRequestStatus,
  deleteRequest,
  getRequestOwner,
  isRequestStatus,
} from "@/lib/maintenance-requests";
import { errorMessage } from "@/lib/errors";

// Only admins resolve requests (set status).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await request.json();
  if (!isRequestStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    await updateRequestStatus(id, status, displayName(user));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to update request status:", e);
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
