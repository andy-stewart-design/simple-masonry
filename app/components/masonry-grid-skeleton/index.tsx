import MasonryGridSkeletonImage from "../masonry-grid-skeleton-image";
import MasonryGridItem from "../masonry-grid-item";
import "../masonry-grid/style.css";

const gridAutoRows = 2;

function MasonryGridSkeleton({ itemCount = 20 }: { itemCount?: number }) {
  return (
    <div className="masonry-grid" style={{ gridAutoRows }}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <MasonryGridItem key={i} groupIndex={i} groupItemIndex={i}>
          <MasonryGridSkeletonImage />
        </MasonryGridItem>
      ))}
    </div>
  );
}

export default MasonryGridSkeleton;
