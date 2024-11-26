import React from 'react';
import { FileExplorer } from './components/FileExplorer';
import { Sidebar } from './components/Sidebar';
import { FileSystemProvider } from './context/FileSystemContext';

function App() {
  return (
    <FileSystemProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <FileExplorer />
        </main>
      </div>
    </FileSystemProvider>
  );
}

export default App;