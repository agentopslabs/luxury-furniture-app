import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { gitSync } from "@/lib/git-sync";

const PROFILE_PATH = join(process.cwd(), "data", "profile.json");

const DEFAULT_PROFILE = {
  firstName: "Bharath",
  lastName: "J",
  email: "bharathsathyasaijanga@gmail.com",
  phone: "7670845590",
  password: "password123",
};

function readProfile() {
  try {
    if (!existsSync(PROFILE_PATH)) return DEFAULT_PROFILE;
    return JSON.parse(readFileSync(PROFILE_PATH, "utf-8"));
  } catch {
    return DEFAULT_PROFILE;
  }
}

function writeProfile(data: typeof DEFAULT_PROFILE) {
  writeFileSync(PROFILE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const profile = readProfile();
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readProfile();
    const updated = {
      firstName: (body.firstName ?? current.firstName).trim(),
      lastName: (body.lastName ?? current.lastName).trim(),
      email: (body.email ?? current.email).trim(),
      phone: (body.phone ?? current.phone).trim(),
      password: body.password ?? current.password,
    };
    writeProfile(updated);

    const fullName = `${updated.firstName} ${updated.lastName}`.trim();
    gitSync(`Update profile: ${fullName}`, ["data/profile.json"]);

    return NextResponse.json({ success: true, profile: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save profile" }, { status: 500 });
  }
}
