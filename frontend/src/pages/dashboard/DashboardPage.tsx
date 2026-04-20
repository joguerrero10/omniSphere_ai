          <button className="menu-item active" type="button">Overview</button>
          <button className="menu-item" type="button">Empresas ↗</button>
          <button className="menu-item" type="button">Bots ↗</button>
          <button className="menu-item" type="button">Actividad</button>
          <button className="menu-item" type="button">Conversaciones ↗</button>
          <button className="menu-item" type="button">Mensajes ↗</button>
          <button className="menu-item" type="button">Usuarios ↗</button>

          <p className="menu-label">SISTEMA</p>
          <button className="menu-item" type="button">Config ↗</button>
          <button className="menu-item" type="button">API Keys ↗</button>
        </nav>
      </aside>

      <section className="overview-content">
        <header className="overview-header">
          <div>
            <h2>Overview general</h2>
            <p>Actividad de la plataforma · Última actualización: hoy, 10:42 AM</p>
          </div>
          <button className="menu-button" type="button" aria-label="Abrir menú de opciones">
            ...
          </button>
        </header>

        <section className="kpi-grid">
          {kpiCards.map((card) => (
            <article key={card.label} className="kpi-card">
              <p>{card.label}</p>
              <h3>{card.value}</h3>
              <span className={card.tone}>{card.delta}</span>
            </article>
          ))}
        </section>

        <section className="charts-grid">
          <article className="panel chart-panel">
            <div className="panel-header">
              <h3>Conversaciones por día</h3>
              <small>últimos 14 días</small>
            </div>

            <div className="legend">
              <span>
                <i className="dot initiated" /> Iniciadas
              </span>
              <span>
                <i className="dot resolved" /> Resueltas
              </span>
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="line-chart" role="img" aria-label="Conversaciones iniciadas y resueltas">
              {[300, 400, 500, 600, 700].map((tick) => {
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

              {dayLabels.map((day, index) => {
                const x = (index / (dayLabels.length - 1)) * chartWidth;
                return (
                  <g key={day}>
                    <line x1={x} y1="0" x2={x} y2={chartHeight} className="chart-grid subtle" />
                    <text x={x} y={chartHeight - 8} className="chart-x-label">
                      {day}
                    </text>
                  </g>
                );
              })}

              <path d={buildLinePath(initiatedSeries)} className="series initiated" />
              <path d={buildLinePath(resolvedSeries)} className="series resolved" />
            </svg>
          </article>

          <article className="panel donut-panel">
            <h3>Mensajes por empresa</h3>
            <div className="donut" aria-hidden="true" />
          </article>
        </section>

        <section className="tables-grid">
          <article className="panel">
            <h3>Empresas registradas</h3>
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
                {companies.map(([name, bots, conv, status]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{bots}</td>
                    <td>{conv}</td>
                    <td>
                      <span className={`status ${status.toLowerCase()}`}>{status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="panel">
            <h3>Bots más activos hoy</h3>
            <ul className="bot-list">
              {topBots.map((bot) => (
                <li key={bot.name}>
                  <div>
                    <strong>{bot.name}</strong>
                    <small>{bot.company}</small>
                  </div>
                  <div className="meter">
                    <span style={{ width: `${(bot.value / 320) * 100}%`, background: bot.color }} />
                  </div>
                  <em>{bot.value}</em>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </section>
    </main>
  );
}
