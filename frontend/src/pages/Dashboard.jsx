import useApiResource from "../hooks/useApiResource";
import { BACKEND_ORIGIN } from "../services/media";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icons";
import RequestError from "../components/RequestError";

function Dashboard() {
  const { data: stats, error, retry } = useApiResource("/stats/");

  if (error) {
    return (
      <div className="container page">
        {error.status === 403 ? <EmptyState
          icon="lock"
          title="Accès réservé aux administrateurs"
          description="Vous devez posséder un compte staff pour accéder au tableau de bord administration."
        /> : <RequestError message={error.message} onRetry={retry} />}
      </div>
    );
  }

  if (!stats) return <Spinner size="lg" />;

  const cards = [
    { label: "Utilisateurs inscrits", value: stats.users, icon: "user", color: "var(--primary)" },
    { label: "Annonces totales", value: stats.listings_total, icon: "package", color: "var(--accent)" },
    { label: "Annonces actives", value: stats.listings_active, icon: "check", color: "var(--success)" },
    { label: "Annonces masquées", value: stats.listings_hidden, icon: "x", color: "var(--danger)" },
    { label: "Total favoris", value: stats.favorites, icon: "heart", color: "var(--warning)" },
  ];

  const activePercent = stats.listings_total > 0 ? Math.round((stats.listings_active / stats.listings_total) * 100) : 0;

  return (
    <div className="container page">
      <div className="page-header row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Tableau de bord Administrateur</h1>
          <p>Vue d'ensemble et métriques globales de l'activité du marketplace.</p>
        </div>
        <a
          href={`${BACKEND_ORIGIN}/admin/`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
        >
          <Icon name="dashboard" size={18} /> Administrer les annonces ↗
        </a>
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="card stat-card">
            <div className="stat-header">
              <span className="label">{c.label}</span>
              <div className="icon-box" style={{ color: c.color, background: "var(--primary-light)" }}>
                <Icon name={c.icon} size={22} />
              </div>
            </div>
            <div className="value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: "2rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Ratio d'activité des annonces</h3>
        <div style={{ background: "var(--bg-subtle)", borderRadius: "var(--radius-full)", height: 14, overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${activePercent}%`, background: "var(--success)", transition: "width 0.5s ease" }} />
          <div style={{ width: `${100 - activePercent}%`, background: "var(--danger)" }} />
        </div>
        <div className="row gap-3" style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
          <span className="row gap-1"><span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--success)" }} /> {activePercent}% Actives ({stats.listings_active})</span>
          <span className="row gap-1"><span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--danger)" }} /> {100 - activePercent}% Masquées ({stats.listings_hidden})</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
