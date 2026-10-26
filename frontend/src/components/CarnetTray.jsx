import { Link, useLocation } from "react-router-dom";
import useCarnet from "../hooks/useCarnet";
import Icon from "./Icons";
export default function CarnetTray() {
  const { ids, clear } = useCarnet();
  const { pathname } = useLocation();
  if (!ids.length || pathname === "/carnet") return null;
  return <aside className="carnet-tray" aria-label="Votre sélection"><span><strong>Le carnet</strong><small>{ids.length}/3 trouvailles à comparer</small></span><Link className="btn carnet-cta" to="/carnet">Ouvrir <Icon name="arrow-right" size={17} /></Link><button className="tray-close" onClick={clear} aria-label="Vider le carnet"><Icon name="x" size={18} /></button></aside>;
}
