import { useAppContext } from '../hooks/useAppContext';

export function FlowsPage() {
  const { flowName, setFlowName, flowNodes, addFlowNode } = useAppContext();

  return (
    <section className="panel">
      <h3>Editor de flujos</h3>
      <input value={flowName} onChange={(event) => setFlowName(event.target.value)} />
      <div className="grid two">
        <div>
          <h4>Nodos</h4>
          <ul>
            {flowNodes.map((node) => (
              <li key={node.id}>
                <strong>{node.type}</strong> · {node.label}
              </li>
            ))}
          </ul>
          <button type="button" onClick={addFlowNode}>
            Agregar nodo
          </button>
        </div>
        <div>
          <h4>Conexiones (vista simple)</h4>
          {flowNodes.map((node) => (
            <p key={`${node.id}-edge`}>
              {node.id} → {node.next.join(', ') || 'sin salida'}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
