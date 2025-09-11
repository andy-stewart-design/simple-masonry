import type { ComponentProps } from "react";

interface MGImageProps extends ComponentProps<"img"> {}

function MasonryGridImage(props: MGImageProps) {
  return (
    <div className="mg-image-wrapper">
      <img {...props} className="mg-image" />
    </div>
  );
}

export default MasonryGridImage;
