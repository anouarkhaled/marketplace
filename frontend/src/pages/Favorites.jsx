import { Link } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import RequestError from "../components/RequestError";
import Pagination from "../components/Pagination";
import useApiPage from "../hooks/useApiPage";

export default function Favorites() {
  const { items, loading, error, retry, page, totalPages, setPage } = useApiPage("/favorites/");
  return <div className="container page">
    <div className="page-header"><h1>Mes favoris</h1><p>Retrouvez les annonces disponibles que vous avez enregistrées.</p></div>
    {loading ? <Spinner size="lg" /> : error ? <RequestError message={error} onRetry={retry} /> : !items.length ? (
      <EmptyState icon="heart" title="Aucun favori pour l’instant" description="Cliquez sur le cœur d’une annonce pour la retrouver ici."
        action={<Link to="/annonces" className="btn btn-primary">Parcourir les annonces</Link>} />
    ) : <>
      <div className="listings-grid">{items.map((favorite) => <ListingCard key={favorite.id} listing={favorite.listing} onFavoriteChange={retry} />)}</div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>}
  </div>;
}
