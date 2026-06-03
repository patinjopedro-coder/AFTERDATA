import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Simple plugin to handle shared local database requests in development
const localDbPlugin = () => {
  const dbFilePath = path.resolve(__dirname, 'local_db.json');

  const readDb = () => {
    if (!fs.existsSync(dbFilePath)) return {};
    try {
      return JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
    } catch (e) {
      return {};
    }
  };

  const writeDb = (data: any) => {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
  };

  return {
    name: 'local-db-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api/db')) {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          
          if (req.method === 'GET') {
            const key = urlObj.searchParams.get('key');
            if (key) {
              const db = readDb();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ value: db[key] }));
              return;
            }
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: any) => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const { key, value } = JSON.parse(body);
                if (key) {
                  const db = readDb();
                  db[key] = value;
                  writeDb(db);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true }));
                  return;
                }
              } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
                return;
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), localDbPlugin()],
    base: './',
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
