import CarnetButton from "./CarnetButton";
import { Link } from "react-router-dom";
import { mediaUrl } from "../services/media";
import FavoriteButton from "./FavoriteButton";
import Icon from "./Icons";

export default function ListingCard({ listing, onFavoriteChange }) {
  const image = listing.images?.[0] ? mediaUrl(listing.images[0].image) : null;
  return <article className="listing-card">
    <div className="listing-card-media">
      <Link to={`/annonce/${listing.id}`} aria-label={`Voir l’annonce : ${listing.title}`} className="listing-image-link">
        {image ? <img src={image} alt={listing.title} loading="lazy" /> : <div className="listing-image-placeholder"><Icon name="package" size={32} /></div>}
      </Link>
      <div className="listing-card-fav"><FavoriteButton listingId={listing.id} initialFavorited={listing.is_favorited} onChange={onFavoriteChange} /></div>
    </div>
    <div className="listing-card-body">
      <div><span className="badge badge-neutral"><Icon name="tag" size={12} /> {listing.category_name || "Sans catégorie"}</span></div>
      <Link to={`/annonce/${listing.id}`} className="listing-card-title">{listing.title}</Link>
      <div className="listing-card-meta"><Icon name="map-pin" size={14} /><span>{listing.location}</span></div>
      <div className="listing-card-bottom"><CarnetButton listing={listing} /><div className="listing-card-price">{Number(listing.price).toLocaleString("fr-TN")} DT</div></div>
    </div>
  </article>;
}
