import { useEffect, useState } from 'react';
import { Settings, Database, FileText, LogOut } from 'lucide-react';

interface AdminPanelProps {
  onNavigate?: (view: string) => void;
}

interface Page {
  id: number;
  type: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface DBInfo {
  version: string;
  tables: string[];
  tableCount: number;
}

type Tab = 'pages' | 'database' | 'settings';

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('pages');
  const [pages, setPages] = useState<Page[]>([]);
  const [dbInfo, setDbInfo] = useState<DBInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    if (!isLoggedIn) return;
    loadData();
  }, [isLoggedIn, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'pages') {
        const res = await fetch('http://localhost:9999/api/pages');
        if (res.ok) {
          const data = await res.json();
          setPages(data.pages);
        } else {
          setError('Failed to load pages');
        }
      } else if (activeTab === 'database') {
        const res = await fetch('http://localhost:9999/api/db-info');
        if (res.ok) {
          const data = await res.json();
          setDbInfo(data);
        } else {
          setError('Failed to load database info');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPage = (page: Page) => {
    setEditingPage(page.type);
    setEditTitle(page.title);
    // Fetch full content
    fetch(`http://localhost:9999/api/page?type=${page.type}`)
      .then(r => r.json())
      .then(data => setEditContent(data.page.content))
      .catch(() => setEditContent(''));
  };

  const handleSavePage = async () => {
    if (!editingPage || !editTitle || !editContent) {
      setError('All fields are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`http://localhost:9999/api/page/${editingPage}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent })
      });

      if (res.ok) {
        setEditingPage(null);
        await loadData();
        setError(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save page');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    onNavigate?.('panorama');
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="bg-white/80 p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Admin Access Required</h2>
          <p className="mb-4">You must log in to view the admin panel.</p>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate?.('login')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/30 bg-white/10 px-6">
        <button
          onClick={() => setActiveTab('pages')}
          className={`px-4 py-3 font-semibold flex items-center gap-2 transition ${
            activeTab === 'pages'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <FileText size={18} />
          Pages
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-3 font-semibold flex items-center gap-2 transition ${
            activeTab === 'database'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <Database size={18} />
          Database
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 font-semibold flex items-center gap-2 transition ${
            activeTab === 'settings'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : (
          <>
            {/* Pages Tab */}
            {activeTab === 'pages' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Manage Pages</h2>
                {editingPage ? (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Edit Page: {editingPage}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Content</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={10}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSavePage}
                          disabled={saving}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingPage(null)}
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pages.map((page) => (
                      <div key={page.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-900">{page.title}</h3>
                          <p className="text-sm text-gray-500">Type: {page.type}</p>
                          <p className="text-xs text-gray-400">Updated: {new Date(page.updated_at).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => handleEditPage(page)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Database Tab */}
            {activeTab === 'database' && dbInfo && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Database Information</h2>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">PostgreSQL Version</p>
                      <p className="text-lg font-semibold text-gray-900">{dbInfo.version}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Tables</p>
                      <p className="text-lg font-semibold text-gray-900">{dbInfo.tableCount}</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Tables</h3>
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <ul className="space-y-1">
                        {dbInfo.tables.map((table) => (
                          <li key={table} className="text-sm text-gray-700 font-mono">
                            • {table}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">App Settings</h2>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">App Name</label>
                      <input
                        type="text"
                        defaultValue="Pano Dashboard"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Currently read-only. Edit in package.json</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Server Port</label>
                      <input
                        type="text"
                        defaultValue="9999"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Environment</label>
                      <input
                        type="text"
                        defaultValue={process.env.NODE_ENV || 'development'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Backend URL</label>
                      <input
                        type="text"
                        defaultValue="http://localhost:9999"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
