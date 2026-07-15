import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Cpu, Loader, Send, Mic, MicOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCaseById, updateCase } from '../services/firestore';
import { callGeminiWithStructuredOutput } from '../services/geminiService';

const chatResponseSchema = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    keyObservations: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["reply"]
};

export default function MCQFlow({ caseId, onComplete, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [caseData, setCaseData] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [observations, setObservations] = useState([]);
  const [userMessageCount, setUserMessageCount] = useState(0);
  
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // 1. Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsRecording(true);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + transcript);
      };
      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setIsRecording(false);
      };
      rec.onend = () => setIsRecording(false);

      recognitionRef.current = rec;
    }
  }, []);

  // 2. Load case details on mount and start chat
  useEffect(() => {
    let mounted = true;
    if (!caseId) {
      setLoading(false);
      // Fallback greeting if no case
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: "Hello Officer. I am your AI Investigator assistant. Please describe the accident scene, or type/speak any details you have to start.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

    const loadCaseAndGreet = async () => {
      try {
        const data = await getCaseById(caseId);
        if (mounted) {
          setCaseData(data);
          
          const title = data.caseTitle || data.title || 'Accident Investigation';
          const desc = data.description || '';
          
          let greetingText = `Hello Officer. I am your AI Investigator assistant for Case **${data.caseId}** (${title}).`;
          
          if (desc.trim().length > 5) {
            greetingText += ` I see the initial notes describe: *"${desc}"*. Could you tell me if there were any secondary collisions or if any other vehicles/pedestrians were involved?`;
          } else {
            greetingText += ` To start, could you please tell me what type of vehicles were involved and describe the main accident event?`;
          }

          setMessages([
            {
              id: 'welcome',
              sender: 'ai',
              text: greetingText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch (err) {
        console.error("Error starting AI investigator chat:", err);
        if (mounted) {
          setMessages([
            {
              id: 'welcome',
              sender: 'ai',
              text: "Hello Officer. Let's start the accident investigation. Could you describe the crash site and vehicles involved?",
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCaseAndGreet();

    return () => {
      mounted = false;
    };
  }, [caseId]);

  // 3. Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // 4. Toggle voice input
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // 5. Send message & generate AI response
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    const userMsg = inputText.trim();
    setInputText('');

    const nextCount = userMessageCount + 1;
    setUserMessageCount(nextCount);

    const newMessages = [
      ...messages,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: userMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(newMessages);
    setSending(true);

    try {
      // Compile history for context
      const historyText = newMessages
        .map(m => `${m.sender === 'ai' ? 'Investigator AI' : 'User'}: ${m.text}`)
        .join('\n');

      const isEnding = nextCount >= 3;
      const prompt = `You are "Investigator AI", an expert conversational accident reconstruction assistant.
Case Details: ${caseData ? JSON.stringify(caseData) : 'None'}
Conversation history:
${historyText}

User's latest input: "${userMsg}"

${isEnding ? `
We have gathered enough details (Message count: ${nextCount}). Summarize what observations you have collected in a friendly, concise summary. DO NOT ask any more follow-up questions. Conclude by telling the officer that they can now proceed to the 3D reconstruction.
` : `
Acknowledge the user's details, update the reconstruction context, and reply in a helpful, professional, forensic investigator tone.
Ask exactly ONE clear follow-up question regarding any missing details (such as speed, skid marks, traffic signals, road condition, weather, lighting, helmet use, or vehicle orientation). Keep your response concise (maximum 2-3 sentences).
`}
Return the result matching the provided JSON schema.`;

      const result = await callGeminiWithStructuredOutput({
        prompt: prompt,
        schema: chatResponseSchema
      });

      if (result && result.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: result.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        if (result.keyObservations && result.keyObservations.length > 0) {
          setObservations(prev => {
            const updated = [...prev, ...result.keyObservations];
            // Remove duplicates
            return [...new Set(updated)];
          });
        }
      } else {
        throw new Error("Invalid response from AI model");
      }
    } catch (err) {
      console.error("Chat AI response error:", err);
      // Fallback conversational reply
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: nextCount >= 3 
            ? "I have recorded all case observations. Please click 'Generate 3D Reconstruction' below to render the simulation."
            : "I've recorded those details. Could you specify the road conditions and if there were any signals or signs present at the site?",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  // 6. Conclude Investigation Chat
  const handleCompleteInvestigation = async () => {
    setLoading(true);
    try {
      const summaryList = messages
        .filter(m => m.sender === 'user')
        .map(m => m.text);

      if (caseId) {
        await updateCase(caseId, {
          chatInvestigation: {
            conversation: messages,
            observations: observations,
            completedAt: new Date().toISOString()
          },
          status: 'In Progress'
        });
      }
      onComplete({ conversation: messages, observations });
    } catch (err) {
      console.error("Error finalizing chat:", err);
      onComplete({ conversation: messages, observations });
    } finally {
      setLoading(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 md:p-6 h-[60vh] flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-[#00E5FF] animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-sm">Initializing AI Investigator...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-3 md:p-6 flex flex-col h-[85vh] text-left">
      {/* Chat Container */}
      <div className="bg-[#121222]/90 border border-gray-800 rounded-3xl flex flex-col flex-1 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-850 bg-[#0B0B14]">
          <div className="flex items-center gap-3">
            <button 
              onClick={onCancel}
              className="p-2 hover:bg-[#1c1c30] border border-transparent hover:border-gray-800 rounded-xl text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="text-left">
              <span className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-widest block font-bold">Interactive Forensic Chat</span>
              <h2 className="text-md font-bold text-white font-mono leading-none mt-1">AI Investigator</h2>
            </div>
          </div>
          
          <button
            onClick={handleCompleteInvestigation}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-lg shadow-glowPurple border border-[#7c3aed]/50 transition"
          >
            Process & Continue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message Log viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          <AnimatePresence>
            {messages.map((msg) => {
              const isAI = msg.sender === 'ai';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isAI ? 'justify-start' : 'justify-end'} w-full`}
                >
                  <div className={`flex flex-col max-w-[85%] ${isAI ? 'items-start' : 'items-end'}`}>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isAI 
                        ? 'bg-[#1b1c30]/70 border border-gray-800 text-gray-200 rounded-tl-sm' 
                        : 'bg-[#7c3aed] text-white rounded-tr-sm shadow-glowPurple/20'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-mono text-gray-500 mt-1 px-1">{msg.time}</span>
                  </div>
                </motion.div>
              );
            })}
            
            {sending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start w-full"
              >
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#1b1c30]/40 border border-gray-800/40 text-gray-400 text-xs font-mono">
                  <Loader className="w-3.5 h-3.5 animate-spin text-[#00E5FF]" />
                  Investigator is analyzing...
                </div>
              </motion.div>
            )}

            {userMessageCount >= 3 && !sending && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-5 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-2xl gap-3 text-center my-4 mx-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#7c3aed]/20 text-[#a78bfa] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-xs uppercase tracking-wider">Observations Confirmed</h4>
                  <p className="text-gray-400 text-[11px] mt-1">Sufficient details collected. Proceed to view the generated 3D simulation scene.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCompleteInvestigation}
                  className="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-xl text-xs uppercase font-mono tracking-wider font-bold shadow-glowPurple border border-[#7c3aed]/40 transition animate-bounce"
                >
                  Generate 3D Simulation
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Floating extracted observations panel */}
        {observations.length > 0 && (
          <div className="px-6 py-2 bg-[#0c0d1b] border-t border-b border-gray-850 flex items-center gap-2 flex-wrap max-h-16 overflow-y-auto">
            <span className="text-[9px] font-mono text-[#00E5FF] uppercase font-bold tracking-wider">Observations:</span>
            {observations.map((obs, idx) => (
              <span key={idx} className="text-[9px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300">
                {obs}
              </span>
            ))}
          </div>
        )}

        {/* Input area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-[#0B0B14] border-t border-gray-850 flex gap-3 items-center">
          <button
            type="button"
            onClick={toggleRecording}
            className={`w-12 h-12 rounded-xl flex items-center justify-center border transition ${
              isRecording 
                ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' 
                : 'bg-[#121222] border-gray-800 text-gray-400 hover:text-white'
            }`}
            title={isRecording ? 'Stop Voice Recording' : 'Start Voice Input (Speech-to-Text)'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRecording ? "Listening..." : "Type description / answer investigator..."}
            className="flex-1 bg-[#121222] border border-gray-800 focus:border-accentPurple rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition"
            disabled={isRecording}
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="w-12 h-12 bg-accentPurple hover:bg-accentPurple/95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white border border-accentPurple/50 transition"
          >
            <Send className="w-4 h-4 fill-white pl-0.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
