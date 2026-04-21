type Props = {
  title: string;
};

export default function DonutPanel({ title }: Props) {
  return (
    <article className="panel donut-panel">
      <h3>{title}</h3>
      <div className="donut" aria-hidden="true" />
    </article>
  );
}