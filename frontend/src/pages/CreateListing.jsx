import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function CreateListing() {
  const [form, setForm] = useState({
    title: "", description: "", price: "", location: "", category: "",
  });
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Charger les catégories au montage
  useEffect(() => {
    api.get("/categories/").then((res) => setCategories(res.data));
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Sélection des images + aperçu
  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // 1. Créer l'annonce
      const res = await api.post("/listings/", form);
      const listingId = res.data.id;

      // 2. Uploader chaque image
      for (const image of images) {
        const data = new FormData();
        data.append("image", image);
        await api.post(`/listings/${listingId}/images/`, data);
      }

      navigate("/");   // retour à l'accueil
    } catch (err) {
      setError(err.response?.data || { detail: "Erreur lors de la publication" });
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Publier une annonce</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Titre" value={form.title} onChange={handleChange} required style={inputStyle} />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required style={{ ...inputStyle, height: 80 }} />
        <input name="price" type="number" placeholder="Prix" value={form.price} onChange={handleChange} required style={inputStyle} />
        <input name="location" placeholder="Localisation" value={form.location} onChange={handleChange} required style={inputStyle} />

        <select name="category" value={form.category} onChange={handleChange} required style={inputStyle}>
          <option value="">-- Choisir une catégorie --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <input type="file" multiple accept="image/*" onChange={handleImages} style={inputStyle} />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
          {previews.map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }} />
          ))}
        </div>

        <button type="submit" style={buttonStyle}>Publier</button>
      </form>

      {error && (
        <div style={{ color: "red", marginTop: "1rem" }}>
          {Object.entries(error).map(([k, v]) => (
            <p key={k}>{k} : {Array.isArray(v) ? v.join(" ") : v}</p>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = { display: "block", width: "100%", padding: "0.5rem", marginBottom: "0.75rem" };
const buttonStyle = { padding: "0.6rem 1.2rem", cursor: "pointer" };

export default CreateListing;