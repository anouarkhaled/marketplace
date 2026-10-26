import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useApiResource from "../hooks/useApiResource";
import ListingForm from "../components/ListingForm";
import EmptyState from "../components/EmptyState";
import RequestError from "../components/RequestError";
import Spinner from "../components/Spinner";

export default function EditListing() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: listing, error, loading, retry } = useApiResource(`/listings/${id}/`);
  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="container page">{error.status === 404
    ? <EmptyState icon="search" title="Annonce introuvable" description="Cette annonce n’est plus disponible." action={<Link className="btn btn-primary" to="/mes-annonces">Mes annonces</Link>} />
    : <RequestError message={error.message} onRetry={retry} />}</div>;
  if (listing.seller.id !== user.id) return <Navigate to={`/annonce/${id}`} replace />;
  return <div className="container page"><ListingForm key={listing.id} listing={listing} /></div>;
}
