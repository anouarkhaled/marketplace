import EmptyState from "./EmptyState";

export default function RequestError({ message, onRetry }) {
  return <div role="alert"><EmptyState icon="x" title="Chargement impossible" description={message}
    action={onRetry && <button className="btn btn-primary" onClick={onRetry}>Réessayer</button>} /></div>;
}
