import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { extractErrorMessage } from "../services/errors";
import Icon from "../components/Icons";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/password-reset/", { email });
      setSent(true);
    } catch (err) {
      setError(extractErrorMessage(err, "Impossible d'envoyer l'email."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap page">
      <div className="card auth-card">
        <div className="text-center" style={{ marginBottom: "1.5rem" }}>
          <div className="logo-mark" style={{ width: 44, height: 44, borderRadius: 12, background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
            <Icon name="lock" size={24} />
          </div>
          <h2>Mot de passe oublié</h2>
        </div>

        {sent ? (
          <div className="card card-pad text-center" style={{ background: "var(--success-light)", color: "var(--success)", border: "none" }}>
            <Icon name="check" size={32} style={{ marginBottom: "0.5rem" }} />
            <p style={{ margin: 0, fontWeight: 600 }}>
              Si un compte correspond à cette adresse email, un lien de réinitialisation sécurisé vient de vous être envoyé.
            </p>
          </div>
        ) : (
          <>
            <p className="muted text-center" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              Renseignez votre adresse email pour recevoir des instructions de réinitialisation.
            </p>
            <form onSubmit={handleSubmit} className="stack gap-3">
              <div className="field">
                <label htmlFor="email">Adresse Email</label>
                <input id="email" autoComplete="email" type="email" className="input" placeholder="votre.email@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              {error && <div className="field-error text-center" role="alert">{error}</div>}
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                {submitting ? "Envoi en cours..." : "Envoyer le lien"}
              </button>
            </form>
          </>
        )}

        <p className="text-center muted" style={{ marginTop: "1.5rem", fontSize: "0.9rem", margin: 0 }}>
          <Link to="/login" className="row gap-1" style={{ justifyContent: "center" }}>
            <Icon name="arrow-left" size={16} /> Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
