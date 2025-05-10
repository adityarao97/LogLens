import { Search, Database, Globe, FileText } from 'lucide-react';
import { useState, useRef } from 'react';
import { Query, QueryType, ModelType, MODEL_NAMES } from '../types';
import { generateId } from '../utils/helpers';

interface SearchBarProps {
  onSubmitQuery: (query: Query) => void;
}

const SearchBar = ({ onSubmitQuery }: SearchBarProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('cohere');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (type: QueryType) => {
    if (!inputValue.trim()) return;
    
    const query: Query = {
      id: generateId(),
      text: inputValue,
      type,
      model: MODEL_NAMES[selectedModel],
      timestamp: new Date()
    };
    
    onSubmitQuery(query);
    setInputValue('');
    setIsTyping(false);
    
    // Refocus the input
    inputRef.current?.focus();
  };

  return (
    <div className={`w-full transition-all duration-300 ${isFocused ? 'scale-105' : 'scale-100'}`}>
      <div className="relative rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden
                    backdrop-blur-sm bg-opacity-90 dark:bg-opacity-80 border border-gray-200 dark:border-gray-700
                    transition-all duration-300">
        <div className="flex items-center px-4 py-3">
          <Search className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
            placeholder="Ask anything..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsTyping(true);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedModel('cohere')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${selectedModel === 'cohere' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              Cohere
            </button>
            <button
              onClick={() => setSelectedModel('qwen')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${selectedModel === 'qwen'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              Qwen
            </button>
          </div>
        </div>
        
        <div className={`flex border-t border-gray-200 dark:border-gray-700 transition-all duration-300 ${inputValue.trim() ? 'opacity-100 h-14' : 'opacity-0 h-0 overflow-hidden'}`}>
          <button
            onClick={() => handleSubmit('sql')}
            className="flex-1 flex items-center justify-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <Database size={16} className="text-blue-600 dark:text-blue-400" />
            <span>SQL</span>
          </button>
          <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={() => handleSubmit('general')}
            className="flex-1 flex items-center justify-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <FileText size={16} className="text-green-600 dark:text-green-400" />
            <span>General</span>
          </button>
          <div className="w-px h-full bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={() => handleSubmit('web')}
            className="flex-1 flex items-center justify-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <Globe size={16} className="text-purple-600 dark:text-purple-400" />
            <span>Web</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;