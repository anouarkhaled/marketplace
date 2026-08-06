import { useState, useEffect } from "react";
import api from "../services/api";
import ListingCard from "../components/ListingCard";

function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: "", location: "", min_price: "", max_price: "",
  });

  // Charger les catégories pour le menu déroulant
  useEffect(() => {
    api.get("/categories/").then((res) => setCategories(res.data));
  }, []);

  // Recharger les annonces quand recherche ou filtres changent
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      // On ne garde que les paramètres non vides
      const params = {};
      if (search) params.search = search;
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params[key] = val;
      });

      api.get("/listings/", { params })
        .then((res) => setListings(res.data))
        .finally(() => setLoading(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [search, filters]);

  const handleFilter = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const resetFilters = () => {
    setSearch("");
    setFilters({ category: "", location: "", min_price: "", max_price: "" });
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Annonces disponibles</h1>

      <input
        type="text"
        placeholder="🔍 Rechercher un bien..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchStyle}
      />

      {/* Panneau de filtres */}
      <div style={filterBar}>
        <select name="category" value={filters.category} onChange={handleFilter} style={filterInput}>
          <option value="">Toutes catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <input name="location" placeholder="Ville" value={filters.location} onChange={handleFilter} style={filterInput} />
        <input name="min_price" type="number" placeholder="Prix min" value={filters.min_price} onChange={handleFilter} style={filterInput} />
        <input name="max_price" type="number" placeholder="Prix max" value={filters.max_price} onChange={handleFilter} style={filterInput} />

        <button onClick={resetFilters} style={resetBtn}>Réinitialiser</button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : listings.length === 0 ? (
        <p>Aucune annonce ne correspond à vos critères.</p>
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

const searchStyle = { width: "100%", padding: "0.75rem", fontSize: "1rem", borderRadius: 8, border: "1px solid #ccc", margin: "1rem 0 1rem" };
const filterBar = { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" };
const filterInput = { padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc" };
const resetBtn = { padding: "0.5rem 1rem", cursor: "pointer", borderRadius: 6, border: "1px solid #ccc", background: "#f5f5f5" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" };

export default Listings;