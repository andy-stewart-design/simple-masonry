import {
  useRef,
  useLayoutEffect,
  type ComponentProps,
  type CSSProperties,
} from "react";
import { resizeGridItem } from "../utils/resize-grid-item";

interface MasonryGridItemProps extends ComponentProps<"div"> {
  groupIndex: number;
  groupItemIndex: number;
}

function MasonryGridItem({
  children,
  groupIndex,
  groupItemIndex,
}: MasonryGridItemProps) {
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
      data-group-index={groupIndex}
      style={{ "--group-item-index": groupItemIndex } as CSSProperties}
    >
      <div>{children}</div>
    </div>
  );
}

export default MasonryGridItem;
