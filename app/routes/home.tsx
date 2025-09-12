import { useEffect, useRef, useState } from "react";
import { Form } from "react-router";
import { searchByText } from "~/utils/search";
import MasonryGrid from "~/components/masonry-grid";
import MasonryGridImage from "~/components/masonry-grid-image";
import type { Route } from "./+types/home";
import type { SearchApiData } from "./api/search";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Simple Masonry" },
    { name: "description", content: "Simple Masonry" },
  ];
}

async function handleSearch(query: string) {
  const productResults = await searchByText(query, 30, 0);

  if (!productResults.success) {
    console.error(productResults.error);
    return null;
  }

  return productResults.data;
}

export async function loader() {
  const data = await handleSearch("vuori");
  return { data, term: "vuori" };
}

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();
  let term = formData.get("title")?.toString();

  if (!term) return;
  const data = await handleSearch(term);
  return { data, term };
}

type GridItems = Awaited<ReturnType<typeof handleSearch>>;

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState(actionData?.term ?? loaderData.term);
  const [page, setPage] = useState(0);
  const [gridItems, setGridItems] = useState<GridItems>(loaderData.data);
  // const [animateFirstLoad, setAnimateFirstLoad] = useState(false);

  async function loadMore() {
    const res = await fetch(`/api/search/${term}?page=${page + 1}`);
    const { items }: SearchApiData = await res.json();
    setPage(page + 1);
    setGridItems((c) => (c && items ? [...c, ...items] : c));
  }

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    timeoutId = setTimeout(() => setLoading(false), 2000);
    return () => timeoutId && clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (term === actionData?.term) return;

    if (actionData?.data) {
      // setAnimateFirstLoad(true);
      setGridItems(actionData.data);
      setTerm(actionData.term);
    }
  }, [term, actionData]);

  if (loading) return <p>Loading...</p>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr)",
        gap: "2rem",
        padding: "2rem",
      }}
    >
      <div>
        <Form ref={formRef} method="post">
          <input type="text" name="title" defaultValue={loaderData.term} />
          <button type="submit">Submit</button>
        </Form>
      </div>
      {gridItems && (
        <MasonryGrid>
          {gridItems.map((item) => (
            <div key={item.itemId} className="mg-card">
              <MasonryGridImage src={item.image?.imageUrl} />
              <p className="mg-title">{item.title}</p>
              <p className="mg-price">
                {item.price.value.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </p>
            </div>
          ))}
        </MasonryGrid>
      )}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button onClick={loadMore}>Load more</button>
      </div>
    </div>
  );
}
