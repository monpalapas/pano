import { useEffect, useRef, useState } from 'react';

interface Location {
  name: string;
  id: string;
  imageUrl: string;
}

const locations: Location[] = [
  {
    name: 'Site A - Main Plaza',
    id: 'site-a',
    imageUrl: 'https://placehold.co/1200x600/1e40af/white?text=Main+Plaza+Panorama'
  },
  {
    name: 'Site B - Emergency Center',
    id: 'site-b',
    imageUrl: 'https://placehold.co/1200x600/7e22ce/white?text=Emergency+Center+View'
  },
  {
    name: 'Site C - Evacuation Point',
    id: 'site-c',
    imageUrl: 'https://placehold.co/1200x600/0d9488/white?text=Evacuation+Point+360'
  }
];

export default function PanoramaViewer() {
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Transform state
  const [zoom, setZoom] = useState<number>(1.2);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const pointerRef = useRef<{ id: number | null; lastX: number; lastY: number }>({ id: null, lastX: 0, lastY: 0 });

  const currentLocation = locations.find((l) => l.id === selectedLocation)!;

  useEffect(() => {
    // Reset state when location changes
    setIsLoading(true);
    setError(null);
    setZoom(1.2);
    setOffset({ x: 0, y: 0 });
  }, [selectedLocation]);

  const clampOffset = (x: number, y: number) => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return { x, y };

    const cRect = container.getBoundingClientRect();
    const maxX = Math.max(0, (img.naturalWidth * zoom - cRect.width) / 2);
    const maxY = Math.max(0, (img.naturalHeight * zoom - cRect.height) / 2);

    const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));
    return { x: clamp(x, maxX), y: clamp(y, maxY) };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointerRef.current = { id: e.pointerId, lastX: e.clientX, lastY: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerRef.current.id !== e.pointerId) return;
    const dx = e.clientX - pointerRef.current.lastX;
    const dy = e.clientY - pointerRef.current.lastY;
    pointerRef.current.lastX = e.clientX;
    pointerRef.current.lastY = e.clientY;
    setOffset((prev) => {
      const next = { x: prev.x + dx, y: prev.y + dy };
      return clampOffset(next.x, next.y);
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}
    pointerRef.current.id = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY / 500; // smooth zoom factor
    setZoom((z) => {
      const next = Math.max(1, Math.min(3, z + delta));
      return next;
    });
  };

  useEffect(() => {
    // Ensure offset stays valid when zoom changes
    setOffset((o) => clampOffset(o.x, o.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  const onImgLoad = () => {
    setIsLoading(false);
  };

  const onImgError = () => {
    setIsLoading(false);
    setError('Failed to load image');
  };

  return (
    <div className="w-full h-full bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-white/50 flex flex-col">
      <div className="mb-4">
        <label className="block text-[#1a1a2e] font-semibold mb-2 text-sm">Select Location:</label>
        <div className="relative">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/80 border-2 border-white/60 shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-700 font-medium transition-all appearance-none"
            disabled={isLoading}
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>

      <div
        className="flex-1 rounded-2xl overflow-hidden shadow-inner bg-gray-900 relative"
        onWheel={handleWheel}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-white font-medium">Loading panorama...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="text-center p-6 bg-red-500/20 rounded-xl max-w-md">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-2">Error Loading Panorama</h3>
              <p className="text-red-200 mb-4">{error}</p>
              <button
                onClick={() => setSelectedLocation(selectedLocation)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="w-full h-full min-h-[400px] relative touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="absolute inset-0 overflow-hidden">
            <img
              ref={imgRef}
              src={currentLocation.imageUrl}
              alt={`${currentLocation.name} Panorama`}
              onLoad={onImgLoad}
              onError={onImgError}
              style={{
                transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
                transformOrigin: 'center center',
                transition: isLoading ? 'none' : 'transform 0.15s ease'
              }}
              className="w-full h-full object-cover will-change-transform"
              draggable={false}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

            <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg z-10">
              <h3 className="font-bold text-lg">{currentLocation.name}</h3>
            </div>

            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
              360° Panorama View
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-white/30 text-center">
                <div className="text-5xl mb-2">🔄</div>
                <p className="text-lg">Drag to explore</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50/80 rounded-lg p-3">
          <div className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Current Location</div>
          <div className="text-sm font-bold text-gray-800 truncate">{currentLocation?.name}</div>
        </div>
        <div className="bg-purple-50/80 rounded-lg p-3">
          <div className="text-xs text-purple-700 font-semibold uppercase tracking-wide">Status</div>
          <div className="text-sm font-bold text-gray-800">{isLoading ? 'Loading...' : 'Active'}</div>
        </div>
        <div className="bg-cyan-50/80 rounded-lg p-3">
          <div className="text-xs text-cyan-700 font-semibold uppercase tracking-wide">Controls</div>
          <div className="text-sm font-bold text-gray-800">Mouse & Touch</div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-[#1a1a2e]/70 font-medium flex flex-wrap justify-center gap-2">
        <span className="bg-white/50 px-2 py-1 rounded">🖱️ Mouse: Look around</span>
        <span className="bg-white/50 px-2 py-1 rounded">👆 Touch: Swipe to explore</span>
        <span className="bg-white/50 px-2 py-1 rounded">🔍 Scroll: Zoom (simulated)</span>
      </div>
    </div>
  );
}