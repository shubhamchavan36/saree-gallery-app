import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { ensureAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const unauthorized = await ensureAdminSession();
        if (unauthorized) {
          throw new Error("Unauthorized");
        }

        return {
          allowedContentTypes: ["image/*"],
          addRandomSuffix: true,
          maximumSizeInBytes: 1024 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // no-op: final URLs are submitted with the form payload
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Error handling client blob upload:", error);
    return NextResponse.json(
      { message: "Failed to upload image." },
      { status: 400 }
    );
  }
}
