import { useState, useCallback, useEffect } from 'react';
import { getSpeechToTextService, isRecognitionSupported, SpeechToTextService } from '@/lib/speechToText';

interface UseSpeechInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  confidence: number;
  startListening: () => void;
  stopListening: () => string;
  clearTranscript: () => void;
  setLanguage: (lang: string) => void;
}

export function useSpeechInput(language: string = 'en-US'): UseSpeechInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [service, setService] = useState<SpeechToTextService | null>(null);

  useEffect(() => {
    const speechService = getSpeechToTextService({ language });
    setService(speechService);
  }, [language]);

  const startListening = useCallback(() => {
    if (!service || !isRecognitionSupported()) {
      setError('Speech Recognition not supported');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);

    service.start(
      (result) => {
        if (result.isFinal) {
          setTranscript((prev) => prev + (prev ? ' ' : '') + result.transcript);
          setInterimTranscript('');
        } else {
          setInterimTranscript(result.transcript);
        }
        setConfidence(result.confidence);
      },
      (err) => {
        setError(err);
        setIsListening(false);
      },
      () => {
        setIsListening(true);
      },
      () => {
        setIsListening(false);
      }
    );
  }, [service]);

  const stopListening = useCallback(() => {
    if (!service) return '';

    const finalTranscript = service.stop();
    setTranscript(finalTranscript);
    setInterimTranscript('');
    setIsListening(false);
    return finalTranscript;
  }, [service]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setConfidence(0);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    if (service) {
      service.setLanguage(lang);
    }
  }, [service]);

  return {
    isListening,
    isSupported: isRecognitionSupported(),
    transcript,
    interimTranscript,
    error,
    confidence,
    startListening,
    stopListening,
    clearTranscript,
    setLanguage,
  };
}
