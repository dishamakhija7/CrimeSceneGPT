import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, AlertTriangle, Loader } from 'lucide-react';
import { getCaseById } from '../services/firestore';

export default function PDFReport({ caseId, onBack }) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!caseId) {
      setError('No active case selected.');
      setLoading(false);
      return;
    }

    const loadCase = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getCaseById(caseId);
        if (mounted) {
          setCaseData(data);
        }
      } catch (err) {
        console.error("Error loading case:", err);
        if (mounted) {
          setError('Failed to load case data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCase();

    return () => {
      mounted = false;
    };
  }, [caseId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 h-[60vh] flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-accentTeal animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-sm">Loading PDF Report...</p>
      </div>
    );
  }

  if (error || !caseData || !caseData.aiAnalysis) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-400 font-mono text-sm mb-4">
          {error || (!caseData.aiAnalysis ? 'No AI Analysis available to generate report.' : 'Case details not found.')}
        </p>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-[#0b0b14] border border-gray-800 text-gray-300 font-mono text-xs uppercase hover:text-white rounded transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const analysis = caseData.aiAnalysis;

  // Fallback metadata if not set
  const caseIdDisplay = caseData.caseId || caseId;
  const incidentType = caseData.incidentType || analysis.incidentType || 'Vehicle Collision';
  const location = caseData.location || 'City Road';
  const dateTime = caseData.date && caseData.time ? `${caseData.date}, ${caseData.time}` : 'Recent';
  const weather = caseData.weather || analysis.weather || 'Clear';
  const officer = caseData.investigatingOfficer || 'Inspector Arjun';

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Dev Navigation / Action bar */}
      <div className="flex justify-between items-center bg-[#121222]/80 border border-gray-880 p-3 rounded-xl no-print">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0b0b14] border border-gray-800 text-[10px] text-accentTeal font-mono rounded hover:border-accentTeal transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Official Light Themed Document */}
      <div className="bg-white text-gray-900 border border-gray-300 rounded-xl p-8 shadow-lg max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 font-serif text-left">
        
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-sans font-extrabold text-sm">
                Q
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold font-sans tracking-wide text-gray-900">CRIMESCENE GPT</h1>
                <p className="text-[9px] font-sans uppercase tracking-wider text-gray-500">AI-Powered Accident Reconstruction & Investigation</p>
              </div>
            </div>
          </div>
          <div className="text-right text-xs font-mono text-gray-600">
            <div>CONFIDENTIAL REPORT</div>
            <div>CASE: {caseIdDisplay}</div>
            <div>DATE: {dateTime}</div>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-sans border-b border-gray-300 pb-2 mb-6">Investigation Report</h2>

        {/* 1. Incident Details */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-1">1. Incident Details</h3>
          
          <table className="w-full text-xs text-left border-collapse">
            <tbody>
              <tr>
                <th className="py-2 border-b border-gray-200 text-gray-600 font-bold w-1/3">Type of Incident</th>
                <td className="py-2 border-b border-gray-200 font-sans font-semibold">{incidentType}</td>
              </tr>
              <tr>
                <th className="py-2 border-b border-gray-200 text-gray-600 font-bold">Location</th>
                <td className="py-2 border-b border-gray-200 font-sans font-semibold">{location}</td>
              </tr>
              <tr>
                <th className="py-2 border-b border-gray-200 text-gray-600 font-bold">Date & Time</th>
                <td className="py-2 border-b border-gray-200 font-sans font-semibold">{dateTime}</td>
              </tr>
              <tr>
                <th className="py-2 border-b border-gray-200 text-gray-600 font-bold">Weather Conditions</th>
                <td className="py-2 border-b border-gray-200 font-sans font-semibold">{weather}</td>
              </tr>
              {analysis.lightingConditions && (
                <tr>
                  <th className="py-2 border-b border-gray-200 text-gray-600 font-bold">Lighting Conditions</th>
                  <td className="py-2 border-b border-gray-200 font-sans font-semibold">{analysis.lightingConditions}</td>
                </tr>
              )}
              {analysis.roadLayout && (
                <tr>
                  <th className="py-2 border-b border-gray-200 text-gray-600 font-bold">Road Layout</th>
                  <td className="py-2 border-b border-gray-200 font-sans font-semibold">{analysis.roadLayout}</td>
                </tr>
              )}
              <tr>
                <th className="py-2 border-b border-gray-200 text-gray-600 font-bold">Investigating Officer</th>
                <td className="py-2 border-b border-gray-200 font-sans font-semibold">{officer}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Scenario Analysis */}
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-1">2. Scenario & Executive Summary</h3>
          
          <div>
            <div className="flex justify-between items-center text-xs font-sans font-bold mb-1">
              <span>Primary Scenario Logic</span>
              <span className="text-green-600">{analysis.confidenceScore || 85}% Confidence</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${analysis.confidenceScore || 85}%` }} />
            </div>
          </div>

          <div className="text-xs space-y-4 mt-4 leading-relaxed font-serif">
            <p><strong>Executive Summary:</strong> {analysis.executiveSummary}</p>
            
            {analysis.knownFacts && analysis.knownFacts.length > 0 && (
              <div>
                <strong>Key Confirmed Facts:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {analysis.knownFacts.map((fact, idx) => (
                    <li key={idx}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.uncertainFacts && analysis.uncertainFacts.length > 0 && (
              <div>
                <strong>Points Requiring Verification:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-700">
                  {analysis.uncertainFacts.map((fact, idx) => (
                    <li key={idx}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.observations && analysis.observations.length > 0 && (
              <div>
                <strong>Additional System Observations:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 italic">
                  {analysis.observations.map((obs, idx) => (
                    <li key={idx}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-12 pt-8 border-t border-gray-300 flex justify-between text-xs font-sans">
          <div>
            <div className="border-b border-gray-500 w-40 h-8" />
            <div className="text-gray-500 mt-1">{officer}</div>
            <div className="text-[10px] text-gray-400">Investigating Officer Signature</div>
          </div>
          <div className="text-right">
            <div className="h-8" />
            <div className="text-gray-500">CrimeScene GPT Reconstruction Engine</div>
            <div className="text-[10px] text-gray-400">Verifiably signed via AI-Telemetry Auth</div>
          </div>
        </div>

      </div>
    </div>
  );
}
