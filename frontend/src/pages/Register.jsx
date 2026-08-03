import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    password2: "",
  });
  const [errors, setErrors] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors(null);
    try {
      await api.post("/register/", form);
      navigate("/login");   // redirige vers la connexion
    } catch (err) {
      setErrors(err.response?.data || { detail: "Erreur inconnue" });
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Créer un compte</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Nom d'utilisateur" value={form.username} onChange={handleChange} required style={inputStyle} />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required style={inputStyle} />
        <input name="phone" placeholder="Téléphone" value={form.phone} onChange={handleChange} style={inputStyle} />
        <input name="password" type="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} required style={inputStyle} />
        <input name="password2" type="password" placeholder="Confirmer le mot de passe" value={form.password2} onChange={handleChange} required style={inputStyle} />
        <button type="submit" style={buttonStyle}>S'inscrire</button>
      </form>

      {errors && (
        <div style={{ color: "red", marginTop: "1rem" }}>
          {Object.entries(errors).map(([key, val]) => (
            <p key={key}>{key} : {Array.isArray(val) ? val.join(" ") : val}</p>
          ))}
        </div>
      )}

      <p style={{ marginTop: "1rem" }}>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  );
}

const inputStyle = { display: "block", width: "100%", padding: "0.5rem", marginBottom: "0.75rem" };
const buttonStyle = { padding: "0.6rem 1.2rem", cursor: "pointer" };

export default Register;