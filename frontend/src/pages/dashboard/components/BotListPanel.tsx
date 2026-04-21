import type { BotRow } from "../dashboard.types";

type Props = {
  title: string;
  rows: BotRow[];
  maxValue?: number;
};

export default function BotListPanel({
  title,
  rows,
  maxValue = 320,
}: Props) {
  return (
    <article className="panel">
      <h3>{title}</h3>
      <ul className="bot-list">
        {rows.map((bot) => (
          <li key={bot.name}>
            <div>
              <strong>{bot.name}</strong>
              <small>{bot.company}</small>
            </div>

            <div className="meter">
              <span
                style={{
                  width: `${(bot.value / maxValue) * 100}%`,
                  background: bot.color,
                }}
              />
            </div>

            <em>{bot.value}</em>
          </li>
        ))}
      </ul>
    </article>
  );
}