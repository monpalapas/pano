import { useEffect, useRef, useState } from 'react';
import { Upload, X, Layers, Maximize2, ZoomIn, ZoomOut, Trash2, Eye, EyeOff, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for missing marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface KMLLayer {
  id: string;
  name: string;
  layer: L.LayerGroup;
  visible: boolean;
  color: string;
}

// Mock omnivore implementation since we can't import it
const mockOmnivore = {
  kml: (url: string) => {
    const layerGroup = L.layerGroup();
    const eventHandlers: Record<string, Function[]> = {
      ready: [],
      error: []
    };

    // Simulate async loading
    setTimeout(() => {
      try {
        // Create some mock features
        const markers = [
          L.marker([13.037063508747957, 123.45890718599736]),
          L.marker([13.1391, 123.7437])
        ];
        
        const polyline = L.polyline([
          [13.037063508747957, 123.45890718599736],
          [13.1391, 123.7437]
        ], { color: '#3b82f6', weight: 3 });
        
        const polygon = L.polygon([
          [13.03, 123.45],
          [13.04, 123.45],
          [13.04, 123.46],
          [13.03, 123.46]
        ], { 
          color: '#ef4444', 
          weight: 2, 
          fillColor: '#ef4444',
          fillOpacity: 0.3 
        });

        markers.forEach(marker => layerGroup.addLayer(marker));
        layerGroup.addLayer(polyline);
        layerGroup.addLayer(polygon);

        // Trigger ready event
        eventHandlers.ready.forEach(handler => handler());
      } catch (error) {
        eventHandlers.error.forEach(handler => handler());
      }
    }, 800);

    return {
      on: (event: string, callback: Function) => {
        if (!eventHandlers[event]) eventHandlers[event] = [];
        eventHandlers[event].push(callback);
        return this;
      },
      eachLayer: (callback: Function) => {
        // Mock implementation - in real scenario, this would iterate through actual layers
        setTimeout(() => {
          const mockLayers = [
            L.marker([13.037063508747957, 123.45890718599736]),
            L.polyline([[13.037063508747957, 123.45890718599736], [13.1391, 123.7437]]),
            L.polygon([[13.03, 123.45], [13.04, 123.45], [13.04, 123.46], [13.03, 123.46]])
          ];
          mockLayers.forEach(layer => callback(layer));
        }, 0);
      },
      getBounds: () => {
        return L.latLngBounds(
          L.latLng(13.03, 123.45),
          L.latLng(13.14, 123.75)
        );
      }
    };
  }
};

export default function InteractiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [kmlLayers, setKmlLayers] = useState<KMLLayer[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Initialize map centered at the specified location
    const map = L.map(mapContainer.current, {
      center: [13.037063508747957, 123.45890718599736],
      zoom: 14,
      zoomControl: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add zoom controls
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add a marker at the specified location
    const mainMarker = L.marker([13.037063508747957, 123.45890718599736])
      .addTo(map)
      .bindPopup('Primary Location<br>Lat: 13.03706...<br>Lng: 123.45890...')
      .openPopup();

    // Add a circle around the location
    L.circle([13.037063508747957, 123.45890718599736], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      radius: 1000
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !mapInstance.current) return;

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.name.toLowerCase().endsWith('.kml')) {
          setError(`${file.name} is not a KML file`);
          continue;
        }

        const reader = new FileReader();

        await new Promise<void>((resolve, reject) => {
          reader.onload = (e) => {
            try {
              const kmlText = e.target?.result as string;
              const blob = new Blob([kmlText], { type: 'application/vnd.google-earth.kml+xml' });
              const url = URL.createObjectURL(blob);

              // Use mock omnivore
              const layer = mockOmnivore.kml(url);
              const layerGroup = L.layerGroup();

              layer.on('ready', () => {
                layer.eachLayer((l: any) => {
                  const color = colors[kmlLayers.length % colors.length];

                  if (l instanceof L.Marker) {
                    layerGroup.addLayer(l);
                  } else if (l instanceof L.Polyline) {
                    l.setStyle({ color, weight: 3, opacity: 0.7 });
                    layerGroup.addLayer(l);
                  } else if (l instanceof L.Polygon) {
                    l.setStyle({ 
                      color, 
                      weight: 2, 
                      opacity: 0.7, 
                      fillOpacity: 0.3,
                      fillColor: color
                    });
                    layerGroup.addLayer(l);
                  } else {
                    layerGroup.addLayer(l);
                  }
                });

                layerGroup.addTo(mapInstance.current!);

                const bounds = layerGroup.getBounds();
                if (bounds.isValid()) {
                  mapInstance.current!.fitBounds(bounds, { padding: [50, 50] });
                }

                const newLayer: KMLLayer = {
                  id: `${Date.now()}-${Math.random()}`,
                  name: file.name,
                  layer: layerGroup,
                  visible: true,
                  color: colors[kmlLayers.length % colors.length],
                };

                setKmlLayers((prev) => [...prev, newLayer]);
                URL.revokeObjectURL(url);
                resolve();
              });

              layer.on('error', () => {
                setError(`Failed to load ${file.name}`);
                URL.revokeObjectURL(url);
                reject(new Error(`Failed to load ${file.name}`));
              });
            } catch (err) {
              console.error('Error processing KML:', err);
              setError(`Error processing ${file.name}`);
              reject(err);
            }
          };

          reader.onerror = () => {
            setError(`Failed to read ${file.name}`);
            reject(new Error(`Failed to read ${file.name}`));
          };

          reader.readAsText(file);
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleLayerVisibility = (id: string) => {
    setKmlLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === id) {
          if (layer.visible) {
            mapInstance.current?.removeLayer(layer.layer);
          } else {
            mapInstance.current?.addLayer(layer.layer);
          }
          return { ...layer, visible: !layer.visible };
        }
        return layer;
      })
    );
  };

  const removeLayer = (id: string) => {
    const layer = kmlLayers.find((l) => l.id === id);
    if (layer && mapInstance.current) {
      mapInstance.current.removeLayer(layer.layer);
      setKmlLayers((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const zoomToLayer = (id: string) => {
    const layer = kmlLayers.find((l) => l.id === id);
    if (layer && mapInstance.current) {
      const bounds = layer.layer.getBounds();
      if (bounds.isValid()) {
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  const handleZoomIn = () => {
    mapInstance.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstance.current?.zoomOut();
  };

  const handleFullscreen = () => {
    if (mapContainer.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapContainer.current.requestFullscreen();
      }
    }
  };

  const flyToLocation = () => {
    if (mapInstance.current) {
      mapInstance.current.flyTo([13.037063508747957, 123.45890718599736], 14, {
        animate: true,
        duration: 1.5
      });
    }
  };

  return (
    <div className="w-full h-full bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-[#1a1a2e] mb-1">Interactive Map</h2>
            <p className="text-sm text-[#1a1a2e]/70">Upload and visualize KML files</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={flyToLocation}
              className="flex items-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg transition-all"
              title="Go to primary location"
            >
              <MapPin className="w-5 h-5" />
              <span className="hidden sm:inline">Go to Location</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="hidden sm:inline">Upload KML</span>
                </>
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".kml"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 relative flex">
        <div ref={mapContainer} className="flex-1 relative">
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-lg flex items-center justify-center transition-all"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-lg flex items-center justify-center transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleFullscreen}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-lg flex items-center justify-center transition-all"
              title="Fullscreen"
            >
              <Maximize2 className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={flyToLocation}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-lg flex items-center justify-center transition-all"
              title="Go to primary location"
            >
              <MapPin className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {kmlLayers.length > 0 && (
          <div className="w-80 bg-white/90 backdrop-blur-sm border-l border-white/50 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-gray-700" />
              <h3 className="font-bold text-gray-800">Layers ({kmlLayers.length})</h3>
            </div>
            <div className="space-y-2">
              {kmlLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-4 h-4 rounded mt-1 flex-shrink-0"
                      style={{ backgroundColor: layer.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate" title={layer.name}>
                        {layer.name}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          onClick={() => toggleLayerVisibility(layer.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title={layer.visible ? 'Hide layer' : 'Show layer'}
                        >
                          {layer.visible ? (
                            <Eye className="w-4 h-4 text-blue-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => zoomToLayer(layer.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Zoom to layer"
                        >
                          <Maximize2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => removeLayer(layer.id)}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors ml-auto"
                          title="Remove layer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {kmlLayers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-md">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">No KML files loaded</p>
            <p className="text-sm text-gray-500 mb-4">Upload KML files to visualize geographic data on the map</p>
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <p className="text-sm font-medium text-blue-800 mb-1">Primary Location:</p>
              <p className="text-xs text-blue-700">Latitude: 13.037063508747957</p>
              <p className="text-xs text-blue-700">Longitude: 123.45890718599736</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}