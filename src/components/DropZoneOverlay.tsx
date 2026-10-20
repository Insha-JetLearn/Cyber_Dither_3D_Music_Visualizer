import React, { useEffect, useState } from 'react';
import { FileAudio, UploadCloud } from 'lucide-react';

interface DropZoneOverlayProps {
  onFileDropped: (file: File) => void;
}

export const DropZoneOverlay: React.FC<DropZoneOverlayProps> = ({ onFileDropped }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name)) {
          onFileDropped(file);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFileDropped]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md pointer-events-none animate-in fade-in duration-200">
      <div className="border-2 border-dashed border-cyan-400 rounded-3xl p-12 max-w-lg w-full text-center bg-cyan-950/40 shadow-[0_0_60px_rgba(0,240,255,0.4)] flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.5)] animate-bounce">
          <UploadCloud className="w-10 h-10" />
        </div>
        <div>
          <h2 className="font-orbitron font-extrabold text-2xl text-cyan-300 tracking-wider neon-glow-cyan mb-2">
            DROP AUDIO FILE TO VISUALIZE
          </h2>
          <p className="font-tech text-sm text-gray-300">
            Supports MP3, WAV, OGG, FLAC, and browser audio formats
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/30 text-xs font-mono text-cyan-400">
          <FileAudio className="w-4 h-4" />
          <span>Real-time Audio Decoding & WebGL Sync</span>
        </div>
      </div>
    </div>
  );
};
