import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Children,
  type ComponentProps,
  type CSSProperties,
} from "react";
import { LoadingProvider, useLoadingContext } from "./loading-provider";
import { getAspectRatio } from "../utils/get-aspect-ratio";
import { resizeGridItem } from "../utils/resize-grid-item";
import "./style.css";

const ROW_HEIGHT = 2;

// -----------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------

type ThemeOption = "light" | "dark" | "system";

interface BaseProps {
  children: React.ReactNode;
  style?: CSSProperties;
  className?: string;
}

interface MasonryTitleProps extends BaseProps {
  as?: "h1" | "h2" | "h3" | "h4";
}

interface MasonryHeaderLinkProps extends BaseProps {
  href?: string;
  onClick?: () => void;
}

interface MasonryRootProps extends BaseProps {
  loading?: boolean;
  theme?: ThemeOption;
}

interface MasonryGridProps extends ComponentProps<"div"> {
  animateFirstGroup?: boolean;
  // reduceMotion?: boolean;
  // focusIndicatorLabel?: string;
}

interface MasonryGridGroupProps {
  group: React.ReactNode[];
  groupIndex: number;
}

interface MasonryGridItemProps extends BaseProps {
  groupIndex: number;
  groupItemIndex: number;
}

interface MasonryGridImageProps extends ComponentProps<"img"> {}

interface MasonryGridLoadMoreProps extends BaseProps {
  onClick: () => void;
}

// -----------------------------------------------------------------
// MASONRY GRID COMPONENTS
// -----------------------------------------------------------------

function MasonryGridRoot(props: MasonryRootProps) {
  return (
    <LoadingProvider loading={props.loading}>
      <div
        className={cn("masonry-grid-root", props.className)}
        style={props.style}
        data-theme={props.theme}
      >
        {props.children}
      </div>
    </LoadingProvider>
  );
}

function MasonryGridHeader({ children, className, style }: BaseProps) {
  return (
    <header className={cn("masonry-grid-header", className)} style={style}>
      {children}
    </header>
  );
}

function MasonryGridTitle(props: MasonryTitleProps) {
  const Tag = props.as || "h3";

  return (
    <Tag
      className={cn("masonry-grid-title", props.className)}
      style={props.style}
    >
      {props.children}
    </Tag>
  );
}

function MasonryGridHeaderLink(props: MasonryHeaderLinkProps) {
  const Tag = props.href ? "a" : "button";

  return (
    <Tag
      className={cn("masonry-grid-btn-text", props.className)}
      href={props.href}
      target={props.href ? "_blank" : undefined}
      onClick={props.onClick}
    >
      {props.children}
    </Tag>
  );
}

function MasonryGridFilterBar({ children, className, style }: BaseProps) {
  return (
    <div className={cn("masonry-grid-filter-bar", className)} style={style}>
      {children}
    </div>
  );
}

function MasonryGrid({ children, animateFirstGroup }: MasonryGridProps) {
  const { setLoading } = useLoadingContext();
  const groupSizes = useRef<number[]>([]);

  const groupedItems = useMemo(() => {
    const childArray = Children.toArray(children);
    const prevItemCount = groupSizes.current.reduce((acc, num) => acc + num, 0);

    if (childArray.length > prevItemCount) {
      groupSizes.current.push(childArray.length - prevItemCount);
    }

    setLoading(false);
    return groupItems(childArray, groupSizes.current);
  }, [children]);

  return (
    <div
      className="masonry-grid"
      style={{ gridAutoRows: ROW_HEIGHT }}
      data-animate-first-group={animateFirstGroup}
    >
      {groupedItems.map((items, i) => (
        <MasonryGridGroup key={i} group={items} groupIndex={i} />
      ))}
    </div>
  );
}

function MasonryGridGroup({ group, groupIndex }: MasonryGridGroupProps) {
  return group.map((node, i) => (
    <MasonryGridItem key={i} groupIndex={groupIndex} groupItemIndex={i}>
      {node}
    </MasonryGridItem>
  ));
}

function MasonryGridItem(props: MasonryGridItemProps) {
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
  }, []);

  return (
    <div
      ref={itemRef}
      className="masonry-grid-item"
      data-group-index={props.groupIndex}
      style={{ "--group-item-index": props.groupItemIndex } as CSSProperties}
    >
      <div>{props.children}</div>
    </div>
  );
}

function MasonryGridImage(props: MasonryGridImageProps) {
  return (
    <div className="masonry-grid-image-wrapper">
      <img {...props} alt="" />
    </div>
  );
}

function MasonryGridLoadMore({
  children,
  onClick,
  className,
}: MasonryGridLoadMoreProps) {
  const { loading, setLoading } = useLoadingContext();

  function handleLoadMore() {
    setLoading(true);
    onClick();
  }

  return (
    <div className={cn("masonry-grid-footer", className)}>
      <button
        // priority="tertiary"
        // size="large"
        onClick={handleLoadMore}
        // bodyState={loading ? "loading" : "none"}
        // disabled={loading}
        // fluid
        disabled={loading}
        style={{ maxWidth: "240px" }}
      >
        {loading ? "Loading..." : children}
      </button>
    </div>
  );
}

// -----------------------------------------------------------------
// MASONRY SKELETON COMPONENTS
// -----------------------------------------------------------------

function MasonryGridSkeleton({ itemCount = 20 }: { itemCount?: number }) {
  return (
    <div className="masonry-grid" style={{ gridAutoRows: ROW_HEIGHT }}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <MasonryGridItem key={i} groupIndex={i} groupItemIndex={i}>
          <MasonryGridSkeletonImage />
        </MasonryGridItem>
      ))}
    </div>
  );
}

function MasonryGridSkeletonImage() {
  const [aspect] = useState(getAspectRatio(Math.random(), Math.random()));

  return (
    <div className="masonry-grid-image-wrapper masonry-grid-skeleton-image-wrapper">
      <img width={aspect.width} height={aspect.height} alt="" aria-hidden />
    </div>
  );
}

// -----------------------------------------------------------------
// HELPER UTILITIES
// -----------------------------------------------------------------

function cn(...classNames: (string | undefined)[]) {
  return classNames.join(" ").trim();
}

export function groupItems<T>(items: T[], groupSizes: number[]) {
  const prevItemCount = groupSizes.reduce((acc, num) => acc + num, 0);
  const nextGroupSizes = [...groupSizes, items.length - prevItemCount];

  const result: T[][] = [];
  let index = 0;

  for (const len of nextGroupSizes) {
    result.push(items.slice(index, index + len));
    index += len;
  }

  return result;
}

// -----------------------------------------------------------------
// EXPORTS
// -----------------------------------------------------------------

const EvoMasonry = {
  Root: MasonryGridRoot,
  Header: MasonryGridHeader,
  Title: MasonryGridTitle,
  HeaderLink: MasonryGridHeaderLink,
  FilterBar: MasonryGridFilterBar,
  Items: MasonryGrid,
  Image: MasonryGridImage,
  LoadMore: MasonryGridLoadMore,
};

export default EvoMasonry;
