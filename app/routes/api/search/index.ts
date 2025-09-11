import { searchByText } from "~/utils/search";
import type { Route } from "./+types";

async function handleSearch(query: string, page = 0) {
  const productResults = await searchByText(query, 30, page);

  if (!productResults.success) {
    console.error(productResults.error);
    return { query, page, items: null };
  }

  return { query, page, items: productResults.data };
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { query } = params;
  const page = parseInt(
    new URL(request.url).searchParams.get("page") ?? "0",
    10
  );

  const data = await handleSearch(query, page);

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export type SearchApiData = Awaited<ReturnType<typeof handleSearch>>;
