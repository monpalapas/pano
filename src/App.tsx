import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ImageGallery from './components/ImageGallery';
import PanoramaGallery from './components/PanoramaGallery';
import InteractiveMap from './components/InteractiveMap';
import { driveFolders } from './config/driveFolders';

function App() {
  const [activeView, setActiveView] = useState('panorama');
  const [isBoundaryOpen, setIsBoundaryOpen] = useState(false);

  const handleNavigate = (view: string) => {
    setActiveView(view);
    if (view !== 'purok' && view !== 'barangay' && view !== 'municipal') {
      setIsBoundaryOpen(false);
    }
  };

  const handleToggleBoundary = () => {
    setIsBoundaryOpen(!isBoundaryOpen);
  };

  const renderContent = () => {
    if (activeView === 'interactive') {
      return <InteractiveMap />;
    }

    const folder = driveFolders[activeView];
    if (folder) {
      if (activeView === 'panorama') {
        return <PanoramaGallery folderId={folder.folderId} title={folder.title} />;
      }
      return <ImageGallery folderId={folder.folderId} title={folder.title} />;
    }
    return (
      <div className="w-full h-full bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/50 flex items-center justify-center">
        <p className="text-[#1a1a2e] text-xl font-semibold">Select a view from the sidebar</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-pink-400 to-sky-500">
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isBoundaryOpen={isBoundaryOpen}
        onToggleBoundary={handleToggleBoundary}
      />

      <div className="ml-64 min-h-screen flex flex-col">
        <TopBar />

        <main className="flex-1 p-8">
          <div className="h-full min-h-[calc(100vh-8rem)]">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
