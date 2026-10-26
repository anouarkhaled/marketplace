import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { mediaUrl } from "../services/media";
import { imageError } from "../services/forms";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { extractErrorMessage } from "../services/errors";
import useCategories from "../hooks/useCategories";
import Icon from "./Icons";

function RemovableThumb({ src, onRemove }) {
  return <div className="photo-thumb">
    <img src={src} alt="Photo de l’annonce" />
    <button type="button" className="photo-remove" onClick={onRemove} aria-label="Retirer cette photo"><Icon name="x" size={16} /></button>
  </div>;
}

function ListingForm({ listing }) {
  const { user } = useAuth();
  const draftKey = `listing-draft:${user.id}:${listing?.id || "new"}`;
  const [draft] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(draftKey)) || {}; } catch { return {}; }
  });
  const [savedId, setSavedId] = useState(draft.savedId || listing?.id || null);
  const [form, setForm] = useState(draft.form || {
    title: listing?.title || "", description: listing?.description || "", price: listing?.price || "",
    location: listing?.location || "", category: listing?.category || "",
  });
  const [existingImages, setExistingImages] = useState(listing?.images || []);
  const [newImages, setNewImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState("");
  const previews = useRef([]);
  const completed = useRef(false);
  const categories = useCategories();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!completed.current) {
      try { sessionStorage.setItem(draftKey, JSON.stringify({ savedId, form })); } catch { /* Storage may be disabled. */ }
    }
  }, [draftKey, savedId, form]);

  useEffect(() => () => previews.current.forEach(URL.revokeObjectURL), []);

  useEffect(() => {
    if (!draft.savedId || listing) return;
    const controller = new AbortController();
    api.get(`/listings/${draft.savedId}/`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setExistingImages(data.images); })
      .catch((failure) => {
        if (controller.signal.aborted) return;
        if (failure.response?.status === 404) setSavedId(null);
        else setError(extractErrorMessage(failure));
      });
    return () => controller.abort();
  }, [draft.savedId, listing]);

  const handleImages = (event) => {
    const accepted = [];
    const rejected = [];
    for (const file of event.target.files) {
      const issue = imageError(file);
      if (issue) { rejected.push(`${file.name} : ${issue}`); continue; }
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      accepted.push({ file, preview });
    }
    setNewImages((current) => [...current, ...accepted]);
    setError(rejected.length ? rejected.join(" ") : null);
    event.target.value = "";
  };

  const removeNewImage = (preview) => {
    URL.revokeObjectURL(preview);
    previews.current = previews.current.filter((value) => value !== preview);
    setNewImages((current) => current.filter((image) => image.preview !== preview));
  };

  const removeExistingImage = async (id) => {
    if (removing || !window.confirm("Supprimer cette photo de l’annonce ?")) return;
    setRemoving(true);
    try {
      await api.delete(`/listings/images/${id}/`);
      setExistingImages((images) => images.filter((image) => image.id !== id));
      toast.success("Photo supprimée.");
    } catch (failure) { setError(extractErrorMessage(failure)); }
    finally { setRemoving(false); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || removing) return;
    setSubmitting(true);
    setError(null);
    let id = savedId;
    let saved = false;
    try {
      setProgress("Enregistrement de l’annonce...");
      if (id) await api.patch(`/listings/${id}/`, form);
      else {
        const response = await api.post("/listings/", form);
        id = response.data.id;
        setSavedId(id);
        // Persist immediately, including if authentication expires during the uploads.
        try { sessionStorage.setItem(draftKey, JSON.stringify({ savedId: id, form })); } catch { /* Optional draft. */ }
      }
      saved = true;
      for (const [index, image] of newImages.entries()) {
        setProgress(`Envoi de la photo ${index + 1} sur ${newImages.length}...`);
        const data = new FormData();
        data.append("image", image.file);
        const response = await api.post(`/listings/${id}/images/`, data);
        setExistingImages((images) => [...images, response.data]);
        removeNewImage(image.preview);
      }
      completed.current = true;
      try { sessionStorage.removeItem(draftKey); } catch { /* Optional draft. */ }
      toast.success(listing ? "Annonce mise à jour." : "Annonce publiée.");
      navigate(listing ? `/annonce/${id}` : "/mes-annonces");
    } catch (failure) {
      const message = extractErrorMessage(failure);
      setError(saved ? `L’annonce est enregistrée, mais l’envoi des photos est incomplet. ${message} Réessayez : seules les photos restantes seront envoyées.` : message);
    } finally { setSubmitting(false); setProgress(""); }
  };

  return <div className="card card-pad listing-form">
    <h2>{listing ? "Modifier l’annonce" : savedId ? "Terminer votre annonce" : "Publier une annonce"}</h2>
    <p className="muted">Décrivez votre offre et ajoutez des photos. Les champs marqués * sont obligatoires.</p>
    {draft.form && <p className="notice" role="status">Votre saisie précédente a été conservée. Sélectionnez à nouveau les photos qui n’ont pas encore été envoyées.</p>}
    {categories.error && <div className="notice" role="alert">{categories.error} <button className="btn btn-secondary btn-sm" onClick={categories.retry}>Réessayer</button></div>}
    {!categories.loading && !categories.error && !categories.categories.length && <p className="notice" role="status">La publication sera disponible dès que les catégories auront été configurées.</p>}
    <form onSubmit={handleSubmit}>
      <fieldset className="form-fields stack gap-3" disabled={submitting || removing}>
        <div className="field"><label htmlFor="title">Titre *</label><input id="title" name="title" className="input" required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex. Compresseur d’air 50 L" /></div>
        <div className="field"><label htmlFor="description">Description *</label><textarea id="description" className="textarea" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="État, caractéristiques et conditions de vente" /></div>
        <div className="row gap-2 wrap">
          <div className="field form-column"><label htmlFor="price">Prix (DT) *</label><input id="price" type="number" className="input" min="0" max="9999999999.99" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div className="field form-column"><label htmlFor="location">Ville *</label><input id="location" className="input" required maxLength={200} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex. Tunis" /></div>
        </div>
        <div className="field"><label htmlFor="category">Catégorie *</label><select id="category" className="select" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={categories.loading || Boolean(categories.error)}>
          <option value="">{categories.loading ? "Chargement..." : "Choisissez une catégorie"}</option>
          {categories.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select></div>
        <div className="field"><label htmlFor="photos">Photos</label>
          <div className="row gap-2 wrap photo-previews">
            {existingImages.map((image) => <RemovableThumb key={image.id} src={mediaUrl(image.image)} onRemove={() => removeExistingImage(image.id)} />)}
            {newImages.map((image) => <RemovableThumb key={image.preview} src={image.preview} onRemove={() => removeNewImage(image.preview)} />)}
          </div>
          <input id="photos" className="input" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImages} aria-describedby="photos-hint" />
          <p id="photos-hint" className="field-hint">JPEG, PNG ou WebP. Maximum 5 Mo par photo.</p>
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={categories.loading || Boolean(categories.error) || !categories.categories.length}>
          {submitting ? progress : savedId ? "Enregistrer les modifications" : "Publier l’annonce"}
        </button>
        <Link to="/mes-annonces" className="btn btn-ghost">Retour à mes annonces</Link>
      </fieldset>
      {submitting && <p className="field-hint" role="status">{progress}</p>}
    </form>
  </div>;
}
export default ListingForm;
