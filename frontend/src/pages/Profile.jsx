import { useEffect, useState } from "react";
import api from "../services/api";
import { imageError } from "../services/forms";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { extractErrorMessage } from "../services/errors";
import Avatar from "../components/Avatar";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState(user);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!avatarFile) { setPreview(null); return; }
    const url = URL.createObjectURL(avatarFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const handleAvatar = (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const issue = imageError(file);
    setError(issue);
    if (!issue) setAvatarFile(file);
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const data = new FormData();
    data.append("email", profile.email);
    data.append("phone", profile.phone || "");
    if (avatarFile) data.append("avatar", avatarFile);
    try {
      const response = await api.patch("/profile/", data);
      setProfile(response.data);
      setAvatarFile(null);
      updateProfile(response.data);
      toast.success("Profil mis à jour.");
    } catch (failure) { setError(extractErrorMessage(failure)); }
    finally { setSaving(false); }
  };
  return <div className="auth-wrap page"><div className="card auth-card">
    <h1 className="text-center">Mon profil</h1>
    <form onSubmit={handleSubmit}>
      <fieldset className="form-fields stack gap-3" disabled={saving}>
        <div className="avatar-upload"><Avatar src={preview || profile.avatar} name={profile.username} size={96} />
          <label htmlFor="avatar">Photo de profil</label>
          <input id="avatar" className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} />
          <p className="field-hint">JPEG, PNG ou WebP, 5 Mo maximum.</p>
          {avatarFile && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAvatarFile(null)}>Annuler le changement de photo</button>}
        </div>
        <div className="field"><label htmlFor="profile-username">Nom d’utilisateur</label><input id="profile-username" className="input" value={profile.username} disabled /></div>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" className="input" required value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
        <div className="field"><label htmlFor="phone">Téléphone de contact</label><input id="phone" name="phone" type="tel" autoComplete="tel" className="input" maxLength={20} value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit">{saving ? "Enregistrement..." : "Enregistrer les modifications"}</button>
      </fieldset>
    </form>
  </div></div>;
}
