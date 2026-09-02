import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get("/stats/")
      .then((res) => setStats(res.data))
      .catch(() => setError(true));
  }, []);

  if (error) return <p style={{ padding: "2rem" }}>Accès réservé aux administrateurs.</p>;
  if (!stats) return <p style={{ padding: "2rem" }}>Chargement...</p>;

  const cards = [
    { label: "Utilisateurs", value: stats.users, icon: "👥" },
    { label: "Annonces totales", value: stats.listings_total, icon: "📦" },
    { label: "Annonces actives", value: stats.listings_active, icon: "✅" },
    { label: "Annonces masquées", value: stats.listings_hidden, icon: "🚫" },
    { label: "Favoris", value: stats.favorites, icon: "⭐" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Tableau de bord</h1>
      <p style={{ color: "#666" }}>
        Gestion avancée dans l'<a href="http://127.0.0.1:8000/admin" target="_blank" rel="noreferrer">admin Django</a>.
      </p>

      <div style={gridStyle}>
        {cards.map((c) => (
          <div key={c.label} style={cardStyle}>
            <div style={{ fontSize: "2rem" }}>{c.icon}</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{c.value}</div>
            <div style={{ color: "#666" }}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginTop: "1.5rem" };
const cardStyle = { border: "1px solid #e0e0e0", borderRadius: 8, padding: "1.5rem", textAlign: "center", background: "#fff" };

export default Dashboard;