import type { CompanyRow } from "../dashboard.types";

type Props = {
  title: string;
  rows: CompanyRow[];
};

export default function CompaniesTable({ title, rows }: Props) {
  return (
    <article className="panel">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Bots</th>
            <th>Conv.</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.bots}</td>
              <td>{row.conversations}</td>
              <td>
                <span className={`status ${row.status.toLowerCase()}`}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}