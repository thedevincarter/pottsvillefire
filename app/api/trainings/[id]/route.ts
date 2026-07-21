import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, isAdmin } from "@/lib/auth";
import { updateTraining, deleteTraining, type TrainingInput } from "@/lib/trainings";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data: TrainingInput = await request.json();
  try {
    await updateTraining(id, data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to update training:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update training" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getTokenUser(request);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await deleteTraining(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to delete training:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete training" },
      { status: 500 }
    );
  }
}
