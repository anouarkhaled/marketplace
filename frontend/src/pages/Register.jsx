import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../hooks/useToast";
import Icon from "../components/Icons";
import { extractErrorMessage } from "../services/errors";

function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    password2: "",
  });
  const [errors, setErrors] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors(null);
    if (submitting) return;
    if (form.password !== form.password2) {
      setErrors({ password2: "Les deux mots de passe ne correspondent pas." });
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/register/", form);
      toast.success("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
      navigate(`/login${location.search}`, { state: location.state });
    } catch (err) {
      setErrors({ detail: extractErrorMessage(err, "Erreur lors de la création du compte.") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap page">
      <div className="card auth-card">
        <div className="text-center" style={{ marginBottom: "1.75rem" }}>
          <div className="logo-mark" style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
            <Icon name="user" size={24} />
          </div>
          <h2>Créer un compte</h2>
          <p className="muted" style={{ fontSize: "0.9rem" }}>Rejoignez notre réseau de vendeurs et acheteurs</p>
        </div>

        <form onSubmit={handleSubmit} className="stack gap-3">
          <div className="field">
            <label htmlFor="username">Nom d'utilisateur</label>
            <div className="input-icon-wrap">
              <span className="icon-prefix"><Icon name="user" size={18} /></span>
              <input id="username" autoComplete="username" maxLength={150} name="username" className="input" placeholder="Choisissez un identifiant" value={form.username} onChange={handleChange} required autoFocus />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Adresse Email</label>
            <input id="email" autoComplete="email" name="email" type="email" className="input" placeholder="votre.email@exemple.com" value={form.email} onChange={handleChange} required />
          </div>

          <div className="field">
            <label htmlFor="phone">Numéro de Téléphone (optionnel)</label>
            <input id="phone" type="tel" autoComplete="tel" maxLength={20} name="phone" className="input" placeholder="+216 20 000 000" value={form.phone} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <div className="input-icon-wrap">
              <span className="icon-prefix"><Icon name="lock" size={18} /></span>
              <input id="password" autoComplete="new-password" name="password" type="password" className="input" placeholder="••••••••" value={form.password} onChange={handleChange} required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="password2">Confirmer le mot de passe</label>
            <div className="input-icon-wrap">
              <span className="icon-prefix"><Icon name="lock" size={18} /></span>
              <input id="password2" autoComplete="new-password" name="password2" type="password" className="input" placeholder="••••••••" value={form.password2} onChange={handleChange} required />
            </div>
          </div>

          {errors && (
            <div role="alert" style={{ marginBottom: "0.5rem" }}>
              {Object.entries(errors).map(([key, val]) => (
                <p key={key} className="field-error">{Array.isArray(val) ? val.join(" ") : val}</p>
              ))}
            </div>
          )}

          <p className="field-hint">Utilisez au moins 8 caractères et évitez les mots de passe courants ou composés uniquement de chiffres.</p>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? "Création du compte..." : "S'inscrire gratuitement"}
          </button>
        </form>

        <p className="text-center muted" style={{ marginTop: "1.25rem", fontSize: "0.9rem", margin: 0 }}>
          Déjà inscrit ? <Link to="/login" style={{ fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
