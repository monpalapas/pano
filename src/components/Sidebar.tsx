import { ChevronDown } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isBoundaryOpen: boolean;
  onToggleBoundary: () => void;
}

export default function Sidebar({ activeView, onNavigate, isBoundaryOpen, onToggleBoundary }: SidebarProps) {
  const menuItems = [
    { id: 'panorama', label: 'PANORAMA' },
    { id: 'basemap', label: 'BASE MAP' },
    { id: 'elevation', label: 'ELEVATION MAP' },
    { id: 'evacuation', label: 'EVACUATION' },
    { id: 'hazards', label: 'HAZARDS' },
  ];

  const boundaryItems = [
    { id: 'purok', label: 'PUROK' },
    { id: 'barangay', label: 'BARANGAY' },
    { id: 'municipal', label: 'MUNICIPAL' },
  ];

  return (
    <div className="w-64 bg-[#000080] h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-4 flex items-center gap-3 border-b border-blue-600">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        <div className="text-white">
          <div className="font-bold text-sm">MDRRMO</div>
          <div className="text-xs">PIO DURAN</div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all ${
              activeView === item.id
                ? 'bg-white text-[#000080] shadow-lg'
                : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-md'
            }`}
          >
            {item.label}
          </button>
        ))}

        <div>
          <button
            onClick={onToggleBoundary}
            className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-between ${
              isBoundaryOpen
                ? 'bg-white text-[#000080] shadow-lg'
                : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-md'
            }`}
          >
            BOUNDARY MAP
            <ChevronDown className={`w-4 h-4 transition-transform ${isBoundaryOpen ? 'rotate-180' : ''}`} />
          </button>

          {isBoundaryOpen && (
            <div className="mt-2 ml-4 space-y-2">
              {boundaryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full py-2 px-4 rounded-lg font-medium text-xs transition-all ${
                    activeView === item.id
                      ? 'bg-blue-400 text-white shadow'
                      : 'bg-blue-300/50 text-white hover:bg-blue-400/70'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate('interactive')}
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all ${
            activeView === 'interactive'
              ? 'bg-white text-[#000080] shadow-lg'
              : 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-md'
          }`}
        >
          INTERACTIVE
        </button>
      </nav>

      <div className="p-4">
        <div className="space-y-2">
          <button
            onClick={() => onNavigate('login')}
            className="w-full py-3 px-4 rounded-lg bg-white/90 text-[#000080] font-medium text-sm hover:bg-white hover:shadow-md transition-all"
          >
            LOGIN
          </button>

          <button
            onClick={() => onNavigate('admin')}
            className="w-full py-3 px-4 rounded-lg bg-white/90 text-[#000080] font-medium text-sm hover:bg-white hover:shadow-md transition-all"
          >
            ADMIN
          </button>

          <button className="w-full py-3 px-4 rounded-lg bg-blue-400/50 text-white/80 font-light text-sm hover:bg-blue-400/70 transition-all italic">
            + Add Button
          </button>
        </div>
      </div>
    </div>
  );
}