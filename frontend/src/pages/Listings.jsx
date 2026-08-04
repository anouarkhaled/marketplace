import { useState, useEffect } from "react";
import api from "../services/api";
import ListingCard from "../components/ListingCard";

function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/listings/")
      .then((res) => setListings(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: "2rem" }}>Chargement des annonces...</p>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Annonces disponibles</h1>

      {listings.length === 0 ? (
        <p>Aucune annonce pour le moment.</p>
      ) : (
        <div style={gridStyle}>
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "1.5rem",
  marginTop: "1.5rem",
};

export default Listings;