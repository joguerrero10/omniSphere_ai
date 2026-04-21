import type { UserActivityRow } from "../dashboard.types";

type Props = {
  title: string;
  rows: UserActivityRow[];
};

export default function UserActivityPanel({ title, rows }: Props) {
  return (
    <article className="panel">
      <h3>{title}</h3>

      <ul className="activity-list">
        {rows.map((row) => (
          <li key={row.title}>
            <div className="activity-main">
              <strong>{row.title}</strong>
              <p>{row.detail}</p>
            </div>

            <div className="activity-meta">
              <span className={`status-chip ${row.status.toLowerCase()}`}>
                {row.status}
              </span>
              <small>{row.time}</small>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}