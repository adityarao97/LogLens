import React, { useState } from 'react';
import { Github } from 'lucide-react';
import SearchBar from './components/SearchBar';
import QueryHistory from './components/QueryHistory';
import ResultDisplay from './components/ResultDisplay';
import ThemeToggle from './components/ThemeToggle';
import { Query } from './types';

function App() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [currentQuery, setCurrentQuery] = useState<Query | null>(null);

  const handleSubmitQuery = (query: Query) => {
    setQueries((prev) => [query, ...prev]);
    setCurrentQuery(query);
  };

  const handleSelectQuery = (query: Query) => {
    setCurrentQuery(query);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              LogiLens
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 
                      text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="GitHub repository"
            >
              <Github size={20} />
            </a>
            <ThemeToggle />
          </div>
        </header>
        
        {/* Main content */}
        <main className="space-y-4">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold mb-2">Your AI Assistant</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ask anything about your data, get answers, or search the web
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <SearchBar onSubmitQuery={handleSubmitQuery} />
          </div>
          
          <div className="max-w-3xl mx-auto">
            <ResultDisplay currentQuery={currentQuery} />
            <QueryHistory queries={queries} onSelectQuery={handleSelectQuery} />
          </div>
        </main>
        
        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 LogiLens. All rights reserved.</p>
          <p className="mt-1">
            <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> All systems operational
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;