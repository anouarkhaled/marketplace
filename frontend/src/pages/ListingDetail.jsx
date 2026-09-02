import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import FavoriteButton from "../components/FavoriteButton";

// dans le JSX, près du titre :

function ListingDetail() {
  const { user } = useAuth();
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
         <FavoriteButton listingId={listing.id} initialFavorited={listing.is_favorited} />

      {/* Infos */}
      <div style={infoBox}>
     
        <p>📍 <strong>Localisation :</strong> {listing.location}</p>
        <p>🏷️ <strong>Catégorie :</strong> {listing.category_name}</p>
        <p>👤 <strong>Vendeur :</strong> {listing.seller.username}</p>
      </div>

      <h3>Description</h3>
      <p style={{ lineHeight: 1.6, color: "#333" }}>{listing.description}</p>
   <div style={contactBox}>
        <h3>Contacter le vendeur</h3>
        {user ? (
          <>
            {listing.seller.email && (
              <p>✉️ <a href={`mailto:${listing.seller.email}`}>{listing.seller.email}</a></p>
            )}
            {listing.seller.phone && <p>📞 {listing.seller.phone}</p>}
            {!listing.seller.email && !listing.seller.phone && (
              <p style={{ color: "#777" }}>Ce vendeur n'a pas renseigné de coordonnées.</p>
            )}
          </>
        ) : (
          <p>
            🔒 <Link to="/login">Connecte-toi</Link> pour voir les coordonnées du vendeur.
          </p>
        )}
      </div>
    </div>
  );
}

const infoBox = { background: "#f7f7f7", borderRadius: 8, padding: "1rem", margin: "1.5rem 0" };
const contactBox = { background: "#eef7f0", border: "1px solid #cde8d5", borderRadius: 8, padding: "1rem", margin: "1.5rem 0" };
export default ListingDetail;