import useCarnet from "../hooks/useCarnet";
import Icon from "./Icons";
export default function CarnetButton({ listing }) {
  const { ids, toggle } = useCarnet();
  const selected = ids.includes(listing.id);
  return <button className={`carnet-button${selected ? " selected" : ""}`} aria-pressed={selected} aria-label={`${selected ? "Retirer du" : "Ajouter au"} carnet : ${listing.title}`} onClick={() => toggle(listing.id)}><Icon name={selected ? "check" : "plus"} size={15} />{selected ? "Dans le carnet" : "Comparer"}</button>;
}
