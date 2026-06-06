import { NextResponse } from "next/server";

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const CACHE_TTL = 6 * 60 * 60; // 6 hours

export async function GET() {
  if (!NEWSAPI_KEY) {
    return NextResponse.json({ articles: [] });
  }

  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set(
      "q",
      "emagrecimento OR \"saúde natural\" OR suplementos OR \"bem-estar\" OR diabetes OR colesterol"
    );
    url.searchParams.set("language", "pt");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "12");
    url.searchParams.set("apiKey", NEWSAPI_KEY);

    const res = await fetch(url.toString(), {
      next: { revalidate: CACHE_TTL },
    });

    if (!res.ok) {
      return NextResponse.json({ articles: [] });
    }

    const data = await res.json();

    const articles = (data.articles ?? [])
      .filter(
        (a: { title?: string; urlToImage?: string }) =>
          a.title && a.title !== "[Removed]" && a.urlToImage
      )
      .slice(0, 9);

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
