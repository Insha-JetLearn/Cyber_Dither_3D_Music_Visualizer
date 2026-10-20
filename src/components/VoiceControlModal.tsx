import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Radio, Volume2, X } from 'lucide-react';
import { GenrePreset, VisualizerMode } from '../types/visualizer';

interface VoiceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
  onSelectMode: (mode: VisualizerMode) => void;
  onSelectGenre: (genre: GenrePreset) => void;
  onTogglePlay: () => void;
  onToggleWarp: () => void;
  onResetCamera: () => void;
}

export const VoiceControlModal: React.FC<VoiceControlModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  onSelectGenre,
  onTogglePlay,
  onToggleWarp,
  onResetCamera,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastExecuted, setLastExecuted] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isOpen || !isSupported) return;

    const SpeechRec =
      (window as unknown as { SpeechRecognition: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition;

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMsg('');
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech recognition error:', e.error);
      if (e.error === 'not-allowed') {
        setErrorMsg('Microphone access was denied in browser permissions.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          setTranscript(event.results[i][0].transcript);
        }
      }

      if (finalTranscript) {
        const text = finalTranscript.trim().toLowerCase();
        setTranscript(text);
        handleVoiceCommand(text);
      }
    };

    try {
      recognition.start();
    } catch {
      // Ignored if already started
    }

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignored
      }
    };
  }, [isOpen]);

  const handleVoiceCommand = (cmd: string) => {
    if (cmd.includes('play') || cmd.includes('start') || cmd.includes('resume')) {
      onTogglePlay();
      setLastExecuted('Command: PLAY MUSIC');
    } else if (cmd.includes('pause') || cmd.includes('stop')) {
      onTogglePlay();
      setLastExecuted('Command: PAUSE MUSIC');
    } else if (cmd.includes('warp')) {
      onToggleWarp();
      setLastExecuted('Command: TOGGLE WARP SPEED');
    } else if (cmd.includes('galaxy')) {
      onSelectMode('galaxy');
      setLastExecuted('Mode: PARTICLE GALAXY');
    } else if (cmd.includes('tunnel')) {
      onSelectMode('tunnel');
      setLastExecuted('Mode: AUDIO TUNNEL');
    } else if (cmd.includes('wave')) {
      onSelectMode('wave');
      setLastExecuted('Mode: NEON WAVE');
    } else if (cmd.includes('spectrum')) {
      onSelectMode('spectrum');
      setLastExecuted('Mode: CIRCULAR SPECTRUM');
    } else if (cmd.includes('starfield') || cmd.includes('star')) {
      onSelectMode('starfield');
      setLastExecuted('Mode: STARFIELD');
    } else if (cmd.includes('reactor')) {
      onSelectMode('reactor');
      setLastExecuted('Mode: GEOMETRIC REACTOR');
    } else if (cmd.includes('dance')) {
      onSelectGenre('dance');
      setLastExecuted('Genre: DANCE PRESET');
    } else if (cmd.includes('pop')) {
      onSelectGenre('pop');
      setLastExecuted('Genre: POP PRESET');
    } else if (cmd.includes('lo-fi') || cmd.includes('lofi') || cmd.includes('chill')) {
      onSelectGenre('lofi');
      setLastExecuted('Genre: LO-FI PRESET');
    } else if (cmd.includes('industrial') || cmd.includes('metal')) {
      onSelectGenre('industrial');
      setLastExecuted('Genre: INDUSTRIAL PRESET');
    } else if (cmd.includes('reset') || cmd.includes('camera')) {
      onResetCamera();
      setLastExecuted('Command: RESET CAMERA');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto">
      <div className="cyber-panel rounded-2xl w-full max-w-md border border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.3)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-purple-950/40 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <h3 className="font-orbitron font-bold text-xs sm:text-sm text-purple-300 tracking-wider">
              VOICE CONTROL TERMINAL
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          {!isSupported ? (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300">
              Web Speech Recognition is not supported by your current browser. Please try Google Chrome or Microsoft Edge.
            </div>
          ) : errorMsg ? (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300">
              {errorMsg}
            </div>
          ) : (
            <>
              {/* Listening Status Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-purple-500/20">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isListening ? 'bg-purple-400 shadow-[0_0_10px_#c084fc] animate-ping' : 'bg-gray-600'
                    }`}
                  />
                  <span className="font-tech text-gray-200">
                    {isListening ? 'LISTENING FOR SPOKEN COMMANDS...' : 'MICROPHONE INACTIVE'}
                  </span>
                </div>
                {isListening ? (
                  <Mic className="w-4 h-4 text-purple-400 animate-pulse" />
                ) : (
                  <MicOff className="w-4 h-4 text-gray-500" />
                )}
              </div>

              {/* Live Transcript Display */}
              <div className="p-3 rounded-xl bg-black/70 border border-white/10 min-h-14 font-mono text-cyan-300 flex items-center justify-center text-center">
                {transcript ? `"${transcript}"` : <span className="text-gray-500 italic">Say a command...</span>}
              </div>

              {/* Feedback status */}
              {lastExecuted && (
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 font-tech text-emerald-300 text-center tracking-wider">
                  ✓ {lastExecuted}
                </div>
              )}

              {/* Supported Voice Commands Reference */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <span className="font-tech text-[10px] text-gray-400 uppercase tracking-wider block">
                  AVAILABLE SPOKEN COMMANDS:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-tech text-gray-300">
                  <div className="p-1.5 rounded bg-white/5 border border-white/5">"Play" / "Pause"</div>
                  <div className="p-1.5 rounded bg-white/5 border border-white/5">"Warp Speed"</div>
                  <div className="p-1.5 rounded bg-white/5 border border-white/5">"Galaxy" / "Tunnel"</div>
                  <div className="p-1.5 rounded bg-white/5 border border-white/5">"Wave" / "Spectrum"</div>
                  <div className="p-1.5 rounded bg-white/5 border border-white/5">"Reactor" / "Starfield"</div>
                  <div className="p-1.5 rounded bg-white/5 border border-white/5">"Dance" / "Lo-Fi" / "Pop"</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
