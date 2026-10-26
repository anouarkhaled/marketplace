import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import NavBar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import MyListings from "./pages/MyListings";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

import "./App.css";
import "./marketplace.css";
import { CarnetProvider } from "./context/CarnetContext";
import Carnet from "./pages/Carnet";
import CarnetTray from "./components/CarnetTray";

function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const titles = {
      "/": "Annonces en Tunisie", "/annonces": "Explorer les annonces", "/login": "Connexion",
      "/register": "Créer un compte", "/creer-annonce": "Publier une annonce", "/mes-annonces": "Mes annonces",
      "/carnet": "Le carnet de trouvailles", "/favoris": "Mes favoris", "/profil": "Mon profil", "/dashboard": "Administration",
      "/mot-de-passe-oublie": "Mot de passe oublié", "/reset-password": "Nouveau mot de passe",
    };
    const title = titles[pathname] || (pathname.startsWith("/messages") ? "Messagerie" : pathname.startsWith("/annonce/") ? "Annonce" : "Page introuvable");
    document.title = `${title} — Marketplace`;
  }, [pathname]);
  return (
    <ToastProvider><CarnetProvider>
      <NavBar />
      <a className="skip-link" href="#main-content">Aller au contenu</a>
      <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/carnet" element={<Carnet />} />
          <Route path="/annonces" element={<Listings />} />
          <Route path="/annonce/:id" element={<ListingDetail />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/creer-annonce" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/annonce/:id/modifier" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
          <Route path="/mes-annonces" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
          <Route path="/favoris" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:conversationId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute staffOnly><Dashboard /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer /><CarnetTray />
    </CarnetProvider></ToastProvider>
  );
}

export default App;
