import type { KpiCard } from "../dashboard.types";

type Props = {
  items: KpiCard[];
};

export default function KpiGrid({ items }: Props) {
  return (
    <section className="kpi-grid">
      {items.map((card) => (
        <article key={card.label} className="kpi-card">
          <p>{card.label}</p>
          <h3>{card.value}</h3>
          <span className={card.tone}>{card.delta}</span>
        </article>
      ))}
    </section>
  );
}