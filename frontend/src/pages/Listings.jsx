import { useState, useEffect } from "react";
import api from "../services/api";
import ListingCard from "../components/ListingCard";

function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Recharge les annonces à chaque changement de recherche (avec un léger délai)
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api.get("/listings/", { params: search ? { search } : {} })
        .then((res) => setListings(res.data))
        .finally(() => setLoading(false));
    }, 400);   // debounce : attend 400ms après la dernière frappe

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Annonces disponibles</h1>

      <input
        type="text"
        placeholder="🔍 Rechercher un bien (titre, ville...)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchStyle}
      />

      {loading ? (
        <p>Chargement...</p>
      ) : listings.length === 0 ? (
        <p>Aucune annonce ne correspond à votre recherche.</p>
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

const searchStyle = { width: "100%", padding: "0.75rem", fontSize: "1rem", borderRadius: 8, border: "1px solid #ccc", margin: "1rem 0 1.5rem" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" };

export default Listings;