import { NextRequest, NextResponse } from "next/server";
import { createChallenge } from "@/lib/queries";
import { CreateChallengeRequest, ApiResponse, Challenge } from "@/lib/types";
import { getTodayJakarta } from "@/lib/date-utils";
import { DEFAULT_CHALLENGE_DURATION } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body: CreateChallengeRequest = await request.json();

    // Validation
    if (
      !body.participant_1_name?.trim() ||
      !body.participant_2_name?.trim() ||
      !body.start_date ||
      !body.secret_key?.trim()
    ) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    if (body.secret_key.length < 4) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Secret key minimal 4 karakter" },
        { status: 400 }
      );
    }

    // Validate duration
    const durationDays = body.duration_days ?? DEFAULT_CHALLENGE_DURATION;
    if (durationDays < 1 || durationDays > 365) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Durasi harus antara 1-365 hari" },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.start_date)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }

    // Validate start date is not in the past
    const today = getTodayJakarta();
    if (body.start_date < today) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Tanggal mulai tidak boleh di masa lalu" },
        { status: 400 }
      );
    }

    const challenge = await createChallenge({
      participant_1_name: body.participant_1_name.trim(),
      participant_2_name: body.participant_2_name.trim(),
      start_date: body.start_date,
      secret_key: body.secret_key.trim(),
      duration_days: durationDays,
    });

    return NextResponse.json<ApiResponse<Challenge>>(
      { success: true, data: challenge },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create challenge error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Gagal membuat challenge" },
      { status: 500 }
    );
  }
}
