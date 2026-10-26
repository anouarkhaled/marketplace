import Icon from "./Icons";

function EmptyState({ icon = "search", title = "Aucun résultat trouvé", description = "Essayez de modifier vos critères de recherche.", action = null }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name={icon} size={32} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: "1.25rem" }}>{action}</div>}
    </div>
  );
}

export default EmptyState;
