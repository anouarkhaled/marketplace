import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate("/");   // redirige vers l'accueil après connexion
    } catch (err) {
      setError("Identifiants incorrects");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        <button type="submit" style={buttonStyle}>Se connecter</button>
      </form>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      <p style={{ marginTop: "1rem" }}>
        Pas de compte ? <Link to="/register">S'inscrire</Link>
      </p>
    </div>
  );
}

const inputStyle = { display: "block", width: "100%", padding: "0.5rem", marginBottom: "0.75rem" };
const buttonStyle = { padding: "0.6rem 1.2rem", cursor: "pointer" };

export default Login;