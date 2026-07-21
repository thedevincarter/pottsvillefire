import { NextRequest, NextResponse } from "next/server";
import { getTokenUser, displayName } from "@/lib/auth";
import { createApparatusRequest, createStationRequest } from "@/lib/maintenance-requests";
import { STATIONS } from "@/lib/stations";
import { errorMessage } from "@/lib/errors";

export async function POST(request: NextRequest) {
  const user = await getTokenUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { apparatusId, station, description } = await request.json();
  if (!description?.trim()) {
    return NextResponse.json({ error: "A description is required" }, { status: 400 });
  }
  // Exactly one target.
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
    const id = station
      ? await createStationRequest(station, description.trim(), displayName(user))
      : await createApparatusRequest(apparatusId, description.trim(), displayName(user));
    return NextResponse.json({ id });
  } catch (e) {
    console.error("Failed to create maintenance request:", e);
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}
