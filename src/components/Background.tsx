/**
 * Ambient background: slow-drifting colour blobs under a fine noise layer.
 * Mounted once in App; purely decorative, hidden from assistive tech.
 */
export const Background = () => (
  <div className="ambient" aria-hidden="true">
    <div className="ambient__blob ambient__blob--1" />
    <div className="ambient__blob ambient__blob--2" />
    <div className="ambient__blob ambient__blob--3" />
    <div className="ambient__noise" />
  </div>
);
