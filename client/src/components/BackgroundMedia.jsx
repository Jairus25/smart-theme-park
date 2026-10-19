export default function BackgroundMedia({ source }) {
  const mediaBaseUrl = (import.meta.env.VITE_MEDIA_URL || (import.meta.env.PROD
    ? "https://media.githubusercontent.com/media/Jairus25/smart-theme-park/jairus_auth/client/public/media"
    : "/media")).replace(/\/$/, "");

  return (
    <div className="background-media" aria-hidden="true">
      <video key={source} className="background-video background-video-primary" autoPlay loop muted playsInline preload="metadata">
        <source src={`${mediaBaseUrl}/${source}`} type="video/mp4" />
      </video>
      <div className="background-wash" />
      <div className="background-glow background-glow-one" />
      <div className="background-glow background-glow-two" />
    </div>
  );
}