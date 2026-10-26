import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { extractErrorMessage } from "../services/errors";
import Icon from "./Icons";

function FavoriteButton({ listingId, initialFavorited, onChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => setFavorited(Boolean(initialFavorited)), [initialFavorited, listingId]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/favorites/toggle/${listingId}/`);
      setFavorited(res.data.favorited);
      onChange?.(res.data.favorited);
      toast.success(res.data.favorited ? "Ajouté aux favoris." : "Retiré des favoris.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Impossible de modifier les favoris."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`fav-btn${favorited ? " active" : ""}`}
      onClick={toggle}
      disabled={loading}
      type="button"
      aria-pressed={Boolean(favorited)}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Icon name={favorited ? "heart-filled" : "heart"} size={18} />
    </button>
  );
}

export default FavoriteButton;
