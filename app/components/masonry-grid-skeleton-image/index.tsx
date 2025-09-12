import { useState } from "react";
import { getAspectRatio } from "../utils/get-aspect-ratio";

function MasonryGridSkeletonImage() {
  const [aspect] = useState(getAspectRatio(Math.random(), Math.random()));

  return (
    <div className="mg-image-wrapper mg-skeleton-image-wrapper">
      <img
        width={aspect.width}
        height={aspect.height}
        className="mg-image"
        aria-hidden
      />
    </div>
  );
}

export default MasonryGridSkeletonImage;
