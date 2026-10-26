import { Link } from "react-router-dom";
import useCarnet from "../hooks/useCarnet";
import useApiResource from "../hooks/useApiResource";
import { mediaUrl } from "../services/media";
import Spinner from "../components/Spinner";
import Icon from "../components/Icons";

function CarnetEntry({ id, remove }) {
  const { data: listing, loading, error, retry } = useApiResource(`/listings/${id}/`);
  return <article className="carnet-entry"><button className="carnet-remove" onClick={remove} aria-label={`Retirer ${listing?.title || "cette annonce"}`}><Icon name="x" size={18} /></button>
    {loading ? <Spinner /> : error ? <div className="carnet-unavailable"><h2>{error.status === 404 ? "Annonce indisponible" : "Chargement impossible"}</h2><p>Les annonces sont vérifiées à chaque ouverture du carnet.</p>{error.status !== 404 && <button className="btn btn-secondary" onClick={retry}>Réessayer</button>}</div> : <>
      {listing.images?.[0] ? <img className="carnet-photo" src={mediaUrl(listing.images[0].image)} alt={listing.title} /> : <div className="carnet-photo carnet-placeholder"><Icon name="package" size={48} /></div>}
      <div className="carnet-entry-body"><span className="eyebrow">{listing.category_name}</span><h2><Link to={`/annonce/${id}`}>{listing.title}</Link></h2><dl><dt>Prix</dt><dd className="carnet-price">{Number(listing.price).toLocaleString("fr-TN")} DT</dd><dt>Localisation</dt><dd>{listing.location}</dd><dt>Vendeur</dt><dd>{listing.seller.username}</dd><dt>Disponibilité</dt><dd>{listing.is_active ? "Annonce active" : "Annonce inactive"}</dd></dl><Link className="btn btn-primary w-full" to={`/annonce/${id}`}>Voir l’annonce <Icon name="arrow-right" size={17} /></Link></div>
    </>}
  </article>;
}
export default function Carnet() {
  const { ids, toggle, clear } = useCarnet();
  return <div className="container page carnet-page"><div className="editorial-heading"><span className="eyebrow">PRENDRE LE TEMPS DE CHOISIR</span><h1>Le carnet de <em>trouvailles.</em></h1><p>Trois annonces, côte à côte. Le prix, le lieu, le vendeur : les détails qui font la différence.</p><p className="muted">Votre sélection reste sur ce navigateur, sans compte. Elle ne réserve pas les articles.</p></div><div className="carnet-toolbar"><Link to="/annonces" className="btn btn-secondary">Continuer à explorer</Link>{ids.length > 0 && <button className="btn btn-ghost" onClick={clear}>Vider le carnet</button>}</div><div className="carnet-grid">{ids.map((id) => <CarnetEntry key={id} id={id} remove={() => toggle(id)} />)}{Array.from({ length: 3 - ids.length }, (_, index) => <Link key={`empty-${index}`} className="carnet-empty" to="/annonces"><span className="carnet-slot">0{ids.length + index + 1}</span><Icon name="plus" size={32} /><h2>Une place pour un coup de cœur.</h2><span>Explorer les annonces →</span></Link>)}</div></div>;
}
