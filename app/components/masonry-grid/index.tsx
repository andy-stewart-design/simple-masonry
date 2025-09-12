import { useRef, useState, type ComponentProps } from "react";
import MasonryGridItem from "../masonry-grid-item";
import { getSrcFromNodes, groupItems } from "../utils/get-src-from-node";
import "./style.css";

const gridAutoRows = 2;

interface MasonryGridProps extends ComponentProps<"div"> {
  animateFirstGroup?: boolean;
  // reduceMotion?: boolean;
}

function MasonryGrid({ children, animateFirstGroup }: MasonryGridProps) {
  const prevItemCount = useRef(0);
  const groupSizes = useRef<number[]>([]);
  const [gridItems, setGridItems] = useState<[string, React.ReactNode][][]>([]);

  const items = Array.from(new Map(getSrcFromNodes(children)));

  if (items.length > prevItemCount.current) {
    const test = groupItems(items, groupSizes.current);
    setGridItems(test.result);
    groupSizes.current = test.groupSizes;
    prevItemCount.current = items.length;
  }

  return (
    <div
      className="masonry-grid"
      style={{ gridAutoRows }}
      data-animate-first-group={animateFirstGroup}
    >
      {gridItems.map((items, i) => (
        <MasonryGridGroup key={i} group={items} />
      ))}
    </div>
  );
}

function MasonryGridGroup({ group }: { group: [string, React.ReactNode][] }) {
  return group.map(([id, node], i) => (
    <MasonryGridItem key={id} groupIndex={i} groupItemIndex={i}>
      {node}
    </MasonryGridItem>
  ));
}

export default MasonryGrid;
