import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/listings/${id}/`)
      .then((res) => {
        setListing(res.data);
        if (res.data.images[0]) setMainImage(res.data.images[0].image);
      })
      .catch(() => setError(true));
  }, [id]);

  if (error) return <p style={{ padding: "2rem" }}>Annonce introuvable. <Link to="/">Retour</Link></p>;
  if (!listing) return <p style={{ padding: "2rem" }}>Chargement...</p>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <Link to="/">← Retour aux annonces</Link>

      <h1 style={{ marginTop: "1rem" }}>{listing.title}</h1>
      <p style={{ fontSize: "1.5rem", color: "#2a7", fontWeight: "bold" }}>
        {Number(listing.price).toLocaleString()} DT
      </p>

      {/* Galerie photos */}
      {mainImage && (
        <div style={{ marginBottom: "1rem" }}>
          <img src={mainImage} alt={listing.title} style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 8 }} />
          {listing.images.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {listing.images.map((img) => (
                <img
                  key={img.id}
                  src={img.image}
                  alt=""
                  onClick={() => setMainImage(img.image)}
                  style={{
                    width: 70, height: 70, objectFit: "cover", borderRadius: 4, cursor: "pointer",
                    border: mainImage === img.image ? "2px solid #2a7" : "2px solid transparent",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Infos */}
      <div style={infoBox}>
        <p>📍 <strong>Localisation :</strong> {listing.location}</p>
        <p>🏷️ <strong>Catégorie :</strong> {listing.category_name}</p>
        <p>👤 <strong>Vendeur :</strong> {listing.seller}</p>
      </div>

      <h3>Description</h3>
      <p style={{ lineHeight: 1.6, color: "#333" }}>{listing.description}</p>
    </div>
  );
}

const infoBox = { background: "#f7f7f7", borderRadius: 8, padding: "1rem", margin: "1.5rem 0" };

export default ListingDetail;