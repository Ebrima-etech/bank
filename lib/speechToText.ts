/**
 * Speech to Text Service
 * Uses Web Speech API for real-time voice input
 */

type SpeechRecognitionEvent = any;
type SpeechRecognitionErrorEvent = any;

interface SpeechOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface SpeechResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

const SpeechRecognition = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

export function isRecognitionSupported(): boolean {
  return SpeechRecognition !== null;
}

export class SpeechToTextService {
  private recognition: SpeechRecognitionEvent | null = null;
  private isListening = false;
  private results: string[] = [];
  private onResultCallback: ((result: SpeechResult) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor(options: SpeechOptions = {}) {
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.language = options.language || 'en-US';
    this.recognition.continuous = options.continuous || false;
    this.recognition.interimResults = options.interimResults !== false;
    this.recognition.maxAlternatives = options.maxAlternatives || 1;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.results = [];
      if (this.onStartCallback) this.onStartCallback();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }

        if (this.onResultCallback) {
          this.onResultCallback({
            transcript: event.results[i].isFinal ? finalTranscript : interimTranscript,
            isFinal: event.results[i].isFinal,
            confidence: confidence,
          });
        }
      }

      if (finalTranscript) {
        this.results.push(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = this.getErrorMessage(event.error);
      if (this.onErrorCallback) {
        this.onErrorCallback(errorMessage);
      }
      console.error('Speech recognition error:', event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEndCallback) this.onEndCallback();
    };
  }

  start(
    onResult: (result: SpeechResult) => void,
    onError: (error: string) => void,
    onStart: () => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Speech Recognition not supported');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      onError('Failed to start recording');
    }
  }

  stop(): string {
    if (!this.recognition) return '';

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }

    return this.results.join(' ').trim();
  }

  abort() {
    if (this.recognition) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  setLanguage(language: string) {
    if (this.recognition) {
      this.recognition.language = language;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  private getErrorMessage(error: string): string {
    const messages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone found. Ensure it is connected.',
      'network': 'Network error. Check your connection.',
      'aborted': 'Recording was cancelled.',
      'service-not-allowed': 'Speech recognition service not allowed.',
      'bad-grammar': 'Grammar error in speech recognition.',
      'bad-request': 'Bad request to speech recognition service.',
    };

    return messages[error] || `Error: ${error}`;
  }
}

// Singleton instance
let serviceInstance: SpeechToTextService | null = null;

export function getSpeechToTextService(
  options?: SpeechOptions
): SpeechToTextService {
  if (!serviceInstance) {
    serviceInstance = new SpeechToTextService(options);
  }
  return serviceInstance;
}
