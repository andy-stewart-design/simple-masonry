import {
  useCallback,
  useRef,
  Children,
  useLayoutEffect,
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

  if (!Array.isArray(children)) return null;

  return (
    <div ref={gridRef} className="masonry-grid">
      {Array.from(new Map(items)).map(([id, node], i) => (
        <MasonryGridItem
          key={id}
          gridIndex={i}
          groupIndex={i % groupSize.current}
          resizeGridItem={resizeGridItem}
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
  resizeGridItem,
}: ComponentProps<"div"> & {
  gridIndex: number;
  groupIndex: number;
  resizeGridItem(item: HTMLElement): void;
}) {
  const itemRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const item = itemRef.current;
    const image = item?.querySelector("img");
    const target = item?.firstElementChild;
    if (!item || !image || !target) return;

    const observer = new ResizeObserver(() => resizeGridItem(item));
    observer.observe(target);
    resizeGridItem(item);

    const onLoad = () => resizeGridItem(item);

    if (image.complete) {
      image
        .decode?.()
        .catch(() => {})
        .finally(() => resizeGridItem(item));
    } else {
      const onLoad = () => resizeGridItem(item);
      image.addEventListener("load", onLoad);
    }

    return () => {
      observer.unobserve(target);
      observer.disconnect();
      image.removeEventListener("load", onLoad);
    };
  }, [resizeGridItem]);

  return (
    <div
      ref={itemRef}
      className="grid-item"
      style={
        {
          "--grid-index": gridIndex,
          "--group-index": groupIndex,
        } as CSSProperties
      }
    >
      <div>{children}</div>
    </div>
  );
}

export default MasonryGrid;
