please enhance the code and make the grid view image size 200px by 131px:

import { useState, useEffect } from 'react';
import { Loader2, ZoomIn, X, AlertCircle, Copy, Download, Check } from 'lucide-react';

interface ImageData {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  viewUrl: string;
}

interface ImageGalleryProps {
  folderId: string;
  title: string;
}

export default function ImageGallery({ folderId, title }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !anonKey) {
          throw new Error('Supabase configuration missing');
        }

        const response = await fetch(
          `${supabaseUrl}/functions/v1/fetch-drive-images?folderId=${encodeURIComponent(folderId)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch images: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.images) {
          setImages(data.images);
        } else {
          setError(data.error || 'Failed to fetch images');
          setImages([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error loading images:', errorMessage);
        setError(errorMessage);
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [folderId]);

  const openImageModal = (image: ImageData) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setCopied(false);
  };

  const copyImageUrl = async () => {
    if (!selectedImage) return;
    try {
      await navigator.clipboard.writeText(selectedImage.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadImage = () => {
    if (!selectedImage) return;
    const link = document.createElement('a');
    link.href = selectedImage.url;
    link.download = selectedImage.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/50">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-[#1a1a2e] mb-2">{title}</h2>
        <div className="h-1 w-24 bg-gradient-to-r from-sky-400 to-blue-600 rounded-full"></div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
            <p className="text-[#1a1a2e]/70 font-medium">Loading images from Google Drive...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-[#1a1a2e] font-semibold mb-2">Error Loading Images</p>
            <p className="text-[#1a1a2e]/70 text-sm">{error}</p>
          </div>
        </div>
      ) : images.length === 0 ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-[#1a1a2e]/70 font-medium text-lg">No images found in this folder</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-white/60 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
              onClick={() => openImageModal(image)}
            >
              <img
                src={image.thumbnailUrl}
                alt={image.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                  <span className="text-white font-semibold text-sm truncate">
                    {image.name}
                  </span>
                  <ZoomIn className="w-5 h-5 text-white flex-shrink-0 ml-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation();
                copyImageUrl();
              }}
              title="Copy image URL"
            >
              {copied ? (
                <Check className="w-6 h-6 text-green-400" />
              ) : (
                <Copy className="w-6 h-6 text-white" />
              )}
            </button>
            <button
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation();
                downloadImage();
              }}
              title="Download image"
            >
              <Download className="w-6 h-6 text-white" />
            </button>
            <button
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md"
              onClick={closeImageModal}
              title="Close"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="max-w-7xl max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <p className="text-white text-center mt-4 font-medium">{selectedImage.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
