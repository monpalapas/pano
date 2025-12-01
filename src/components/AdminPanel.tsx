import { useEffect, useState } from 'react';

interface AdminPanelProps {
  onNavigate?: (view: string) => void;
}

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('Admin Panel');
  const [loading, setLoading] = useState(true);

  const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') === 'true';

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const fetchPage = async () => {
      try {
        const res = await fetch('http://localhost:9999/api/page?type=admin');
        if (res.ok) {
          const data = await res.json();
          setTitle(data.page.title);
          setContent(data.page.content);
        } else {
          setContent('Failed to load admin content from database. Using fallback.');
        }
      } catch (err) {
        console.warn('Could not fetch from /api/page, falling back to public/admin.txt');
        // Fallback to public file
        try {
          const fallback = await fetch('/admin.txt');
          if (fallback.ok) {
            const text = await fallback.text();
            setContent(text);
          }
        } catch {
          setContent('Failed to load admin content');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="bg-white/80 p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Admin Access Required</h2>
          <p className="mb-4">You must log in to view the admin panel.</p>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate?.('login')}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center">Loading admin...</div>;
  }

  return (
    <div className="p-6 bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <pre className="whitespace-pre-wrap text-sm bg-white/60 p-4 rounded">{content}</pre>
      )}
    </div>
  );
}
