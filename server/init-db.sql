-- Create pages table for login and admin content
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL, -- 'login' or 'admin'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed data
INSERT INTO pages (type, title, content) VALUES
  (
    'login',
    'Login Page',
    'Welcome to the Pano Dashboard\n\nPlease enter your password to access the admin panel.\n\nDefault credentials are configured in your Neon database.'
  ),
  (
    'admin',
    'Admin Panel',
    'Admin Dashboard\n\nThis content is fetched from your Neon database.\n\nYou can update this page content directly in the database:\nUPDATE pages SET content = ''Your new content'' WHERE type = ''admin'';\n\nFeatures:\n- Panorama Viewer with interactive zoom and pan\n- Base Maps, Elevation, Evacuation, and Hazard maps\n- Interactive boundary mapping\n- Real-time data from Google Drive'
  )
ON CONFLICT (type) DO NOTHING;
