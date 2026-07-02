import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const page = Number(url.searchParams.get("page") || "1");
  const perPage = Math.min(30, Number(url.searchParams.get("per_page") || "15"));
  const orientation = url.searchParams.get("orientation") || "landscape";

  const key = process.env.PEXELS_API_KEY;
  if (!key) return NextResponse.json({ error: "PEXELS_API_KEY not set" }, { status: 500 });

  const endpoint = q
    ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}&orientation=${encodeURIComponent(orientation)}`
    : `https://api.pexels.com/v1/curated?per_page=${perPage}&page=${page}`;

  const r = await fetch(endpoint, { headers: { Authorization: key }, cache: "no-store" });
  if (!r.ok) {
    const text = await r.text();
    return NextResponse.json({ error: `Pexels error ${r.status}: ${text}` }, { status: 502 });
  }
  const data = await r.json();
  // Trim payload to fields the editor needs
  const photos = (data.photos || []).map((p: any) => ({
    id: p.id,
    width: p.width,
    height: p.height,
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
    alt: p.alt,
    src: {
      original: p.src?.original,
      large2x: p.src?.large2x,
      large: p.src?.large,
      medium: p.src?.medium,
      tiny: p.src?.tiny,
    },
    pageUrl: p.url,
  }));
  return NextResponse.json({ photos, page: data.page, totalResults: data.total_results });
}
