import { Database, FileText, Globe, Loader2 } from 'lucide-react';
import { Query, QueryResult, WebResult, SQLResult } from '../types';
import { useState, useEffect } from 'react';

interface ResultDisplayProps {
  currentQuery: Query | null;
}

const ResultDisplay = ({ currentQuery }: ResultDisplayProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | WebResult[] | SQLResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentQuery) {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const mode = currentQuery.type === 'sql' ? 'sql' : 
                   currentQuery.type === 'general' ? 'advice' : 'search';
      
      fetch('http://127.0.0.1:8000/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          model: currentQuery.model,
          query: currentQuery.text
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        return response.json();
      })
      .then(data => {
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }
        // For general queries, extract the advice from the data object
        if (mode === 'advice' && data.data && typeof data.data === 'object' && 'advice' in data.data) {
          setResult(data.data.advice);
        } else {
          setResult(data.data);
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
    }
  }, [currentQuery]);

  if (!currentQuery) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center p-8 h-64 
                    bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700
                    text-gray-500 dark:text-gray-400">
        <div className="flex flex-col items-center text-center gap-2">
          <p className="text-lg font-medium">No query selected</p>
          <p className="text-sm">Enter a query in the search bar above to get started</p>
        </div>
      </div>
    );
  }

  const getQueryTypeIcon = () => {
    switch (currentQuery.type) {
      case 'sql':
        return <Database size={20} className="text-blue-600 dark:text-blue-400" />;
      case 'general':
        return <FileText size={20} className="text-green-600 dark:text-green-400" />;
      case 'web':
        return <Globe size={20} className="text-purple-600 dark:text-purple-400" />;
    }
  };

  const getQueryTypeLabel = () => {
    switch (currentQuery.type) {
      case 'sql':
        return 'SQL Results';
      case 'general':
        return 'General Answer';
      case 'web':
        return 'Web Results';
    }
  };

  const formatMarkdown = (text: string | unknown): string => {
    if (typeof text !== 'string') {
      return '';
    }
    // Convert headers
    let formatted = text.replace(/###\s(.*?)\n/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    // Convert bold markdown
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert lists
    formatted = formatted.replace(/(\d+\.\s.*?)(?=(?:\d+\.|$))/g, '<li class="ml-4">$1</li>');
    // Convert line breaks
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = formatted.replace(/\n/g, '<br>');
    return `<p>${formatted}</p>`;
  };

  const renderResult = () => {
    if (error) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md text-red-600 dark:text-red-400">
          {error}
        </div>
      );
    }

    if (!result) return null;

    if (currentQuery.type === 'web' && Array.isArray(result)) {
      return (
        <div className="space-y-4">
          {result.map((item: WebResult, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-750 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <a 
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium block mb-2"
              >
                {item.title}
              </a>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {item.snippet}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                {item.link}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (currentQuery.type === 'sql' && typeof result === 'object' && 'sql' in result) {
      const sqlResult = result as SQLResult;
      return (
        <div className="overflow-x-auto">
          <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-md">
            <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap">
              {sqlResult.sql}
            </pre>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sqlResult.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                          {cell?.toString() ?? 'null'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // General results with markdown formatting
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-750 rounded-md">
        <div 
          className="prose dark:prose-invert max-w-none text-sm text-gray-800 dark:text-gray-200"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(result) }}
        />
      </div>
    );
  };

  return (
    <div className="mt-8 w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden
                   transition-all duration-300 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700
                    bg-gray-50 dark:bg-gray-750">
        {getQueryTypeIcon()}
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {getQueryTypeLabel()}
        </span>
      </div>
      
      <div className="p-4">
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{currentQuery.text}</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Processing your query...</span>
          </div>
        ) : renderResult()}
      </div>
    </div>
  );
};

export default ResultDisplay;