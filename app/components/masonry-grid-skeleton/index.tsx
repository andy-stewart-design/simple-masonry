import {
  useRef,
  useLayoutEffect,
  type ComponentProps,
  type CSSProperties,
} from "react";
import { resizeGridItem } from "../utils/resize-grid-item";
import "./style.css";
import MasonryGridSkeletonImage from "../masonry-grid-skeleton-image";

const gridAutoRows = 2;

function MasonryGridSkeleton() {
  const itemCount = 20;

  return (
    <div className="masonry-grid" style={{ gridAutoRows }}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <MasonryGridItem key={i} groupIndex={i}>
          <MasonryGridSkeletonImage />
        </MasonryGridItem>
      ))}
    </div>
  );
}

function MasonryGridItem({
  children,
  groupIndex,
}: ComponentProps<"div"> & {
  groupIndex: number;
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
      style={{ "--group-index": groupIndex } as CSSProperties}
    >
      <div>{children}</div>
    </div>
  );
}

export default MasonryGridSkeleton;
