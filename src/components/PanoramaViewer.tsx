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
  const viewerContainer = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerContainer.current) return;

    const currentLocation = locations.find(loc => loc.id === selectedLocation);
    if (!currentLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      // Clear previous content
      viewerContainer.current.innerHTML = '';

      // Create panorama viewer container
      const viewerElement = document.createElement('div');
      viewerElement.className = 'w-full h-full relative bg-gray-900 flex items-center justify-center';
      
      // Create interactive panorama simulation
      viewerElement.innerHTML = `
        <div class="absolute inset-0 overflow-hidden">
          <img 
            src="${currentLocation.imageUrl}" 
            alt="${currentLocation.name} Panorama" 
            class="w-full h-full object-cover transition-opacity duration-500"
            style="transform: scale(1.2);"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>
        
        <div class="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg z-10">
          <h3 class="font-bold text-lg">${currentLocation.name}</h3>
        </div>
        
        <div class="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
          360° Panorama View
        </div>
        
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="text-white/30 text-center">
            <div class="text-5xl mb-2">🔄</div>
            <p class="text-lg">Drag to explore</p>
          </div>
        </div>
      `;

      // Add interactive behavior
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let translateX = 0;
      let translateY = 0;
      let currentTranslateX = 0;
      let currentTranslateY = 0;

      const imgElement = viewerElement.querySelector('img');
      
      if (imgElement) {
        const startDrag = (e: MouseEvent | TouchEvent) => {
          isDragging = true;
          const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
          const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
          startX = clientX - translateX;
          startY = clientY - translateY;
          if (imgElement) {
            imgElement.style.transition = 'none';
          }
        };

        const drag = (e: MouseEvent | TouchEvent) => {
          if (!isDragging) return;
          e.preventDefault();
          const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
          const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
          translateX = clientX - startX;
          translateY = clientY - startY;
          
          // Limit movement
          const maxMove = 200;
          translateX = Math.max(-maxMove, Math.min(maxMove, translateX));
          translateY = Math.max(-maxMove, Math.min(maxMove, translateY));
          
          currentTranslateX = translateX * 0.5;
          currentTranslateY = translateY * 0.5;
          
          if (imgElement) {
            imgElement.style.transform = `scale(1.2) translate(${currentTranslateX}px, ${currentTranslateY}px)`;
          }
        };

        const endDrag = () => {
          isDragging = false;
          if (imgElement) {
            imgElement.style.transition = 'transform 0.3s ease';
            imgElement.style.transform = 'scale(1.2)';
            translateX = 0;
            translateY = 0;
          }
        };

        viewerElement.addEventListener('mousedown', startDrag);
        viewerElement.addEventListener('touchstart', startDrag);
        viewerElement.addEventListener('mousemove', drag);
        viewerElement.addEventListener('touchmove', drag);
        viewerElement.addEventListener('mouseup', endDrag);
        viewerElement.addEventListener('touchend', endDrag);
        viewerElement.addEventListener('mouseleave', endDrag);
      }

      viewerContainer.current.appendChild(viewerElement);
      
      // Simulate loading delay
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    } catch (err) {
      console.error('Error loading panorama:', err);
      setError('Failed to load panorama view');
      setIsLoading(false);
    }
  }, [selectedLocation]);

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId);
  };

  const currentLocation = locations.find(loc => loc.id === selectedLocation);

  return (
    <div className="w-full h-full bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-white/50 flex flex-col">
      <div className="mb-4">
        <label className="block text-[#1a1a2e] font-semibold mb-2 text-sm">
          Select Location:
        </label>
        <div className="relative">
          <select
            value={selectedLocation}
            onChange={(e) => handleLocationChange(e.target.value)}
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

      <div className="flex-1 rounded-2xl overflow-hidden shadow-inner bg-gray-900 relative">
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
                onClick={() => handleLocationChange(selectedLocation)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        <div ref={viewerContainer} className="w-full h-full min-h-[400px]"></div>
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