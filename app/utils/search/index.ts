import { EbayItemSchema, EbayTextSearchResults } from "~/utils/validate";
import { getQuery } from "./query";
import type z from "zod";

type EbayItem = z.infer<typeof EbayItemSchema>;

type SearchByTextResult =
  | { success: true; data: EbayItem[] }
  | { success: false; error: string };

const { DT_GATEWAY_URL, DT_GATEWAY_API_KEY } = process.env;

if (!DT_GATEWAY_URL || !DT_GATEWAY_API_KEY) {
  throw new Error(
    "Could not find required env vars: DT_GATEWAY_URL, DT_GATEWAY_API_KEY"
  );
}

async function searchByText(
  queryString: string,
  limit = 30,
  offset = 0
): Promise<SearchByTextResult> {
  const response = await fetch(DT_GATEWAY_URL ?? "", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${DT_GATEWAY_API_KEY}`,
    },
    body: JSON.stringify({ query: getQuery(queryString, limit, offset) }),
  });

  if (!response) {
    const error = "Network error while calling DT_GATEWAY";
    return { success: false, error } as const;
  }

  if (!response.ok) {
    const error = `DT_GATEWAY returned status ${response.status}`;
    return { success: false, error } as const;
  }

  const data = await response.json().catch(() => null);
  if (!data) {
    return { success: false, error: "Failed to parse JSON response" } as const;
  }

  const parsedData = EbayTextSearchResults.safeParse(data);

  if (!parsedData.success) {
    const error = `Invalid response schema: ${parsedData.error.message}`;
    return { success: false, error } as const;
  }

  return {
    success: true,
    data: parsedData.data.data.itemsBySearch.items ?? [],
  } as const;
}

export { searchByText };
