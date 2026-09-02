import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ListingCard from "../components/ListingCard";

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/favorites/")
      .then((res) => setFavorites(res.data.results))   // pagination → .results
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: "2rem" }}>Chargement...</p>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Mes favoris</h1>

      {favorites.length === 0 ? (
        <p>
          Tu n'as pas encore de favori. <Link to="/">Parcourir les annonces</Link>
        </p>
      ) : (
        <div style={gridStyle}>
          {favorites.map((fav) => (
            <ListingCard key={fav.id} listing={fav.listing} />
          ))}
        </div>
      )}
    </div>
  );
}

const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" };

export default Favorites;