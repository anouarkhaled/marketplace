const fieldLabels = {
  username: "Nom d’utilisateur", email: "Email", phone: "Téléphone", password: "Mot de passe",
  password2: "Confirmation", new_password: "Nouveau mot de passe", title: "Titre",
  description: "Description", price: "Prix", location: "Localisation", category: "Catégorie",
  image: "Photo", avatar: "Photo de profil", body: "Message", is_active: "Statut de l’annonce",
};

export function extractErrorMessage(error, fallback = "Une erreur est survenue.") {
  if (error?.response?.status === 429) return "Trop de tentatives. Veuillez patienter avant de réessayer.";
  if (!error?.response) return "Connexion au serveur impossible. Vérifiez votre connexion et réessayez.";
  if (error.response.status >= 500) return "Le service est temporairement indisponible. Veuillez réessayer.";
  const data = error.response.data;
  if (!data || typeof data !== "object") return fallback;
  const key = Object.keys(data)[0];
  if (!key) return fallback;
  const value = Array.isArray(data[key]) ? data[key].join(" ") : data[key];
  if (typeof value !== "string") return fallback;
  return fieldLabels[key] ? `${fieldLabels[key]} : ${value}` : value;
}
