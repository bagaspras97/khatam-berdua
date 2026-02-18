import { NextRequest, NextResponse } from "next/server";
import { getChallengeWithProgress, validateSecretKey } from "@/lib/queries";
import { ApiResponse, ChallengeWithProgress } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  try {
    const { challengeId } = await params;
    const secretKey = request.nextUrl.searchParams.get("key");

    if (!secretKey) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Secret key diperlukan" },
        { status: 401 }
      );
    }

    const isValid = await validateSecretKey(challengeId, secretKey);
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Challenge tidak ditemukan atau secret key salah" },
        { status: 403 }
      );
    }

    const challenge = await getChallengeWithProgress(challengeId);
    if (!challenge) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Challenge tidak ditemukan" },
        { status: 404 }
      );
    }

    // Remove secret_key from response
    const { secret_key: _, ...safeChallenge } = challenge;

    return NextResponse.json<ApiResponse<Omit<ChallengeWithProgress, "secret_key">>>(
      { success: true, data: safeChallenge },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get challenge error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Gagal mengambil data challenge" },
      { status: 500 }
    );
  }
}
