import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ShieldCheck, Edit2, Car, Calendar, Clock, 
  MapPin, Cloud, Map, Eye, Users, User, Flag, X, FileText, Home, Trees 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { createCase } from '../services/firestore';

export default function CreateCase({ onCancel, onSuccess }) {
  // Generate a random case ID initially
  const [caseId, setCaseId] = useState(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Traffic Accident', // 'Traffic Accident', 'Indoor Crime Scene', 'Outdoor Natural'
    incidentType: 'Vehicle Collision',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    time: '10:30',
    location: '',
    weather: 'Clear',
    
    // Traffic Accident specific
    roadType: 'Urban',
    roadCondition: 'Dry',
    visibility: 'Good',
    vehiclesInvolved: '2',
    
    // Indoor Crime Scene specific
    indoorSceneType: 'bedroom', // 'bedroom', 'living_room', 'office', 'warehouse', 'apartment'
    floorType: 'Wood', // 'Wood', 'Carpet', 'Concrete', 'Tile'
    entryExitCount: '2',
    
    // Outdoor Natural specific
    outdoorType: 'park', // 'park', 'forest', 'beach', 'field'
    groundType: 'Grass', // 'Grass', 'Soil', 'Sand', 'Snow'
    
    peopleInvolved: '2',
    officer: '',
    priority: 'High',
    description: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Set default officer name on mount
  useEffect(() => {
    if (auth.currentUser) {
      setFormData(prev => ({
        ...prev,
        officer: auth.currentUser.displayName || auth.currentUser.email || 'Inspector Arjun'
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-update incidentType options when category changes
    if (name === 'category') {
      let defaultIncident = 'Vehicle Collision';
      if (value === 'Indoor Crime Scene') defaultIncident = 'Homicide Investigation';
      if (value === 'Outdoor Natural') defaultIncident = 'Trespassing / Intrusion';
      
      setFormData(prev => ({ 
        ...prev, 
        category: value,
        incidentType: defaultIncident
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caseId || !formData.title || !formData.location) {
      setError("Please fill in all required fields (marked with *).");
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const newCaseData = {
        caseId,
        caseTitle:           formData.title,
        category:            formData.category,
        incidentType:        formData.incidentType,
        date:                formData.date,
        time:                formData.time,
        location:            formData.location,
        weather:             formData.weather,
        investigatingOfficer: formData.officer,
        priority:            formData.priority,
        description:         formData.description,
        status:              'In Progress',
        createdBy:           auth.currentUser?.uid || 'unknown',
        
        // Legacy compatibility properties
        title:               formData.title,
        accidentType:        formData.incidentType,
        
        // Category specific attributes
        ...(formData.category === 'Traffic Accident' ? {
          roadType:          formData.roadType,
          roadCondition:     formData.roadCondition,
          visibility:        formData.visibility,
          numberOfVehicles:  parseInt(formData.vehiclesInvolved, 10),
          numberOfPeople:    parseInt(formData.peopleInvolved, 10),
        } : formData.category === 'Indoor Crime Scene' ? {
          indoorSceneType:   formData.indoorSceneType,
          floorType:         formData.floorType,
          entryExitCount:    parseInt(formData.entryExitCount, 10),
          numberOfPeople:    parseInt(formData.peopleInvolved, 10),
        } : {
          outdoorType:       formData.outdoorType,
          groundType:        formData.groundType,
          numberOfPeople:    parseInt(formData.peopleInvolved, 10),
        })
      };

      await createCase(caseId, newCaseData);
      onSuccess(caseId);
    } catch (err) {
      console.error("Error creating case:", err);
      setError("Failed to create case. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <button 
            onClick={onCancel}
            className="mt-1 w-10 h-10 bg-[#121222] border border-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-left">
            <p className="text-xs font-mono font-bold text-accentTeal tracking-widest uppercase mb-1">New Case</p>
            <h1 className="text-3xl font-bold text-white mb-2">Create a New Case</h1>
            <p className="text-gray-400 text-sm">Adaptive incident workspace creation.</p>
          </div>
        </div>

        <div className="bg-[#121222]/80 border border-gray-800 rounded-xl p-4 flex items-center gap-3 max-w-sm text-left">
          <ShieldCheck className="w-5 h-5 text-accentTeal flex-shrink-0" />
          <p className="text-xs text-gray-300">All cases are securely stored and can be analyzed dynamically using Gemini AI.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-left">
          {error}
        </div>
      )}

      {/* Form Form */}
      <form onSubmit={handleSubmit} className="bg-[#121222]/90 border border-gray-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl">
        
        {/* CASE TYPE & SECTOR SELECTION */}
        <section className="text-left">
          <h2 className="text-xs font-mono font-bold text-accentTeal tracking-widest uppercase mb-6">Investigation Domain</h2>
          <div className="grid grid-cols-1 max-w-sm gap-4">
            {[
              { id: 'Traffic Accident', label: 'Traffic Accident', desc: 'Vehicular collision and road crash analysis', icon: <Car className="w-5 h-5" /> }
            ].map((domain) => (
              <button
                key={domain.id}
                type="button"
                onClick={() => handleChange({ target: { name: 'category', value: domain.id } })}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition ${
                  formData.category === domain.id 
                    ? 'border-accentPurple bg-accentPurple/10 text-white' 
                    : 'border-gray-800 bg-[#0b0b14] text-gray-400 hover:border-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-2 rounded-lg ${formData.category === domain.id ? 'bg-[#7c3aed] text-white' : 'bg-gray-900 text-gray-500'}`}>
                    {domain.icon}
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border-2 ${formData.category === domain.id ? 'border-accentPurple bg-accentPurple' : 'border-gray-800'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{domain.label}</h3>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{domain.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <hr className="border-gray-800/50" />

        {/* IDENTIFICATION */}
        <section className="text-left">
          <h2 className="text-xs font-mono font-bold text-[#a78bfa] tracking-widest uppercase mb-6">Case Identification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Case ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition"
                />
                <Edit2 className="absolute right-4 top-3.5 w-4 h-4 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Case Title <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="SUV Crash - City Intersection"
                className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition"
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-800/50" />

        {/* DYNAMIC ADAPTIVE FIELDS SECTION */}
        <section className="text-left">
          <h2 className="text-xs font-mono font-bold text-[#a78bfa] tracking-widest uppercase mb-6">Incident Parameters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Incident Classification <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <select 
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={handleChange}
                  className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition appearance-none"
                >
                  <option value="Vehicle Collision">Vehicle Collision</option>
                  <option value="Pedestrian Incident">Pedestrian Incident</option>
                  <option value="Hit and Run">Hit and Run</option>
                  <option value="Single Vehicle Obstacle">Single Vehicle Obstacle</option>
                </select>
                <div className="absolute right-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0"></div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Date of Incident <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full"
                />
                <Calendar className="absolute right-4 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Time of Incident <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="time" 
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full"
                />
                <Clock className="absolute right-4 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Street location or Coordinates"
                  className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white focus:border-accentTeal outline-none transition"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">Weather Condition</label>
              <div className="relative flex items-center">
                <Cloud className="absolute left-4 w-4 h-4 text-gray-500" />
                <select 
                  name="weather"
                  value={formData.weather}
                  onChange={handleChange}
                  className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white focus:border-accentTeal outline-none transition appearance-none"
                >
                  <option value="Clear">Clear</option>
                  <option value="Rain">Rain</option>
                  <option value="Fog">Fog</option>
                  <option value="Snow">Snow</option>
                </select>
                <div className="absolute right-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0"></div>
              </div>
            </div>
          </div>

          {/* FADE-IN TRANSITIONS FOR CATEGORY-SPECIFIC FORM FIELDS */}
          <AnimatePresence mode="wait">
            {formData.category === 'Traffic Accident' && (
              <motion.div
                key="traffic"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Road Type</label>
                  <div className="relative flex items-center">
                    <select 
                      name="roadType"
                      value={formData.roadType}
                      onChange={handleChange}
                      className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition appearance-none"
                    >
                      <option value="Urban">Urban Road</option>
                      <option value="Highway">Highway</option>
                      <option value="Intersection">Intersection</option>
                      <option value="Parking Lot">Parking Lot</option>
                    </select>
                    <div className="absolute right-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Road Condition</label>
                  <div className="relative flex items-center">
                    <select 
                      name="roadCondition"
                      value={formData.roadCondition}
                      onChange={handleChange}
                      className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition appearance-none"
                    >
                      <option value="Dry">Dry</option>
                      <option value="Wet">Wet</option>
                      <option value="Icy">Icy</option>
                      <option value="Uneven">Uneven</option>
                    </select>
                    <div className="absolute right-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Visibility</label>
                  <div className="relative flex items-center">
                    <select 
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleChange}
                      className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition appearance-none"
                    >
                      <option value="Good">Good</option>
                      <option value="Poor">Poor</option>
                      <option value="Night">Night</option>
                    </select>
                    <div className="absolute right-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Vehicles Involved</label>
                  <input 
                    type="number" 
                    name="vehiclesInvolved"
                    value={formData.vehiclesInvolved}
                    onChange={handleChange}
                    min="1"
                    className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition"
                  />
                </div>
              </motion.div>
            )}

            {formData.category === 'Indoor Crime Scene' && (
              <motion.div
                key="indoor"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Indoor Scene Type</label>
                  <div className="relative flex items-center">
                    <select 
                      name="indoorSceneType"
                      value={formData.indoorSceneType}
                      onChange={handleChange}
                      className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition appearance-none"
                    >
                      <option value="bedroom">Bedroom</option>
                      <option value="living_room">Living Room</option>
                      <option value="office">Office Space</option>
                      <option value="warehouse">Warehouse</option>
                      <option value="apartment">Apartment Suite</option>
                    </select>
                    <div className="absolute right-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Flooring material</label>
                  <div className="relative flex items-center">
                    <select 
                      name="floorType"
                      value={formData.floorType}
                      onChange={handleChange}
                      className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition appearance-none"
                    >
                      <option value="Wood">Hardwood</option>
                      <option value="Carpet">Carpet</option>
                      <option value="Concrete">Polished Concrete</option>
                      <option value="Tile">Tile</option>
                    </select>
                    <div className="absolute right-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Entry & Exit Points</label>
                  <input 
                    type="number" 
                    name="entryExitCount"
                    value={formData.entryExitCount}
                    onChange={handleChange}
                    min="1"
                    className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition"
                  />
                </div>
              </motion.div>
            )}

            {formData.category === 'Outdoor Natural' && (
              <motion.div
                key="outdoor"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Outdoor Area Type</label>
                  <div className="relative flex items-center">
                    <select 
                      name="outdoorType"
                      value={formData.outdoorType}
                      onChange={handleChange}
                      className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition appearance-none"
                    >
                      <option value="park">Public Park</option>
                      <option value="forest">Forest / Wooded Area</option>
                      <option value="beach">Sandy Beach</option>
                      <option value="field">Open Field</option>
                    </select>
                    <div className="absolute right-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Ground Cover</label>
                  <div className="relative flex items-center">
                    <select 
                      name="groundType"
                      value={formData.groundType}
                      onChange={handleChange}
                      className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition appearance-none"
                    >
                      <option value="Grass">Grass</option>
                      <option value="Soil">Dirt / Soil</option>
                      <option value="Sand">Sand</option>
                      <option value="Snow">Snow</option>
                    </select>
                    <div className="absolute right-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0"></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <hr className="border-gray-800/50" />

        {/* ASSIGNMENT & PRIORITY */}
        <section className="text-left">
          <h2 className="text-xs font-mono font-bold text-[#a78bfa] tracking-widest uppercase mb-6">Personnel & Priority</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Investigating Officer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  name="officer"
                  value={formData.officer}
                  onChange={handleChange}
                  placeholder="Officer Credentials"
                  className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white focus:border-accentTeal outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">People Involved</label>
              <div className="relative">
                <Users className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="number" 
                  name="peopleInvolved"
                  value={formData.peopleInvolved}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white focus:border-accentTeal outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">Priority</label>
              <div className="relative flex items-center">
                <Flag className={`absolute left-4 w-4 h-4 ${formData.priority === 'High' ? 'text-accentPurple' : formData.priority === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`} />
                <select 
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white focus:border-accentTeal outline-none transition appearance-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <div className="absolute right-4 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 w-0 h-0"></div>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-gray-800/50" />

        {/* DESCRIPTION */}
        <section className="text-left">
          <h2 className="text-xs font-mono font-bold text-[#a78bfa] tracking-widest uppercase mb-6">Incident Narrative</h2>
          <div className="relative">
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={500}
              rows={4}
              placeholder="Record initial dispatch observations and physical clues here..."
              className="w-full bg-[#0b0b14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-accentTeal outline-none transition resize-none"
            />
            <div className="absolute bottom-3 right-4 text-xs text-gray-500 font-mono">
              {formData.description.length} / 500
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button 
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-4 bg-[#0b0b14] border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-mono text-sm tracking-wider uppercase font-bold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button 
            type="submit"
            disabled={submitting}
            className={`flex-1 py-4 bg-accentPurple hover:bg-accentPurple/95 text-white font-mono text-sm tracking-wider uppercase font-bold rounded-xl shadow-glowPurple border border-accentPurple/50 flex items-center justify-center gap-2 transition ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Creating Workspace...' : (
              <>
                <FileText className="w-4 h-4" /> Create Case File
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
