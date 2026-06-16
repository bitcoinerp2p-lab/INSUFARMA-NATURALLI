"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

export default function AffiliateTracker() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    // Persist UTM params so checkout can attach them to the order
    for (const key of UTM_KEYS) {
      const val = searchParams.get(key);
      if (val) {
        try { localStorage.setItem(key, val); } catch { /* ignore */ }
      }
    }

    if (!ref) return;

    const upper = ref.toUpperCase();

    try { localStorage.setItem("affiliate_ref", upper); } catch { /* ignore */ }

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
