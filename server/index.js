import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { promises as fs } from 'fs';
import { join, dirname, basename, resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const STORAGE_DIR = resolve(__dirname, '../storage');

await fs.mkdir(STORAGE_DIR, { recursive: true });

app.use(express.static(join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

const getStoragePath = (virtualPath) => {
  const relativePath = virtualPath.replace(/^\//, '');
  return join(STORAGE_DIR, relativePath);
};

const getVirtualPath = (storagePath) => {
  return '/' + storagePath.slice(STORAGE_DIR.length).replace(/^\//, '');
};

const searchFilesInDir = async (dir, term) => {
  const results = [];
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);

    if (file.isDirectory()) {
      results.push(...await searchFilesInDir(fullPath, term));
    } else {
      const matchesName = file.name.toLowerCase().includes(term.toLowerCase());
      const matchesExt = extname(file.name).toLowerCase().includes(term.toLowerCase());

      if (matchesName || matchesExt) {
        const stats = await fs.stat(fullPath);
        results.push({
          name: file.name,
          path: getVirtualPath(fullPath),
          isDirectory: false,
          size: stats.size,
          modified: stats.mtime,
          created: stats.birthtime,
        });
      }
    }
  }

  return results;
};

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    try {
      const { type, path, name, content, term } = JSON.parse(message);
      const storagePath = path ? getStoragePath(path) : STORAGE_DIR;

      switch (type) {
        case 'LIST_FILES': {
          const files = await fs.readdir(storagePath, { withFileTypes: true });
          const filesData = await Promise.all(
            files.map(async (file) => {
              const fullStoragePath = join(storagePath, file.name);
              const stats = await fs.stat(fullStoragePath);
              return {
                name: file.name,
                path: getVirtualPath(fullStoragePath),
                isDirectory: file.isDirectory(),
                size: stats.size,
                modified: stats.mtime,
                created: stats.birthtime,
              };
            })
          );
          ws.send(JSON.stringify({ type: 'FILES_LIST', data: filesData }));
          break;
        }

        case 'CREATE_FOLDER': {
          const folderPath = join(storagePath, name);
          await fs.mkdir(folderPath);
          ws.send(JSON.stringify({
            type: 'FOLDER_CREATED',
            path: getVirtualPath(folderPath)
          }));
          break;
        }

        case 'CREATE_FILE': {
          const filePath = join(storagePath, name);
          await fs.writeFile(filePath, content || '');
          ws.send(JSON.stringify({
            type: 'FILE_CREATED',
            path: getVirtualPath(filePath)
          }));
          break;
        }

        case 'READ_FILE': {
          const filePath = getStoragePath(path);
          const content = await fs.readFile(filePath, 'utf-8');
          ws.send(JSON.stringify({
            type: 'FILE_CONTENT',
            path,
            content
          }));
          break;
        }

        case 'SAVE_FILE': {
          const filePath = getStoragePath(path);
          await fs.writeFile(filePath, content);
          ws.send(JSON.stringify({
            type: 'FILE_SAVED',
            path
          }));
          break;
        }

        case 'DELETE': {
          const itemPath = getStoragePath(path);
          const stats = await fs.stat(itemPath);
          if (stats.isDirectory()) {
            await fs.rm(itemPath, { recursive: true });
          } else {
            await fs.unlink(itemPath);
          }
          ws.send(JSON.stringify({ type: 'ITEM_DELETED', path }));
          break;
        }

        case 'RENAME': {
          const oldPath = getStoragePath(path);
          const newPath = join(dirname(oldPath), name);
          await fs.rename(oldPath, newPath);
          ws.send(JSON.stringify({
            type: 'ITEM_RENAMED',
            oldPath: path,
            newPath: getVirtualPath(newPath)
          }));
          break;
        }

        case 'SEARCH_FILES': {
          const results = await searchFilesInDir(STORAGE_DIR, term);
          ws.send(JSON.stringify({
            type: 'FILES_LIST',
            data: results
          }));
          break;
        }
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});