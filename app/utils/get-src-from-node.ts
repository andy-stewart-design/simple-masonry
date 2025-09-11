import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

interface ElementWithSrcAndChildren {
  src?: string;
  children?: ReactNode;
}

/** Type guard to check if props have children */
function hasChildren(props: unknown): props is { children: ReactNode } {
  return typeof props === "object" && props !== null && "children" in props;
}

/** Decide if an element should be treated like an image */
function isImageElement(
  el: ReactElement<any>
): el is ReactElement<ElementWithSrcAndChildren> {
  // Literal <img>
  if (typeof el.type === "string" && el.type === "img") return true;
  // Heuristic: has a string `src` prop
  if (typeof el.props?.src === "string" && el.props.src.length > 0) return true;

  return false;
}

function extractSrc(el: ReactElement<ElementWithSrcAndChildren>) {
  const val = el.props.src;
  return typeof val === "string" && val ? val : null;
}

function findImageSrc(node: ReactNode): string | null {
  // Use a manual loop so we can early-return
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) continue;

    if (isImageElement(child)) {
      const src = extractSrc(child);
      if (src) return src;
    }

    if (hasChildren(child.props)) {
      const nested = findImageSrc(child.props.children);
      if (nested) return nested;
    }
  }
  return null;
}

export function getSrcFromNodes(children: ReactNode) {
  return Children.toArray(children).reduce<[string, ReactNode][]>(
    (acc, child) => {
      const src = findImageSrc(child);
      if (src) acc.push([src, child]);
      return acc;
    },
    []
  );
}
