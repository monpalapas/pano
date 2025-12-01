import { useEffect, useState } from 'react';

interface LoginPageProps {
  onLogin?: () => void;
  onNavigate?: (view: string) => void;
}

export default function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('Login');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch('http://localhost:9999/api/page?type=login');
        if (res.ok) {
          const data = await res.json();
          setTitle(data.page.title);
          setContent(data.page.content);
        } else {
          setContent('Failed to load login content from database. Using fallback.');
        }
      } catch (err) {
        console.warn('Could not fetch from /api/page, falling back to public/login.txt');
        // Fallback to public file
        try {
          const fallback = await fetch('/login.txt');
          if (fallback.ok) {
            const text = await fallback.text();
            setContent(text);
          }
        } catch {
          setContent('Failed to load login content');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a password');
      return;
    }

    // Simple client-side login: accept any non-empty password.
    localStorage.setItem('isLoggedIn', 'true');
    onLogin?.();
    onNavigate?.('admin');
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="max-w-xl w-full bg-white/80 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>

        {loading ? (
          <p className="text-gray-600 mb-4">Loading...</p>
        ) : (
          <div className="mb-4 text-sm whitespace-pre-wrap">{content}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded">Sign In</button>
            <button
              type="button"
              onClick={() => onNavigate?.('panorama')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
