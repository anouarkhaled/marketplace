import { useState, useEffect } from "react";
import api from "../services/api";

function Profile() {
  const [profile, setProfile] = useState({ username: "", email: "", phone: "", avatar: null });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le profil au montage
  useEffect(() => {
    api.get("/profile/")
      .then((res) => setProfile(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // FormData car il peut y avoir un fichier (avatar)
    const data = new FormData();
    data.append("email", profile.email);
    data.append("phone", profile.phone || "");
    if (avatarFile) data.append("avatar", avatarFile);

    try {
      const res = await api.patch("/profile/", data);
      setProfile(res.data);
      setPreview(null);
      setAvatarFile(null);
      setMessage({ type: "success", text: "✅ Profil mis à jour !" });
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
    }
  };

  if (loading) return <p style={{ padding: "2rem" }}>Chargement...</p>;

  const avatarSrc = preview || profile.avatar;

  return (
    <div style={{ maxWidth: 450, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>Mon profil</h2>

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        {avatarSrc ? (
          <img src={avatarSrc} alt="avatar" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={avatarPlaceholder}>{profile.username?.[0]?.toUpperCase()}</div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Nom d'utilisateur</label>
        <input value={profile.username} disabled style={{ ...inputStyle, background: "#f0f0f0" }} />

        <label style={labelStyle}>Email</label>
        <input name="email" type="email" value={profile.email} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>Téléphone</label>
        <input name="phone" value={profile.phone || ""} onChange={handleChange} style={inputStyle} />

        <label style={labelStyle}>Avatar</label>
        <input type="file" accept="image/*" onChange={handleAvatar} style={inputStyle} />

        <button type="submit" style={buttonStyle}>Enregistrer</button>
      </form>

      {message && (
        <p style={{ color: message.type === "success" ? "green" : "red", marginTop: "1rem" }}>
          {message.text}
        </p>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontWeight: "bold", marginBottom: 4, marginTop: 12, fontSize: "0.9rem" };
const inputStyle = { display: "block", width: "100%", padding: "0.5rem" };
const buttonStyle = { padding: "0.6rem 1.2rem", cursor: "pointer", marginTop: "1.5rem" };
const avatarPlaceholder = { width: 100, height: 100, borderRadius: "50%", background: "#2a7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto" };

export default Profile;