import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function FavoriteButton({ listingId, initialFavorited }) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggle = async (e) => {
    e.preventDefault();      // évite de suivre le lien si le bouton est dans une carte
    e.stopPropagation();
    if (!user) {
      navigate("/login");    // pas connecté → redirige
      return;
    }
    try {
      const res = await api.post(`/favorites/toggle/${listingId}/`);
      setFavorited(res.data.favorited);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button onClick={toggle} style={btnStyle} title={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}>
      {favorited ? "⭐" : "☆"}
    </button>
  );
}

const btnStyle = { background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: "1.2rem", cursor: "pointer", lineHeight: 1 };

export default FavoriteButton;