import { NextRequest, NextResponse } from "next/server";

const GHL_TOKEN = "pit-fde7a892-d292-4304-8a9d-a9ffe205ec78";
const GHL_LOCATION_ID = "nBYJTjYbHTIsJGiqT0W4";
const GHL_API_BASE = "https://services.leadconnectorhq.com";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  try {
    const res = await fetch(
      `${GHL_API_BASE}/social-media-posting/oauth/${GHL_LOCATION_ID}/start?platform=${platform}&reconnect=false`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "2021-07-28",
        },
        redirect: "manual",
      }
    );

    const location = res.headers.get("location");
    if (location) {
      return NextResponse.json({ url: location });
    }

    if (res.ok) {
      const body = await res.json().catch(() => null);
      const url = body?.url || body?.redirectUrl || body?.oauthUrl;
      if (url) return NextResponse.json({ url });
    }

    return NextResponse.json(
      { error: `No OAuth URL returned (status ${res.status})` },
      { status: 502 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
