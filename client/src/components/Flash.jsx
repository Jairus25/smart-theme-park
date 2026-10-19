export default function Flash({ message, type = "success", onClose }) {
  if (!message) return null;
  return (
    <div className={`flash flash-${type}`}>
      {message}
      <button className="flash-close" onClick={onClose} aria-label="dismiss">×</button>
    </div>
  );
}
