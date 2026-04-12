import { useAppContext } from '../hooks/useAppContext';

export function AiTrainingPage() {
  const { samples, addTrainingSample, runTraining } = useAppContext();

  return (
    <section className="panel">
      <h3>Entrenamiento IA en panel</h3>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const intent = String(data.get('intent') ?? '');
          const phrase = String(data.get('phrase') ?? '');
          if (!intent || !phrase) return;

          addTrainingSample({ intent, phrase });
          event.currentTarget.reset();
        }}
      >
        <input name="intent" placeholder="Intent" required />
        <input name="phrase" placeholder="Frase de entrenamiento" required />
        <button type="submit">Agregar muestra</button>
      </form>

      <button type="button" onClick={runTraining}>
        Ejecutar entrenamiento
      </button>

      <ul>
        {samples.map((sample) => (
          <li key={sample.id}>
            <strong>{sample.intent}</strong>: {sample.phrase}
          </li>
        ))}
      </ul>
    </section>
  );
}
