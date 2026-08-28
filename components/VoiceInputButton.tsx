'use client';

import { useSpeechInput } from '@/hooks/useSpeechInput';
import { BiMicrophone, BiX, BiCheckCircle } from 'react-icons/bi';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  language?: string;
  className?: string;
  fieldName?: string;
}

export default function VoiceInputButton({
  onTranscript,
  language = 'en-US',
  className = '',
  fieldName = 'field',
}: VoiceInputButtonProps) {
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    confidence,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechInput(language);

  const [showError, setShowError] = useState(!!error);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cancelDetected, setCancelDetected] = useState(false);
  const [spellingMode, setSpellingMode] = useState(false);
  const [spelledText, setSpelledText] = useState('');
  const [skipNextSubmit, setSkipNextSubmit] = useState(false);

  useEffect(() => {
    if (spellingMode && isListening && (interimTranscript || transcript)) {
      const text = (interimTranscript || transcript).toLowerCase().trim();

      if (text.includes('spell')) {
        return;
      }

      if (text === 'done' || text === 'finished') {
        console.log('🎤 Spelling complete, submitting:', transcript + spelledText);
        onTranscript(transcript + spelledText);
        setSpelledText('');
        setSpellingMode(false);
        clearTranscript();
        stopListening();
        return;
      }

      if (text === 'space' || text === 'spa') {
        setSpelledText(prev => prev + ' ');
        clearTranscript();
        return;
      }

      if (text === 'backspace' || text === 'back' || text === 'delete') {
        setSpelledText(prev => prev.slice(0, -1));
        clearTranscript();
        return;
      }

      const words = text.split(/\s+/);
      if (words.length > 0) {
        const lastWord = words[words.length - 1];
        if (lastWord.length <= 1 || lastWord.match(/^[a-z]$/i)) {
          setSpelledText(prev => prev + lastWord);
          clearTranscript();
        }
      }
    }
  }, [spellingMode, isListening, interimTranscript, transcript, clearTranscript, stopListening, onTranscript]);

  useEffect(() => {
    if (isListening && (interimTranscript || transcript)) {
      const text = (interimTranscript || transcript).toLowerCase().trim();

      const cancelRegex = /\bcancel\b/;
      const spellRegex = /\bspell\b/;

      if (spellRegex.test(text) && !spellingMode) {
        console.log('🎙️ Voice command detected: SPELL - switching to spelling mode');

        const beforeSpell = text.replace(/\bspell\b/i, '').trim();

        setSpellingMode(true);
        setSpelledText(beforeSpell ? beforeSpell + ' ' : '');
        setSkipNextSubmit(true);

        toast.success('🎙️ Entering spelling mode - continue speaking...', {
          icon: '🔤',
          duration: 1200,
        });

        setTimeout(() => {
          stopListening();
          clearTranscript();
          startListening();
          setSkipNextSubmit(false);
        }, 300);

        return;
      }

      if (cancelRegex.test(text) && !cancelDetected) {
        console.log('🎙️ Voice command detected: CANCEL');
        setCancelDetected(true);

        toast.success('🎙️ Cancelling via voice command...', {
          icon: '🛑',
          duration: 1200,
        });

        setTimeout(() => {
          stopListening();
          clearTranscript();
          setCancelDetected(false);
          setSpellingMode(false);
          setSpelledText('');
        }, 800);
      }
    }
  }, [isListening, interimTranscript, transcript, stopListening, clearTranscript, cancelDetected, spellingMode, startListening]);

  useEffect(() => {
    if (!isListening && transcript && transcript.trim() && !error && !cancelDetected && !spellingMode && !skipNextSubmit) {
      const text = transcript.toLowerCase().trim();
      if (text === 'spell' || text.includes('spell')) {
        console.log('🎙️ Skipping submit: transcript contains spell command');
        return;
      }

      console.log('🎤 Speech ended, auto-submitting transcript:', transcript);
      onTranscript(transcript);

      setTimeout(() => {
        clearTranscript();
      }, 800);
    }
  }, [isListening, transcript, error, fieldName, onTranscript, clearTranscript, cancelDetected, spellingMode, skipNextSubmit]);

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="Speech recognition not supported in your browser"
        className="p-2 text-gray-300 cursor-not-allowed opacity-50"
      >
        <BiMicrophone size={20} />
      </button>
    );
  }

  const handleStart = () => {
    setShowError(false);
    setPermissionDenied(false);
    startListening();
  };

  const handleStop = () => {
    if (transcript && transcript.trim()) {
      console.log('✅ handleStop: calling onTranscript with:', transcript);
      onTranscript(transcript);

      setTimeout(() => {
        clearTranscript();
      }, 800);
    } else {
      toast.error('No speech detected. Please try again.', {
        duration: 2000,
      });
    }
  };

  const handleClear = () => {
    clearTranscript();
    setShowError(false);
    setPermissionDenied(false);
  };

  const handlePermissionRequest = async () => {
    const toastId = toast.loading('🎤 Requesting microphone access...');

    try {
      console.log('Requesting microphone permission...');

      if (!navigator.mediaDevices?.getUserMedia) {
        toast.dismiss(toastId);
        toast.error('❌ Your browser does not support microphone access', {
          duration: 3000,
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      stream.getTracks().forEach(track => {
        console.log('Stopping audio track:', track.label);
        track.stop();
      });

      setPermissionDenied(false);
      setShowError(false);
      clearTranscript();

      toast.dismiss(toastId);
      toast.success('✅ Microphone enabled! Ready to record.', {
        duration: 2000,
      });

      setTimeout(() => {
        console.log('Starting speech recognition...');
        startListening();
      }, 300);

    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('Permission error:', err.name, err.message);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error(
          '❌ Microphone permission was blocked by your browser.\n\nTo fix this:\n1. Click the lock icon in your address bar\n2. Find "Microphone" and set to "Allow"\n3. Refresh the page',
          {
            duration: 5000,
            style: {
              background: '#fee2e2',
              color: '#991b1b',
              border: '2px solid #dc2626',
            },
          }
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('🎧 No microphone found. Please connect a microphone to your device.', {
          duration: 3000,
        });
      } else if (err.name === 'NotReadableError' || err.name === 'OverconstrainedError') {
        toast.error('🎤 Microphone is being used by another application. Please close other apps and try again.', {
          duration: 3000,
        });
      } else if (err.name === 'SecurityError') {
        toast.error('🔒 Security error: This site may not have permission to access microphone.', {
          duration: 3000,
        });
      } else {
        toast.error(`❌ Error: ${err.name || 'Failed to access microphone'}`, {
          duration: 3000,
        });
      }
    }
  };

  if (error && error.includes('not-allowed')) {
    return (
      <>
        <button
          type="button"
          disabled
          className="p-2.5 text-gray-400 cursor-not-allowed opacity-50"
          title="Microphone access denied"
        >
          <BiMicrophone size={22} />
        </button>
        <div className="fixed inset-0 pointer-events-none z-50 flex items-end justify-center pb-6">
          <div className="max-w-md w-11/12 mx-auto pointer-events-auto bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 border-2 border-red-400 rounded-xl p-5 shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="text-3xl">🎤</div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Microphone Permission Blocked</p>
              <p className="text-xs text-gray-700 mt-1">
                Your browser is blocking microphone access
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 mb-4 border border-orange-200">
            <p className="text-xs font-semibold text-gray-900 mb-2">📍 How to Fix:</p>
            <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
              <li>Click the <strong>lock icon</strong> in the address bar</li>
              <li>Find <strong>&quot;Microphone&quot;</strong> in the popup</li>
              <li>Change it to <strong>&quot;Allow&quot;</strong></li>
              <li><strong>Refresh</strong> this page (F5)</li>
              <li>Click <strong>&quot;Enable Microphone&quot;</strong> button again</li>
            </ol>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handlePermissionRequest}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition transform hover:scale-105 active:scale-95 shadow-md"
            >
              🎤 Enable Microphone
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="w-full text-gray-600 hover:text-gray-800 text-xs underline py-1"
            >
              Dismiss
            </button>
          </div>

            <p className="text-xs text-gray-600 text-center mt-3">
              💡 Make sure your microphone is connected and not being used by another app
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error && showError) {
    const errorMessages: Record<string, string> = {
      'no-speech': '🤐 No speech detected. Please try speaking again.',
      'audio-capture': '🎧 Microphone not found. Check your connection.',
      'network': '🌐 Network error. Check your connection.',
      'aborted': '⏹️ Recording was cancelled.',
    };

    const displayError = Object.keys(errorMessages).find(key => error.includes(key))
      ? errorMessages[Object.keys(errorMessages).find(key => error.includes(key))!]
      : `🎤 ${error}`;

    return (
      <>
        <button
          type="button"
          onClick={() => {
            setShowError(false);
            handleStart();
          }}
          className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <BiMicrophone size={22} />
        </button>
        <div className="fixed inset-0 pointer-events-none z-50 flex items-end justify-center pb-6">
          <div className="max-w-sm w-11/12 mx-auto pointer-events-auto bg-red-50 border-2 border-red-300 rounded-lg p-3 shadow-md animate-pulse">
            <p className="text-sm font-medium text-red-700 mb-2">{displayError}</p>
            <button
              type="button"
              onClick={handleClear}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleStart}
        disabled={isListening}
        title={`Click to start voice input for ${fieldName}`}
        className={`relative p-2.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 active:bg-indigo-100 rounded-lg transition transform hover:scale-110 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <BiMicrophone size={22} />
        <div className="absolute inset-0 rounded-lg bg-indigo-400 opacity-0 group-hover:opacity-10 transition"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full group-hover:animate-pulse"></div>
      </button>

      {isListening && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-end justify-center pb-6">
          <div className={`max-w-md w-11/12 mx-auto pointer-events-auto rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300 transition-all ${
            cancelDetected
              ? 'bg-orange-100 border-2 border-orange-400'
              : 'bg-red-50 border-2 border-red-200'
          }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex items-center justify-center">
              <div className={`absolute w-4 h-4 rounded-full animate-ping ${
                cancelDetected ? 'bg-orange-500' : spellingMode ? 'bg-blue-500' : 'bg-red-500'
              }`}></div>
              <div className={`w-4 h-4 rounded-full ${
                cancelDetected ? 'bg-orange-600' : spellingMode ? 'bg-blue-600' : 'bg-red-600'
              }`}></div>
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold ${
                cancelDetected ? 'text-orange-700' : spellingMode ? 'text-blue-700' : 'text-red-700'
              }`}>
                {cancelDetected ? '🛑 Cancelling...' : spellingMode ? '🔤 Spelling Mode...' : '🎤 Recording...'}
              </p>
              <p className={`text-xs mt-0.5 ${
                cancelDetected ? 'text-orange-600' : spellingMode ? 'text-blue-600' : 'text-red-600'
              }`}>
                {cancelDetected
                  ? 'Voice command detected: Cancel'
                  : spellingMode
                  ? 'Spell letter by letter • Say "space" for space • Say "done" to finish'
                  : 'Say "cancel" to stop, or use the buttons below'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 h-6 bg-white bg-opacity-60 rounded-lg px-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-600 rounded-full"
                style={{
                  height: `${20 + Math.random() * 30}%`,
                  animation: `wave 0.6s ease-in-out ${i * 0.1}s infinite`,
                }}
              />
            ))}
            <style>{`
              @keyframes wave {
                0%, 100% { height: 20%; }
                50% { height: 100%; }
              }
            `}</style>
          </div>

          {spellingMode ? (
            <p className="text-sm text-gray-800 bg-white rounded-lg px-2 py-1.5 text-center mb-3 font-mono">
              <span className="text-blue-700 font-bold">{transcript}{spelledText}</span>
              {interimTranscript && (
                <span className="text-gray-400 italic ml-1 animate-pulse">
                  {interimTranscript}
                </span>
              )}
            </p>
          ) : (
            (interimTranscript || transcript) && (
              <p className="text-sm text-gray-800 bg-white rounded-lg px-2 py-1.5 text-center mb-3">
                <span className="text-gray-700">
                  {transcript || interimTranscript}
                </span>
                {interimTranscript && !transcript && (
                  <span className="text-gray-400 italic ml-1 animate-pulse">
                    {interimTranscript}
                  </span>
                )}
              </p>
            )
          )}

          <div className="flex gap-2">
            {!spellingMode && (
              <button
                type="button"
                onClick={() => {
                  setSpellingMode(true);
                  setSpelledText('');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-lg transition font-medium text-sm"
                title="Switch to spelling mode - spell letter by letter"
              >
                🔤 Spell
              </button>
            )}
            <button
              type="button"
              onClick={handleStop}
              className={`flex-1 ${spellingMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-2.5 rounded-lg transition font-medium text-sm`}
              title={spellingMode ? "Finish spelling and submit" : "Stop recording and use the captured text"}
            >
              {spellingMode ? '✓ Done Spelling' : '✓ Stop & Use'}
            </button>
            <button
              type="button"
              onClick={() => {
                stopListening();
                clearTranscript();
                setSpellingMode(false);
                setSpelledText('');
              }}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2.5 rounded-lg transition font-medium text-sm"
              title="Cancel recording and discard the text"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
        </div>
      )}

      {transcript && !isListening && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-end justify-center pb-6">
          <div className="max-w-md w-11/12 mx-auto pointer-events-auto bg-green-50 border-2 border-green-300 rounded-xl p-3 shadow-md animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-start gap-2">
              <BiCheckCircle className="text-green-600 mt-1 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 mb-1">✓ Captured</p>
                <p className="text-sm text-gray-800 mb-2 line-clamp-2">{transcript}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    Confidence: <span className="font-semibold">{(confidence * 100).toFixed(0)}%</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
