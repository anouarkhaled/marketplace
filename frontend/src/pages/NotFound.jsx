import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icons";

function NotFound() {
  return (
    <div className="container page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <EmptyState
        icon="search"
        title="Page 404 — Page introuvable"
        description="Désolé, la page que vous recherchez n'existe pas ou a été déplacée."
        action={
          <Link to="/" className="btn btn-primary btn-lg">
            <Icon name="arrow-left" size={18} /> Retour à l'accueil
          </Link>
        }
      />
    </div>
  );
}

export default NotFound;
