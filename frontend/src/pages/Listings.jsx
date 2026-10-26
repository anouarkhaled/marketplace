import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ListingCard from "../components/ListingCard";
import Pagination from "../components/Pagination";
import EmptyState from "../components/EmptyState";
import Spinner from "../components/Spinner";
import RequestError from "../components/RequestError";
import useApiPage from "../hooks/useApiPage";
import useCategories from "../hooks/useCategories";

const emptyFilters = { search: "", category: "", location: "", min_price: "", max_price: "" };

function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => Object.fromEntries(Object.keys(emptyFilters).map((key) => [key, searchParams.get(key) || ""])), [searchParams]);
  const [params, setParams] = useState(filters);
  const { items, loading, error, page, totalPages, setPage, retry } = useApiPage("/listings/", params);
  const categories = useCategories();
  const invalidPrices = (filters.min_price !== "" && Number(filters.min_price) < 0)
    || (filters.max_price !== "" && Number(filters.max_price) < 0)
    || (filters.min_price !== "" && filters.max_price !== "" && Number(filters.min_price) > Number(filters.max_price));

  useEffect(() => {
    if (invalidPrices) return;
    const timer = setTimeout(() => { setPage(1); setParams(filters); }, 350);
    return () => clearTimeout(timer);
  }, [filters, invalidPrices, setPage]);

  const handleFilter = (event) => {
    const next = new URLSearchParams(searchParams);
    if (event.target.value) next.set(event.target.name, event.target.value);
    else next.delete(event.target.name);
    setSearchParams(next, { replace: true });
  };
  const reset = () => { setSearchParams({}, { replace: true }); setParams(emptyFilters); setPage(1); };
  const active = Object.values(filters).some(Boolean);

  return <div className="container page">
    <div className="page-header editorial-heading"><span className="eyebrow">LE MARCHÉ, À VOTRE RYTHME</span><h1>À vous la <em>trouvaille.</em></h1><p>Trouvez un produit ou un service par catégorie, ville et budget.</p></div>
    <div className="filter-bar" role="search" aria-label="Filtrer les annonces">
      <label className="filter-field filter-search">Rechercher
        <input name="search" className="input" placeholder="Titre ou mot-clé" value={filters.search} onChange={handleFilter} />
      </label>
      <label className="filter-field">Catégorie
        <select name="category" className="select" value={filters.category} onChange={handleFilter} disabled={categories.loading || Boolean(categories.error)}>
          <option value="">{categories.loading ? "Chargement..." : "Toutes les catégories"}</option>
          {categories.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="filter-field">Ville<input name="location" className="input" placeholder="Ex. Tunis" value={filters.location} onChange={handleFilter} /></label>
      <label className="filter-field">Prix minimum (DT)<input name="min_price" type="number" min="0" step="0.01" className="input" value={filters.min_price} onChange={handleFilter} /></label>
      <label className="filter-field">Prix maximum (DT)<input name="max_price" type="number" min="0" step="0.01" className="input" value={filters.max_price} onChange={handleFilter} /></label>
      {active && <button className="btn btn-secondary" onClick={reset}>Réinitialiser</button>}
      {categories.error && <p className="field-error" role="alert">Catégories indisponibles. <button className="btn btn-ghost btn-sm" onClick={categories.retry}>Réessayer</button></p>}
      {invalidPrices && <p className="field-error" role="alert">Indiquez des prix positifs et un minimum inférieur ou égal au maximum.</p>}
    </div>
    {loading ? <Spinner size="lg" /> : error ? <RequestError message={error} onRetry={retry} /> : items.length ? (
      <><div className="listings-grid">{items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} /></>
    ) : <EmptyState icon="search" title="Aucune annonce trouvée" description={active ? "Essayez une autre ville, un autre budget ou une autre catégorie." : "Aucune annonce n’est publiée pour le moment."}
      action={active ? <button className="btn btn-primary" onClick={reset}>Réinitialiser les filtres</button> : <Link to="/creer-annonce" className="btn btn-primary">Publier une annonce</Link>} />}
  </div>;
}
export default Listings;
