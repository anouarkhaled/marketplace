import useCarnet from "../hooks/useCarnet";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import Avatar from "./Avatar";
import Icon from "./Icons";
import { fetchAllPages } from "../services/collections";

function useUnreadCount(user) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    const controller = new AbortController();
    const fetchUnread = () => {
      fetchAllPages(api, "/conversations/", controller.signal).then((conversations) => {
        if (controller.signal.aborted) return;
        const total = conversations.reduce(
          (sum, c) => sum + (c.unread_count || 0),
          0
        );
        setCount(total);
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [user]);

  return count;
}

function NavBar() {
  const { user, logout } = useAuth();
  const { ids } = useCarnet();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unread = useUnreadCount(user);
  const location = useLocation();
  const burgerRef = useRef(null);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") { setOpen(false); burgerRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate("/");
  };

  const linkClass = ({ isActive }) => `navbar-link${isActive ? " active" : ""}`;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={close}>
          <div className="logo-mark">
            <span className="market-mark" aria-hidden="true">m.</span>
          </div>
          <span>Marketplace</span>
        </NavLink>

        <button
          className="navbar-burger"
          ref={burgerRef}
          aria-controls="main-navigation"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "x" : "menu"} size={22} />
        </button>

        <nav id="main-navigation" aria-label="Navigation principale" className={`navbar-links${open ? " open" : ""}`}>
          <NavLink to="/" className={linkClass} onClick={close} end>
            <Icon name="sparkles" size={16} /> Accueil
          </NavLink>
          <NavLink to="/annonces" className={linkClass} onClick={close}>
            <Icon name="grid" size={16} /> Annonces
          </NavLink>

          <NavLink to="/carnet" className={linkClass} onClick={close}><Icon name="layers" size={16} /> Carnet {ids.length > 0 && <span className="carnet-count">{ids.length}</span>}</NavLink>
          {user ? (
            <>
              <NavLink to="/creer-annonce" className={linkClass} onClick={close}>
                <Icon name="plus" size={16} /> Publier
              </NavLink>
              <NavLink to="/mes-annonces" className={linkClass} onClick={close}>
                <Icon name="package" size={16} /> Mes annonces
              </NavLink>
              <NavLink to="/favoris" className={linkClass} onClick={close}>
                <Icon name="heart" size={16} /> Favoris
              </NavLink>
              <NavLink to="/messages" className={linkClass} onClick={close} style={{ position: "relative" }}>
                <Icon name="message" size={16} /> Messages
                {unread > 0 && <span className="navbar-badge">{unread > 9 ? "9+" : unread}</span>}
              </NavLink>
              {user.is_staff && (
                <NavLink to="/dashboard" className={linkClass} onClick={close}>
                  <Icon name="chart" size={16} /> Administration
                </NavLink>
              )}
              <NavLink to="/profil" className={`navbar-link divider`} onClick={close}>
                <Avatar src={user.avatar} name={user.username} size={26} />
                <span>{user.username}</span>
              </NavLink>
              <button
                className="navbar-link"
                onClick={handleLogout}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={close}>
                Connexion
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm" onClick={close}>
                Inscription
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
