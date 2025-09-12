import {
  useCallback,
  useEffect,
  useRef,
  useState,
  Children,
  type ComponentProps,
  type CSSProperties,
} from "react";
import { getSrcFromNodes } from "~/utils/get-src-from-node";
import "./style.css";

function MasonryGrid({ children }: ComponentProps<"div">) {
  const gridRef = useRef<HTMLDivElement>(null);
  const groupSize = useRef(Children.toArray(children).length);
  const items = getSrcFromNodes(children);

  const resizeGridItem = useCallback((item: HTMLElement) => {
    const grid = gridRef.current;
    if (!grid) return;

    const rowHeight = parseInt(
      window.getComputedStyle(grid).getPropertyValue("grid-auto-rows")
    );
    const rowSpan = Math.ceil(
      item.firstElementChild!.getBoundingClientRect().height / rowHeight
    );
    item.style.gridRowEnd = "span " + rowSpan;
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    function resizeAllGridItems() {
      document.querySelectorAll<HTMLElement>(".grid-item").forEach((item) => {
        resizeGridItem(item);
      });
    }

    const observer = new ResizeObserver(() => resizeAllGridItems());
    observer.observe(grid);
    resizeAllGridItems();

    return () => {
      observer.unobserve(grid);
      observer.disconnect;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    document.querySelectorAll<HTMLElement>(".grid-item").forEach((item) => {
      item
        .querySelector<HTMLImageElement>("img")
        ?.addEventListener("load", () => resizeGridItem(item), {
          signal,
        });
    });

    return () => controller.abort();
  }, [children]);

  if (!Array.isArray(children)) return null;

  return (
    <div ref={gridRef} className="masonry-grid">
      {Array.from(new Map(items)).map(([id, node], i) => (
        <MasonryGridItem
          key={id}
          gridIndex={i}
          groupIndex={i % groupSize.current}
        >
          {node}
        </MasonryGridItem>
      ))}
    </div>
  );
}

function MasonryGridItem({
  children,
  gridIndex,
  groupIndex,
}: ComponentProps<"div"> & { gridIndex: number; groupIndex: number }) {
  const [rowSpan, setRowSpan] = useState<number | undefined>(undefined);
  const itemRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={itemRef}
      className="grid-item"
      style={
        {
          "--grid-index": gridIndex,
          "--group-index": groupIndex,
          "--row-span": rowSpan,
        } as CSSProperties
      }
    >
      <div>{children}</div>
    </div>
  );
}

export default MasonryGrid;
