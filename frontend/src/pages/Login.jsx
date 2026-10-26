import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Icon from "../components/Icons";
import { extractErrorMessage } from "../services/errors";
import { safeReturnPath } from "../services/forms";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const from = location.state?.from;
  const next = safeReturnPath(searchParams.get("next") || (from ? `${from.pathname}${from.search || ""}${from.hash || ""}` : null));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.response?.status === 401 ? "Identifiants incorrects. Vérifiez votre nom d’utilisateur et votre mot de passe." : extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap page">
      <div className="card auth-card">
        <div className="text-center" style={{ marginBottom: "1.75rem" }}>
          <div className="logo-mark" style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
            <Icon name="sparkles" size={24} />
          </div>
          <h2>Espace Connexion</h2>
          <p className="muted" style={{ fontSize: "0.9rem" }}>Accédez à votre espace Marketplace</p>
        </div>

        {searchParams.has("expired") && <p className="notice" role="status">Votre session a expiré. Reconnectez-vous pour reprendre votre activité.</p>}
        <form onSubmit={handleSubmit} className="stack gap-3">
          <div className="field">
            <label htmlFor="username">Nom d'utilisateur</label>
            <div className="input-icon-wrap">
              <span className="icon-prefix"><Icon name="user" size={18} /></span>
              <input id="username" autoComplete="username" maxLength={150} className="input" placeholder="Votre nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <div className="input-icon-wrap">
              <span className="icon-prefix"><Icon name="lock" size={18} /></span>
              <input id="password" autoComplete="current-password" type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          {error && <div className="field-error text-center" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="text-center" style={{ marginTop: "1.25rem", fontSize: "0.9rem" }}>
          <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </p>
        <p className="text-center muted" style={{ fontSize: "0.9rem", margin: 0 }}>
          Pas encore de compte ? <Link to={`/register?next=${encodeURIComponent(next)}`} state={location.state} style={{ fontWeight: 600 }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
