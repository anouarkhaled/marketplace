import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { mediaUrl } from "../services/media";
function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = () => {
    api.get("/my-listings/")
      .then((res) => setListings(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette annonce ?")) return;
    await api.delete(`/listings/${id}/`);
    setListings(listings.filter((l) => l.id !== id));   // maj immédiate
  };

  if (loading) return <p style={{ padding: "2rem" }}>Chargement...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Mes annonces</h2>

      {listings.length === 0 ? (
        <p>Tu n'as pas encore publié d'annonce. <Link to="/creer-annonce">Créer ma première annonce</Link></p>
      ) : (
        listings.map((l) => (
          <div key={l.id} style={cardStyle}>
            {l.images[0] && (
              <img src={mediaUrl(l.images[0].image)} alt="" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 4 }} />
            )}
            <div style={{ flex: 1 }}>
              <strong>{l.title}</strong>
              <p style={{ margin: "4px 0", color: "#555" }}>{l.price} · {l.location}</p>
            </div>
            <button onClick={() => handleDelete(l.id)} style={deleteBtn}>Supprimer</button>
          </div>
        ))
      )}
    </div>
  );
}

const cardStyle = { display: "flex", alignItems: "center", gap: 12, border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 12 };
const deleteBtn = { padding: "0.4rem 0.8rem", cursor: "pointer", color: "red" };

export default MyListings;