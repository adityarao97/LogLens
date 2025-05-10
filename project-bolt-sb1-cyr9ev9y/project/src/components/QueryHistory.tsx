import { useState } from 'react';
import { ChevronDown, ChevronUp, Database, FileText, Globe, Clock } from 'lucide-react';
import { Query } from '../types';
import { formatDate } from '../utils/helpers';

interface QueryHistoryProps {
  queries: Query[];
  onSelectQuery: (query: Query) => void;
}

const QueryHistory = ({ queries, onSelectQuery }: QueryHistoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (queries.length === 0) {
    return null;
  }

  const getQueryIcon = (type: Query['type']) => {
    switch (type) {
      case 'sql':
        return <Database size={16} className="text-blue-600 dark:text-blue-400" />;
      case 'general':
        return <FileText size={16} className="text-green-600 dark:text-green-400" />;
      case 'web':
        return <Globe size={16} className="text-purple-600 dark:text-purple-400" />;
    }
  };
  
  return (
    <div className="mt-8 w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden
                   transition-all duration-300 border border-gray-200 dark:border-gray-700">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 
                  border-b border-gray-200 dark:border-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
          <Clock size={16} />
          <span>Recent Queries</span>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{queries.length}</span>
        </div>
        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-80' : 'max-h-0'} overflow-y-auto`}>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {queries.map((query) => (
            <li 
              key={query.id}
              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
              onClick={() => onSelectQuery(query)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  {getQueryIcon(query.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{query.text}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span className="capitalize">{query.type}</span>
                    <span className="inline-block w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                    <span>{formatDate(query.timestamp)}</span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QueryHistory;