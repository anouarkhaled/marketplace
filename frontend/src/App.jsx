import { Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";

function Home() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Marketplace</h1>
      {user ? (
        <>
          <p>✅ Tu es connecté</p>
          <button onClick={logout}>Se déconnecter</button>
        </>
      ) : (
        <p>
          <Link to="/register">S'inscrire</Link> ·{" "}
          <Link to="/login">Se connecter</Link>
        </p>
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;