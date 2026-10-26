import CarnetButton from "../components/CarnetButton";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { mediaUrl } from "../services/media";
import useApiResource from "../hooks/useApiResource";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { extractErrorMessage } from "../services/errors";
import FavoriteButton from "../components/FavoriteButton";
import EmptyState from "../components/EmptyState";
import RequestError from "../components/RequestError";
import Spinner from "../components/Spinner";
import Icon from "../components/Icons";

export default function ListingDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: listing, error, loading, retry } = useApiResource(`/listings/${id}/`);
  const [selectedImage, setSelectedImage] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  useEffect(() => { setSelectedImage(0); setMessage(""); setSendError(null); }, [id]);

  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="container page">{error.status === 404
    ? <EmptyState icon="search" title="Annonce introuvable" description="Cette annonce n’est plus disponible."
      action={<Link to="/annonces" className="btn btn-primary">Retour aux annonces</Link>} />
    : <RequestError message={error.message} onRetry={retry} />}</div>;

  const isOwner = user?.id === listing.seller.id;
  const image = listing.images[selectedImage];
  const handleContact = async (event) => {
    event.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const response = await api.post("/conversations/", { listing: listing.id, body: message.trim() });
      toast.success("Message envoyé.");
      navigate(`/messages/${response.data.id}`);
    } catch (failure) { setSendError(extractErrorMessage(failure)); }
    finally { setSending(false); }
  };

  return <div className="container page">
    <Link to="/annonces" className="btn btn-ghost btn-sm" style={{ marginBottom: "1.5rem" }}><Icon name="arrow-left" size={16} /> Retour aux annonces</Link>
    {!listing.is_active && <p className="notice" role="status">{listing.is_moderated ? "Cette annonce est masquée par la modération." : "Cette annonce est vendue ou désactivée."} Elle n’est pas visible dans le catalogue.</p>}
    <div className="listing-detail-layout">
      <div>
        <div className="gallery-main">{image ? <img src={mediaUrl(image.image)} alt={`${listing.title} — photo ${selectedImage + 1}`} />
          : <div className="listing-image-placeholder"><Icon name="package" size={48} /><span>Aucune photo</span></div>}</div>
        {listing.images.length > 1 && <div className="gallery-thumbs" aria-label="Photos de l’annonce">
          {listing.images.map((photo, index) => <button type="button" key={photo.id} aria-label={`Afficher la photo ${index + 1}`} aria-pressed={index === selectedImage} onClick={() => setSelectedImage(index)}>
            <img src={mediaUrl(photo.image)} alt="" className={index === selectedImage ? "active" : ""} />
          </button>)}
        </div>}
        <div className="card card-pad" style={{ marginTop: "1.5rem" }}><h2>Description</h2><p className="listing-description">{listing.description}</p></div>
      </div>
      <div className="card card-pad">
        <div className="row gap-2" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><h1>{listing.title}</h1>{listing.is_active && <CarnetButton listing={listing} />}<div className="listing-card-price">{Number(listing.price).toLocaleString("fr-TN")} DT</div></div>
          {listing.is_active && <FavoriteButton key={listing.id} listingId={listing.id} initialFavorited={listing.is_favorited} />}
        </div>
        <dl className="info-list">
          <div><dt>Localisation</dt><dd>{listing.location}</dd></div>
          <div><dt>Catégorie</dt><dd>{listing.category_name || "Sans catégorie"}</dd></div>
          <div><dt>Vendeur</dt><dd>{listing.seller.username}</dd></div>
          <div><dt>Publication</dt><dd>{new Date(listing.created_at).toLocaleDateString("fr-TN")}</dd></div>
        </dl>
        {isOwner ? <Link to={`/annonce/${listing.id}/modifier`} className="btn btn-secondary btn-block">Modifier mon annonce</Link>
          : listing.is_active && <section><h2>Contacter le vendeur</h2>
            {user ? <form className="stack gap-2" onSubmit={handleContact}>
              <label htmlFor="contact-message">Votre message</label>
              <textarea id="contact-message" className="textarea" maxLength={2000} required value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Bonjour, votre annonce m’intéresse…" disabled={sending} />
              <p className="field-hint">{message.length} / 2 000 caractères</p>
              {sendError && <p className="field-error" role="alert">{sendError}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={sending || !message.trim()}>{sending ? "Envoi..." : "Envoyer le message"}</button>
            </form> : <><p>Connectez-vous pour contacter le vendeur.</p><Link to="/login" state={{ from: { pathname: `/annonce/${id}` } }} className="btn btn-primary">Se connecter</Link></>}
          </section>}
      </div>
    </div>
  </div>;
}
