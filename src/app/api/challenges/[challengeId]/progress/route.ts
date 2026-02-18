import { NextRequest, NextResponse } from "next/server";
import { validateSecretKey, upsertProgress, getProgressByDate } from "@/lib/queries";
import { ApiResponse, DailyProgress } from "@/lib/types";
import { detectOverlappingPages, formatMissingRanges } from "@/lib/gap-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;
    const body = await request.json();

    const { secret_key, participant_number, date, from_page, to_page, is_makeup, notes, actual_reader_number } = body;

    // Validation
    if (!secret_key) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Secret key diperlukan" },
        { status: 401 }
      );
    }

    if (!participant_number || ![1, 2].includes(participant_number)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Participant number harus 1 atau 2" },
        { status: 400 }
      );
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }

    if (
      from_page === undefined ||
      to_page === undefined ||
      from_page < 1 ||
      to_page < 1 ||
      from_page > 604 ||
      to_page > 604 ||
      to_page < from_page
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Range halaman tidak valid (1-604, to_page >= from_page)",
        },
        { status: 400 }
      );
    }

    // Auth check
    const isValid = await validateSecretKey(challengeId, secret_key);
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Secret key salah" },
        { status: 403 }
      );
    }

    // Check for overlapping pages (unless it's a makeup reading)
    if (!is_makeup) {
      const existingProgress = await getProgressByDate(challengeId, date);
      
      // Find existing entry for same participant to exclude from overlap check
      const sameParticipantEntry = existingProgress.find(
        (entry) => entry.participant_number === participant_number
      );
      
      const overlaps = detectOverlappingPages(
        from_page,
        to_page,
        existingProgress,
        sameParticipantEntry?.id // Exclude same participant's entry
      );

      if (overlaps.length > 0) {
        const overlapDetails = overlaps
          .map((o) => {
            const participant = o.participantNumber === 1 ? "Pembaca 1" : "Pembaca 2";
            return `${participant}: halaman ${formatMissingRanges([{ from: o.from, to: o.to }])}`;
          })
          .join(", ");

        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Halaman sudah dibaca sebelumnya! ${overlapDetails}`,
          },
          { status: 400 }
        );
      }
    }

    const progress = await upsertProgress({
      challengeId,
      participantNumber: participant_number,
      date,
      fromPage: from_page,
      toPage: to_page,
      isMakeup: is_makeup ?? false,
      notes,
      actualReaderNumber: actual_reader_number ?? participant_number,
    });

    return NextResponse.json<ApiResponse<DailyProgress>>(
      { success: true, data: progress },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update progress error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Gagal menyimpan progress" },
      { status: 500 }
    );
  }
}
