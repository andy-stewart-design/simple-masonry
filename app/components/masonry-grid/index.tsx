import { useRef, type ComponentProps, type CSSProperties } from "react";
import { getSrcFromNodes } from "~/utils/get-src-from-node";
import "./style.css";

function MasonryGrid({ children }: ComponentProps<"div">) {
  if (!Array.isArray(children)) return null;

  const groupSize = useRef(children.length);
  const items = getSrcFromNodes(children);

  return (
    <div className="masonry-grid">
      {Array.from(new Map(items)).map(([id, node], i) => (
        <div
          key={id}
          className="grid-item"
          style={
            {
              "--grid-index": i,
              "--group-index": i % groupSize.current,
            } as CSSProperties
          }
        >
          {node}
        </div>
      ))}
    </div>
  );
}

export default MasonryGrid;
