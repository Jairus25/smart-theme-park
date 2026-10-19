export default function BackgroundMedia({ source }) {
  return (
    <div className="background-media" aria-hidden="true">
      <video key={source} className="background-video background-video-primary" autoPlay loop muted playsInline preload="metadata">
        <source src={`/media/${source}`} type="video/mp4" />
      </video>
      <div className="background-wash" />
      <div className="background-glow background-glow-one" />
      <div className="background-glow background-glow-two" />
    </div>
  );
}