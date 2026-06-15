"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function AffiliateTracker() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    if (!ref) return;

    const upper = ref.toUpperCase();

    // Persist in localStorage for registration flow
    try {
      localStorage.setItem("affiliate_ref", upper);
    } catch { /* ignore */ }

    // Record click asynchronously
    fetch(`${BASE}/api/track/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        affiliateCode: upper,
        utmSource: searchParams.get("utm_source") ?? undefined,
        utmMedium: searchParams.get("utm_medium") ?? undefined,
        utmCampaign: searchParams.get("utm_campaign") ?? undefined,
        utmContent: searchParams.get("utm_content") ?? undefined,
        referer: typeof document !== "undefined" ? document.referrer : undefined,
      }),
    }).catch(() => { /* ignore tracking errors */ });
  }, [ref, searchParams]);

  return null;
}
