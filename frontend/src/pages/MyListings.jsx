import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { mediaUrl } from "../services/media";
import { useToast } from "../hooks/useToast";
import { extractErrorMessage } from "../services/errors";
import useApiPage from "../hooks/useApiPage";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import RequestError from "../components/RequestError";
import Pagination from "../components/Pagination";
import Icon from "../components/Icons";

export default function MyListings() {
  const { items, loading, error, retry, page, totalPages, setPage } = useApiPage("/my-listings/");
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();
  const handleDelete = async (listing) => {
    if (busyId || !window.confirm(`Supprimer définitivement l’annonce « ${listing.title} » et ses conversations ?`)) return;
    setBusyId(listing.id);
    try { await api.delete(`/listings/${listing.id}/`); toast.success("Annonce supprimée."); retry(); }
    catch (failure) { toast.error(extractErrorMessage(failure)); }
    finally { setBusyId(null); }
  };
  const toggle = async (listing) => {
    if (busyId) return;
    setBusyId(listing.id);
    try {
      const response = await api.patch(`/listings/${listing.id}/`, { is_active: !listing.is_active });
      toast.success(response.data.is_active ? "Annonce republiée." : "Annonce marquée comme vendue.");
      retry();
    } catch (failure) { toast.error(extractErrorMessage(failure)); }
    finally { setBusyId(null); }
  };
  return <div className="container page">
    <div className="page-header row wrap" style={{ justifyContent: "space-between", gap: "1rem" }}>
      <div><h1>Mes annonces</h1><p>Modifiez vos offres et gérez leur disponibilité.</p></div>
      <Link to="/creer-annonce" className="btn btn-primary"><Icon name="plus" size={18} /> Publier une annonce</Link>
    </div>
    {loading ? <Spinner size="lg" /> : error ? <RequestError message={error} onRetry={retry} /> : !items.length ? (
      <EmptyState icon="package" title="Aucune annonce publiée" description="Proposez votre premier produit ou service."
        action={<Link to="/creer-annonce" className="btn btn-primary">Créer une annonce</Link>} />
    ) : <>
      <div className="stack gap-3">{items.map((listing) => (
        <article className="card my-listing-row" key={listing.id}>
          {listing.images?.[0] ? <img src={mediaUrl(listing.images[0].image)} alt="" /> : <Icon name="package" size={48} />}
          <div className="info">
            <Link className="listing-card-title" to={`/annonce/${listing.id}`}>{listing.title}</Link>
            <p className="muted">{Number(listing.price).toLocaleString("fr-TN")} DT · {listing.location}</p>
            <span className={`badge ${listing.is_active ? "badge-success" : "badge-neutral"}`}>{listing.is_active ? "Active" : listing.is_moderated ? "Masquée par la modération" : "Vendue / désactivée"}</span>
            {listing.is_moderated && <p className="field-hint">Vous pouvez corriger votre annonce. Sa remise en ligne nécessite l’intervention d’un administrateur.</p>}
          </div>
          <div className="actions">
            <Link to={`/annonce/${listing.id}/modifier`} className="btn btn-secondary btn-sm">Modifier</Link>
            {!listing.is_moderated && <button className="btn btn-secondary btn-sm" disabled={busyId !== null} onClick={() => toggle(listing)}>{listing.is_active ? "Marquer vendue" : "Republier"}</button>}
            <button className="btn btn-danger btn-sm" disabled={busyId !== null} onClick={() => handleDelete(listing)}>{busyId === listing.id ? "Traitement..." : "Supprimer"}</button>
          </div>
        </article>
      ))}</div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>}
  </div>;
}
