import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icons";
import MarketIllustration from "../components/MarketIllustration";
import ListingCard from "../components/ListingCard";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import RequestError from "../components/RequestError";
import useApiPage from "../hooks/useApiPage";
import useCategories from "../hooks/useCategories";

export default function LandingPage() {
  const { items, loading, error, retry } = useApiPage("/listings/");
  const { categories, error: categoryError, retry: retryCategories } = useCategories();
  const navigate = useNavigate();
  const search = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of data) if (value.trim()) params.set(key, value.trim());
    navigate(`/annonces?${params}`);
  };
  return <div className="market-home">
    <section className="container market-hero">
      <div className="market-hero-copy"><span className="eyebrow"><span className="status-dot" /> LE MARCHÉ DES POSSIBLES · TUNISIE</span>
        <h1>Du concret.<br />Du solide.<br /><em>Votre prochain projet.</em></h1>
        <p>Équipez votre atelier, aménagez votre espace, trouvez le bon service. Des annonces en Tunisie pour passer à l’action.</p>
        <form className="market-search" onSubmit={search} role="search" aria-label="Chercher une annonce">
          <label><span>DE QUOI AVEZ-VOUS BESOIN ?</span><input name="search" placeholder="Outil, équipement, service…" /></label>
          <label className="market-search-city"><span>OÙ ÇA ?</span><input name="location" placeholder="Toute la Tunisie" /></label>
          <button type="submit" aria-label="Rechercher des annonces"><Icon name="arrow-right" size={24} /></button>
        </form>
        <div className="hero-cities"><span>On fait un tour à</span>{["Tunis", "Sousse", "Sfax"].map((city) => <Link key={city} to={`/annonces?location=${city}`}>{city} <span aria-hidden="true">↗</span></Link>)}</div>
      </div>
      <div className="market-hero-art"><MarketIllustration /><p><span>01 /</span> Des objets, des projets, des gens d’ici.</p></div>
    </section>
    <section className="market-category-section"><div className="container"><div className="market-section-heading"><span className="eyebrow">SUIVEZ VOTRE CURIOSITÉ</span><Link to="/annonces">Tout explorer <Icon name="arrow-right" size={17} /></Link></div>
      <div className="market-categories">{categories.map((category, index) => <Link to={`/annonces?category=${category.id}`} key={category.id}><span className="category-number">0{index + 1}</span><span>{category.name}</span><Icon name="arrow-right" size={18} /></Link>)}</div>
      {categoryError && <button className="btn btn-secondary" onClick={retryCategories}>Recharger les catégories</button>}
    </div></section>
    <section className="container market-latest"><div className="market-section-heading"><div><span className="eyebrow">FRAÎCHEMENT SUR LE MARCHÉ</span><h2>Ça vient <em>d’arriver.</em></h2></div><Link className="editorial-link" to="/annonces">Voir toutes les annonces <Icon name="arrow-right" size={18} /></Link></div>
      {loading ? <Spinner size="lg" /> : error ? <RequestError message={error} onRetry={retry} /> : items.length ? <div className="listings-grid">{items.slice(0, 3).map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <div className="market-first"><span className="first-number" aria-hidden="true">01.</span><EmptyState icon="package" title="Les premières histoires s’écrivent ici." description="Un objet qui attend son prochain chapitre ? Donnez le ton en publiant la première annonce." action={<Link className="btn btn-primary" to="/creer-annonce">Je publie une annonce <Icon name="plus" size={18} /></Link>} /></div>}
    </section>
    <section className="container market-carnet-section"><div className="carnet-sketch" aria-hidden="true"><span>MON PETIT CARNET</span><div><i>01</i><i>02</i><i>03</i></div><p>Repérer. Comparer. Choisir.</p></div><div><span className="eyebrow">LE PETIT PLUS QUI CHANGE TOUT</span><h2>Un coup de cœur ?<br /><em>Prenez des notes.</em></h2><p>Gardez jusqu’à trois annonces dans votre carnet et comparez les prix, les villes et les vendeurs. Sans compte, sans perdre le fil.</p><Link className="editorial-link" to="/carnet">Découvrir mon carnet <Icon name="arrow-right" size={19} /></Link></div></section>
    <section className="market-publish"><div className="container"><span className="eyebrow">FAITES DE LA PLACE AUX POSSIBLES</span><h2>Chez vous, c’est en trop.<br /><em>Ailleurs, c’est exactement ça.</em></h2><Link className="btn carnet-cta btn-lg" to="/creer-annonce">Publier mon annonce <Icon name="plus" size={20} /></Link><p>Quelques photos, les bons détails, et une nouvelle histoire commence.</p></div></section>
  </div>;
}
