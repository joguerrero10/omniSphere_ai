import { buildLinePath, buildScaler, chartHeight, chartWidth } from "../dashboard.utils";

type Props = {
  title: string;
  subtitle: string;
  labels: string[];
  initiatedSeries: number[];
  resolvedSeries: number[];
};

export default function LineChartPanel({
  title,
  subtitle,
  labels,
  initiatedSeries,
  resolvedSeries,
}: Props) {
  const { minY, maxY, yToPixel } = buildScaler(initiatedSeries, resolvedSeries);

  const yTicks = [
    minY,
    Math.round(minY + (maxY - minY) * 0.25),
    Math.round(minY + (maxY - minY) * 0.5),
    Math.round(minY + (maxY - minY) * 0.75),
    maxY,
  ];

  return (
    <article className="panel chart-panel">
      <div className="panel-header">
        <h3>{title}</h3>
        <small>{subtitle}</small>
      </div>

      <div className="legend">
        <span>
          <i className="dot initiated" /> Iniciadas
        </span>
        <span>
          <i className="dot resolved" /> Resueltas
        </span>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="line-chart"
        role="img"
        aria-label={`${title}: iniciadas y resueltas`}
      >
        {yTicks.map((tick) => {
          const y = yToPixel(tick);
          return (
            <g key={tick}>
              <line x1="0" y1={y} x2={chartWidth} y2={y} className="chart-grid" />
              <text x="4" y={y - 6} className="chart-y-label">
                {tick}
              </text>
            </g>
          );
        })}

        {labels.map((label, index) => {
          const x = (index / (labels.length - 1)) * chartWidth;
          return (
            <g key={label}>
              <line x1={x} y1="0" x2={x} y2={chartHeight} className="chart-grid subtle" />
              <text x={x} y={chartHeight - 8} className="chart-x-label">
                {label}
              </text>
            </g>
          );
        })}

        <path d={buildLinePath(initiatedSeries, yToPixel)} className="series initiated" />
        <path d={buildLinePath(resolvedSeries, yToPixel)} className="series resolved" />
      </svg>
    </article>
  );
}