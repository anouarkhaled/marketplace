function Spinner({ size = "md", label = "Chargement..." }) {
  return (
    <div className="loading-block" role="status">
      <div className={`spinner ${size === "lg" ? "spinner-lg" : ""}`} />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export default Spinner;
