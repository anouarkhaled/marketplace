import { Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import Listings from "./pages/Listings";
import { useAuth } from "./context/AuthContext";
import ListingDetail from "./pages/ListingDetail";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
// dans <Routes> :
   
function NavBar() {
  const { user, logout } = useAuth();
  return (
    <nav style={{ display: "flex", gap: 16, padding: "1rem 2rem", borderBottom: "1px solid #eee", alignItems: "center" }}>
      <Link to="/" style={{ fontWeight: "bold" }}>🏠 Marketplace</Link>
      <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
        {user ? (
          <>
            <Link to="/dashboard">📊 Dashboard</Link>
            <Link to="/creer-annonce">➕ Publier</Link>
            <Link to="/mes-annonces">📋 Mes annonces</Link>
            <Link to="/favoris">⭐ Favoris</Link>
            <Link to="/profil">👤 Profil</Link>
            <button onClick={logout}>Déconnexion</button>
          </>
        ) : (
          <>
            <Link to="/login">Connexion</Link>
            <Link to="/register">Inscription</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Listings />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/creer-annonce" element={<CreateListing />} />
        <Route path="/mes-annonces" element={<MyListings />} />
        <Route path="/annonce/:id" element={<ListingDetail />} />
        <Route path="/favoris" element={<Favorites />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;