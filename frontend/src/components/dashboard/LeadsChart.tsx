const labels = ["03", "04", "11", "12", "14", "15", "16", "17", "18", "19", "20", "21", "22"];

const initiatedSeries = [460, 510, 490, 530, 600, 580, 560, 620, 700, 660, 730, 480, 390];
const completedSeries = [420, 460, 450, 500, 560, 540, 530, 580, 650, 630, 680, 440, 370];

const minY = 300;
const maxY = 740;
const chartHeight = 360;
const chartWidth = 900;

const yToPixel = (value: number) => ((maxY - value) / (maxY - minY)) * chartHeight;

const buildLinePath = (series: number[]) =>
  series
    .map((point, index) => {
      const x = (index / (series.length - 1)) * chartWidth;
      const y = yToPixel(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

const buildAreaPath = (series: number[]) => {
  const linePath = buildLinePath(series);
  return `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
};

export default function LeadsChart() {
  const areaPath = buildAreaPath(initiatedSeries);
  const initiatedPath = buildLinePath(initiatedSeries);
  const completedPath = buildLinePath(completedSeries);

  return (
    <section className="leads-chart-card" aria-label="Resumen de leads">
      <div className="chart-wrapper">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Leads iniciadas y resueltas por día">
          <defs>
            <linearGradient id="initiatedArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(134, 119, 255, 0.65)" />
              <stop offset="100%" stopColor="rgba(89, 154, 255, 0.45)" />
            </linearGradient>
          </defs>

          {[300, 400, 500, 600, 700].map((tick) => {
            const y = yToPixel(tick);
            return (
              <g key={tick}>
                <line className="grid-line" x1="0" y1={y} x2={chartWidth} y2={y} />
                <text className="axis-text" x="8" y={y - 8}>
                  {tick}
                </text>
              </g>
            );
          })}

          {labels.map((label, index) => {
            const x = (index / (labels.length - 1)) * chartWidth;
            return (
              <g key={label}>
                <line className="grid-line" x1={x} y1="0" x2={x} y2={chartHeight} />
                <text className="axis-text axis-text-x" x={x} y={chartHeight - 10}>
                  {label}
                </text>
              </g>
            );
          })}

          <path className="area-path" d={areaPath} />
          <path className="line-path initiated" d={initiatedPath} />
          <path className="line-path completed" d={completedPath} />
        </svg>

        <div className="chart-tooltip" role="status" aria-live="polite">
          <p className="tooltip-date">6A</p>
          <p>
            <span className="legend-color initiated" /> Iniciadas: 420
          </p>
          <p>
            <span className="legend-color completed" /> Resueltas: 370
          </p>
        </div>
      </div>
    </section>
  );
}
