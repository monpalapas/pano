import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Upload, 
  X, 
  Layers, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  Eye, 
  EyeOff, 
  MapPin, 
  Download,
  RotateCcw,
  Info
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-easybutton';
import 'leaflet-easybutton/src/easy-button.css';

// Fix for missing marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface KMLLayer {
  id: string;
  name: string;
  layer: L.LayerGroup;
  visible: boolean;
  color: string;
  fileName: string;
}

// Improved mock omnivore with better feature handling
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
        // Create mock features with properties
        const markers = [
          L.marker([13.037063508747957, 123.45890718599736], { 
            properties: { name: "Primary Location", description: "Main operational site" } 
          }),
          L.marker([13.1391, 123.7437], { 
            properties: { name: "Secondary Site", description: "Backup facility" } 
          })
        ];
        
        const polyline = L.polyline(
          [[13.037063508747957, 123.45890718599736], [13.1391, 123.7437]],
          { 
            color: '#3b82f6', 
            weight: 3,
            properties: { name: "Route Alpha", description: "Main transportation route" } 
          }
        );
        
        const polygon = L.polygon(
          [[13.03, 123.45], [13.04, 123.45], [13.04, 123.46], [13.03, 123.46]],
          { 
            color: '#ef4444', 
            weight: 2, 
            fillColor: '#ef4444',
            fillOpacity: 0.3,
            properties: { name: "Exclusion Zone", description: "Restricted area" } 
          }
        );

        markers.forEach(marker => {
          if (marker.options.properties) {
            marker.bindPopup(`<b>${marker.options.properties.name}</b><br>${marker.options.properties.description}`);
          }
          layerGroup.addLayer(marker);
        });
        layerGroup.addLayer(polyline);
        layerGroup.addLayer(polygon);

        // Trigger ready event
        eventHandlers.ready.forEach(handler => handler(layerGroup));
      } catch (error) {
        eventHandlers.error.forEach(handler => handler(error));
      }
    }, 800);

    return {
      on: (event: string, callback: Function) => {
        if (!eventHandlers[event]) eventHandlers[event] = [];
        eventHandlers[event].push(callback);
        return this;
      },
      eachLayer: (callback: Function) => {
        setTimeout(() => {
          const mockLayers = [
            L.marker([13.037063508747957, 123.45890718599736]),
            L.polyline([[13.037063508747957, 123.45890718599736], [13.1391, 123.7437]]),
            L.polygon([[13.03, 123.45], [13.04, 123.45], [13.04, 123.46], [13.03, 123.46]])
          ];
          mockLayers.forEach(layer => callback(layer));
        }, 0);
        return this;
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
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.037063508747957, 123.45890718599736]);

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    '#84cc16', '#06b6d4', '#7c3aed', '#f43f5e'
  ];

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Initialize map
    const map = L.map(mapContainer.current, {
      center: mapCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add attribution control
    L.control.attribution({ position: 'bottomright' }).addTo(map);

    // Add zoom controls
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add location marker
    const mainMarker = L.marker(mapCenter)
      .addTo(map)
      .bindPopup('Primary Location<br>Lat: 13.03706...<br>Lng: 123.45890...')
      .openPopup();

    // Add reference circle
    L.circle(mapCenter, {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      radius: 1000
    }).addTo(map);

    mapInstance.current = map;

    // Handle map move/zoom
    const updateMapCenter = () => {
      if (mapInstance.current) {
        const center = mapInstance.current.getCenter();
        setMapCenter([center.lat, center.lng]);
      }
    };
    
    map.on('moveend', updateMapCenter);
    map.on('zoomend', updateMapCenter);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('moveend', updateMapCenter);
        mapInstance.current.off('zoomend', updateMapCenter);
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapCenter]);

  // Reset success message after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !mapInstance.current) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const newLayers: KMLLayer[] = [];
    
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

              const layer = mockOmnivore.kml(url);
              
              layer.on('ready', (layerGroup: L.LayerGroup) => {
                layerGroup.eachLayer((l: any) => {
                  const color = colors[newLayers.length % colors.length];

                  if (l instanceof L.Marker) {
                    if (l.options.properties?.name) {
                      const content = `<b>${l.options.properties.name}</b><br>${l.options.properties.description || ''}`;
                      l.bindPopup(content);
                    }
                  } else if (l instanceof L.Polyline) {
                    l.setStyle({ color, weight: 3, opacity: 0.9 });
                    l.bindPopup(l.options.properties?.name || 'Feature');
                  } else if (l instanceof L.Polygon) {
                    l.setStyle({ 
                      color, 
                      weight: 2, 
                      opacity: 0.9, 
                      fillOpacity: 0.3,
                      fillColor: color
                    });
                    l.bindPopup(l.options.properties?.name || 'Polygon');
                  }
                });

                // Only add to map if it's the first layer or if we want all layers visible by default
                if (newLayers.length === 0) {
                  layerGroup.addTo(mapInstance.current!);
                }

                const bounds = layerGroup.getBounds();
                if (bounds.isValid()) {
                  if (newLayers.length === 0) {
                    mapInstance.current!.fitBounds(bounds, { padding: [50, 50] });
                  }
                }

                const newLayer: KMLLayer = {
                  id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                  name: file.name.replace('.kml', ''),
                  layer: layerGroup,
                  visible: newLayers.length === 0, // Only first layer visible by default
                  color: colors[newLayers.length % colors.length],
                  fileName: file.name,
                };

                newLayers.push(newLayer);
                resolve();
              });

              layer.on('error', (err: Error) => {
                console.error('KML load error:', err);
                setError(`Failed to load ${file.name}`);
                URL.revokeObjectURL(url);
                reject(err);
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

      // Update state with all new layers
      if (newLayers.length > 0) {
        setKmlLayers(prev => [...prev, ...newLayers]);
        setSuccess(`Successfully loaded ${newLayers.length} file${newLayers.length > 1 ? 's' : ''}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const toggleLayerVisibility = useCallback((id: string) => {
    setKmlLayers(prev =>
      prev.map(layer => {
        if (layer.id === id) {
          const newVisible = !layer.visible;
          if (newVisible) {
            mapInstance.current?.addLayer(layer.layer);
          } else {
            mapInstance.current?.removeLayer(layer.layer);
          }
          return { ...layer, visible: newVisible };
        }
        return layer;
      })
    );
  }, []);

  const removeLayer = useCallback((id: string) => {
    setKmlLayers(prev => {
      const layer = prev.find(l => l.id === id);
      if (layer && mapInstance.current) {
        mapInstance.current.removeLayer(layer.layer);
      }
      return prev.filter(l => l.id !== id);
    });
  }, []);

  const zoomToLayer = useCallback((id: string) => {
    const layer = kmlLayers.find(l => l.id === id);
    if (layer && mapInstance.current) {
      const bounds = layer.layer.getBounds();
      if (bounds.isValid()) {
        mapInstance.current.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
      }
    }
  }, [kmlLayers]);

  const handleZoomIn = () => mapInstance.current?.zoomIn();
  const handleZoomOut = () => mapInstance.current?.zoomOut();

  const handleFullscreen = () => {
    if (!mapContainer.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mapContainer.current.requestFullscreen();
    }
  };

  const flyToLocation = () => {
    if (mapInstance.current) {
      mapInstance.current.flyTo(mapCenter, 14, {
        animate: true,
        duration: 1.5
      });
    }
  };

  const resetView = () => {
    if (mapInstance.current) {
      mapInstance.current.setView(mapCenter, 14);
    }
  };

  const exportView = () => {
    if (!mapInstance.current) return;
    
    const center = mapInstance.current.getCenter();
    const zoom = mapInstance.current.getZoom();
    
    const viewData = {
      center: [center.lat, center.lng],
      zoom,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(viewData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map-view.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-[#1a1a2e]">Interactive Map</h2>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-2 rounded-lg z-10">
                  Upload KML files to visualize geographic data. Layers will appear in the sidebar.
                </div>
              </div>
            </div>
            <p className="text-sm text-[#1a1a2e]/70 mt-1">Upload and visualize KML files with advanced controls</p>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={resetView}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg shadow transition-all text-sm"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            
            <button
              onClick={exportView}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow transition-all text-sm"
              title="Export current view"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export View</span>
            </button>
            
            <button
              onClick={flyToLocation}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow transition-all text-sm"
              title="Go to primary location"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Go to Location</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
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
        
        {/* Status Messages */}
        {(error || success) && (
          <div className={`flex items-center gap-2 p-3 mt-3 rounded-lg text-sm ${
            error 
              ? 'bg-red-100 border border-red-300 text-red-700' 
              : 'bg-green-100 border border-green-300 text-green-700'
          }`}>
            {error ? <X className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {error || success}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative flex">
        <div 
          ref={mapContainer} 
          className="flex-1 relative"
          style={{ height: '100%' }}
        >
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="w-9 h-9 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center transition-all border border-gray-200"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-9 h-9 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center transition-all border border-gray-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={handleFullscreen}
              className="w-9 h-9 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center transition-all border border-gray-200"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <Maximize2 className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={flyToLocation}
              className="w-9 h-9 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center transition-all border border-gray-200"
              title="Go to primary location"
            >
              <MapPin className="w-4 h-4 text-gray-700" />
            </button>
          </div>
          
          {/* Coordinates Display */}
          {mapInstance.current && (
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium text-gray-700 border border-white/50">
              <div>Lat: {mapCenter[0].toFixed(6)}</div>
              <div>Lng: {mapCenter[1].toFixed(6)}</div>
            </div>
          )}
        </div>

        {/* Layers Panel */}
        {kmlLayers.length > 0 && (
          <div className="w-72 bg-white/95 backdrop-blur-sm border-l border-white/50 p-4 overflow-y-auto max-h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-800">Layers ({kmlLayers.length})</h3>
              </div>
              <button
                onClick={() => kmlLayers.forEach(layer => removeLayer(layer.id))}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                title="Remove all layers"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {kmlLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-3 h-3 rounded mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: layer.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate" title={layer.fileName}>
                        {layer.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1" title={layer.fileName}>
                        {layer.fileName}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          onClick={() => toggleLayerVisibility(layer.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title={layer.visible ? 'Hide layer' : 'Show layer'}
                        >
                          {layer.visible ? (
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => zoomToLayer(layer.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Zoom to layer"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => removeLayer(layer.id)}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors ml-auto"
                          title="Remove layer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
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

      {/* Empty State */}
      {kmlLayers.length === 0 && !uploading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg max-w-md">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-700 mb-2">No KML files loaded</p>
            <p className="text-sm text-gray-500 mb-4">Upload KML files to visualize geographic data on the map</p>
            <div className="bg-blue-50 p-3 rounded-lg text-left mt-2">
              <p className="text-sm font-medium text-blue-800 mb-1">Primary Location:</p>
              <p className="text-xs text-blue-700">Latitude: {mapCenter[0].toFixed(6)}</p>
              <p className="text-xs text-blue-700">Longitude: {mapCenter[1].toFixed(6)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}