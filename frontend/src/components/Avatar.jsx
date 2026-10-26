function Avatar({ src, name = "?", size = 40 }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (src) {
    return <img src={src} alt={name} className="avatar" style={style} />;
  }
  return (
    <div className="avatar" style={style}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default Avatar;
