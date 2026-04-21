export const chartWidth = 640;
export const chartHeight = 260;

export const buildScaler = (seriesA: number[], seriesB: number[]) => {
  const all = [...seriesA, ...seriesB];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const safeMin = Math.floor(min * 0.9);
  const safeMax = Math.ceil(max * 1.08);

  const yToPixel = (value: number) =>
    ((safeMax - value) / (safeMax - safeMin)) * chartHeight;

  return {
    minY: safeMin,
    maxY: safeMax,
    yToPixel,
  };
};

export const buildLinePath = (series: readonly number[], yToPixel: (value: number) => number) =>
  series
    .map((point, index) => {
      const x = (index / (series.length - 1)) * chartWidth;
      const y = yToPixel(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");