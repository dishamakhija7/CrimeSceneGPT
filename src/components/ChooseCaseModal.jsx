import React, { useState, useEffect } from 'react';
import { X, Search, Folder, MapPin, Calendar, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCases } from '../services/firestore';

export default function ChooseCaseModal({ isOpen, onClose, onSelectCase, onCreateNewCase }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchCases = async () => {
        setLoading(true);
        try {
          const fetchedCases = await getCases();
          setCases(fetchedCases);
        } catch (error) {
          console.error("Error fetching cases for modal:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchCases();
      setSearchQuery(''); // reset search on open
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCases = cases.filter(c => 
    c.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.caseId?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.caseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.incidentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.accidentType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status) => {
    if (status?.toLowerCase() === 'completed') {
      return 'bg-accentPurple/20 border-accentPurple/50 text-accentPurple';
    }
    return 'bg-accentTeal/20 border-accentTeal/50 text-accentTeal';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-filter backdrop-blur-md flex items-center justify-center p-4 z-50">
      
      {/* Modal Card */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-[#0b0f1f]/95 border border-gray-800 rounded-3xl p-6 relative shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white font-mono uppercase tracking-wider">Choose Existing Case</h3>
          <p className="text-sm text-gray-400 mt-1">Select a case to continue investigation</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-accentPurple" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121629] border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-accentPurple outline-none transition font-medium"
          />
        </div>

        {/* Case List (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500 animate-pulse font-mono text-sm">Loading Cases...</p>
            </div>
          ) : filteredCases.length > 0 ? (
            filteredCases.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className="w-full flex items-center justify-between p-5 bg-[#121629]/60 hover:bg-[#121629] border border-gray-800 hover:border-accentPurple/50 rounded-2xl text-left transition duration-300 group"
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-[#1a1f36] border border-gray-700/50 rounded-xl group-hover:bg-accentPurple/10 group-hover:border-accentPurple/30 transition">
                    <Folder className="w-6 h-6 text-accentPurple" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white font-mono tracking-wide">{c.id}</h4>
                    <p className="text-sm text-gray-400 mt-1">{c.caseTitle || c.title || c.incidentType || c.accidentType || 'Untitled Case'}</p>
                    
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-accentPurple" />
                        <span>{c.location || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(c.createdAt)}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest flex items-center gap-1.5 ml-2 ${getStatusStyle(c.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {c.status || 'In Progress'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-accentPurple transition transform group-hover:translate-x-1" />
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Folder className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-gray-400 font-medium">No cases found.</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search.</p>
            </div>
          )}
        </div>

        {/* Create New Case Button */}
        <button
          onClick={onCreateNewCase}
          className="w-full mt-6 py-4 bg-transparent hover:bg-accentTeal/5 border border-dashed border-gray-700 hover:border-accentTeal text-accentTeal text-xs font-mono font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Create New Case
        </button>
        
      </motion.div>
    </div>
  );
}
