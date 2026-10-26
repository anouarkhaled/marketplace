import Icon from "./Icons";

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="btn btn-secondary btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <Icon name="arrow-left" size={16} /> Précédent
      </button>

      <span aria-live="polite" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
        Page {page} sur {totalPages}
      </span>

      <button
        className="btn btn-secondary btn-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Suivant <Icon name="arrow-right" size={16} />
      </button>
    </nav>
  );
}

export default Pagination;
