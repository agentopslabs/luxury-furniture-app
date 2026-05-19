import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = "/tmp/ghl_uploads";

const MIME_EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const mime = file.type || "application/octet-stream";
    const ext = MIME_EXT_MAP[mime] || file.name.split(".").pop() || "bin";
    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    await writeFile(filepath, buffer);

    const host = request.headers.get("host") || "";
    const proto = host.includes("replit.dev") || host.includes("replit.app") ? "https" : "http";
    const baseUrl = `${proto}://${host}`;

    return NextResponse.json({
      url: `${baseUrl}/api/media/${filename}`,
      filename,
      mime,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
