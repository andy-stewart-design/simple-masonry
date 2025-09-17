const aspectRatios = ["9/16", "3/4", "1/1", "4/3", "16/9"] as const;

const width = 800;

function getAspectRatio(_width: number, _height: number) {
  const originalRatio = _width / _height;
  let height: number;

  switch (true) {
    case originalRatio < 0.66:
      height = (width / 9) * 16;
      return { width, height, ratio: "9/16" };
    case originalRatio < 0.875:
      height = (width / 3) * 4;
      return { width, height, ratio: "3/4" };
    case originalRatio < 1.125:
      height = width;
      return { width, height, ratio: "1/1" };
    case originalRatio < 1.66:
      height = (width / 4) * 3;
      return { width, height, ratio: "4/3" };
    default:
      height = (width / 16) * 9;
      return { width, height, ratio: "16/9" };
  }
}

export { getAspectRatio, aspectRatios };
