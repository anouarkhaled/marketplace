import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { extractErrorMessage } from "../services/errors";
import Icon from "../components/Icons";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  if (!uid || !token || invalidLink) {
    return (
      <div className="auth-wrap page">
        <div className="card auth-card text-center">
          <div style={{ color: "var(--danger)", marginBottom: "0.75rem" }}>
            <Icon name="x" size={40} />
          </div>
          <h2>Lien invalide ou expiré</h2>
          <p className="muted">Ce lien de réinitialisation est incomplet ou expiré.</p>
          <div style={{ marginTop: "1.5rem" }}>
            <Link to="/mot-de-passe-oublie" className="btn btn-primary">Demander un nouveau lien</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (password !== password2) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/password-reset/confirm/", { uid, token, new_password: password });
      setDone(true);
    } catch (err) {
      if (err.response?.data?.uid || err.response?.data?.token) setInvalidLink(true);
      setError(extractErrorMessage(err, "Lien invalide ou expiré."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap page">
      <div className="card auth-card">
        <div className="text-center" style={{ marginBottom: "1.5rem" }}>
          <h2>Nouveau mot de passe</h2>
          <p className="muted" style={{ fontSize: "0.9rem" }}>Choisissez un mot de passe sécurisé pour votre compte</p>
        </div>

        {done ? (
          <div className="card card-pad text-center" style={{ background: "var(--success-light)", color: "var(--success)", border: "none" }}>
            <Icon name="check" size={32} style={{ marginBottom: "0.5rem" }} />
            <p style={{ margin: 0, fontWeight: 600 }}>
              Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: "1rem" }}>Se connecter</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="stack gap-3">
            <div className="field">
              <label htmlFor="password">Nouveau mot de passe</label>
              <input id="password" autoComplete="new-password" type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label htmlFor="password2">Confirmer le mot de passe</label>
              <input id="password2" autoComplete="new-password" type="password" className="input" placeholder="••••••••" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
            </div>

            <p className="field-hint">Au moins 8 caractères. Évitez les mots de passe courants ou uniquement numériques.</p>
            {error && <div className="field-error text-center" role="alert">{error}</div>}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? "Enregistrement..." : "Réinitialiser le mot de passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
