import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";

function ListingCard({ listing }) {
  const image = listing.images[0] ? listing.images[0].image : PLACEHOLDER;

  return (
    <div style={cardStyle}>
      <div style={{ position: "relative" }}>
        <Link to={`/annonce/${listing.id}`}>
          <img src={image} alt={listing.title} style={imgStyle} />
        </Link>
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <FavoriteButton listingId={listing.id} initialFavorited={listing.is_favorited} />
        </div>
      </div>
      <Link to={`/annonce/${listing.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ padding: "0.75rem" }}>
          <strong style={{ fontSize: "1.05rem" }}>{listing.title}</strong>
          <p style={{ margin: "0.4rem 0", color: "#2a7", fontWeight: "bold" }}>
            {Number(listing.price).toLocaleString()} DT
          </p>
          <p style={{ margin: 0, color: "#777", fontSize: "0.9rem" }}>📍 {listing.location}</p>
        </div>
      </Link>
    </div>
  );
}

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180'%3E%3Crect width='100%25' height='100%25' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='sans-serif'%3EPas de photo%3C/text%3E%3C/svg%3E";
const cardStyle = { border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden", background: "#fff" };
const imgStyle = { width: "100%", height: 180, objectFit: "cover", display: "block" };

export default ListingCard;