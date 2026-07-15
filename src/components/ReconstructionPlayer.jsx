import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import Reconstruction3D from './Reconstruction3D';
import { getCaseById } from '../services/firestore';

/**
 * ReconstructionPlayer
 * -------------------
 * A wrapper component that loads the AI‑generated `scene3D` object from a case
 * and provides a cinematic playback UI (play, pause, replay, progress bar).
 *
 * The underlying 3D view logic lives in `Reconstruction3D.jsx`. That component
 * already knows how to render a scene based on a `scene3D` prop and animates
 * objects over a timeline (`currentTime`). Here we simply drive those props and
 * expose nice controls.
 */
export default function ReconstructionPlayer({ caseId }) {
  const [sceneData, setSceneData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Playback state – matches the expectations of Reconstruction3D
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playbackSpeed = 1; // constant speed, can be exposed later

  // Load case and extract scene3D
  useEffect(() => {
    async function fetchCase() {
      try {
        const caseDoc = await getCaseById(caseId);
        const analysis = caseDoc?.aiAnalysis;
        if (!analysis?.scene3D) {
          throw new Error('No AI reconstruction available for this case.');
        }
        setSceneData(analysis.scene3D);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    }
    fetchCase();
  }, [caseId]);

  // Simple time ticker – uses requestAnimationFrame for smoothness
  useEffect(() => {
    let rafId;
    const tick = (timestamp) => {
      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + (timestamp ? 0.016 * playbackSpeed : 0) ; // ~60fps
          // Loop back after 12 seconds (enough for six frames of 2s each)
          return next >= 12 ? 0 : next;
        });
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, playbackSpeed]);

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  const replay = useCallback(() => {
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading reconstruction…</div>;
  }
  if (error) {
    return <div className="text-red-400">Error: {error}</div>;
  }

  return (
    <div className="relative w-full h-screen bg-[#0b0b14]">
      {/* 3D canvas */}
      <Reconstruction3D
        scene3D={sceneData}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        currentTime={currentTime}
        setCurrentTime={setCurrentTime}
        setIsPlaying={setIsPlaying}
      />

      {/* Playback controls – overlayed at bottom centre */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-[#0b0b14]/80 backdrop-blur-sm p-2 rounded-lg border border-gray-700">
        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-[#1e293b] hover:bg-[#334155] transition"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
        </button>
        <button
          onClick={replay}
          className="p-2 rounded-full bg-[#1e293b] hover:bg-[#334155] transition"
          aria-label="Replay"
        >
          <RotateCcw size={20} className="text-white" />
        </button>
        {/* Simple progress bar */}
        <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-accentPurple transition-width duration-100"
            style={{ width: `${(currentTime / 12) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
