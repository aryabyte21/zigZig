"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Mic, 
  Square, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Play,
  Volume2
} from "lucide-react";

interface VoiceStepProps {
  onComplete: (data: { voiceId: string }) => void;
  initialData: any;
  onSkip?: () => void;
}

interface AudioSample {
  prompt: string;
  blob: Blob | null;
  url: string | null;
  recorded: boolean;
}

export function VoiceStep({ onComplete, initialData, onSkip }: VoiceStepProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSample, setCurrentSample] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([
    { 
      prompt: `Hi, I'm ${initialData?.resume?.personalInfo?.name || "your name"}. Thanks for visiting my portfolio.`,
      blob: null,
      url: null,
      recorded: false
    },
    { 
      prompt: `I have experience in ${initialData?.resume?.skills?.[0] || "software development"} and ${initialData?.resume?.skills?.[1] || "problem solving"}.`,
      blob: null,
      url: null,
      recorded: false
    },
    { 
      prompt: "Feel free to ask me anything about my work, projects, or experience.",
      blob: null,
      url: null,
      recorded: false
    }
  ]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      audioSamples.forEach(sample => {
        if (sample.url) {
          URL.revokeObjectURL(sample.url);
        }
      });
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Requesting microphone permission...');
      
      // Check if we're in incognito mode (Chrome specific)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        console.log('Storage quota:', estimate.quota);
        if (estimate.quota && estimate.quota < 120000000) { // Less than 120MB suggests incognito
          console.warn('Possibly running in incognito mode - audio features may be limited');
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      console.log('Microphone access granted:', stream.getAudioTracks().length, 'tracks');
      
      // Try to use the best supported audio format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Use default
          }
        }
      }
      
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        console.log('Data available event:', {
          dataSize: e.data.size,
          dataType: e.data.type,
          totalChunks: chunksRef.current.length + 1
        });
        
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        } else {
          console.warn('Received empty data chunk!');
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', chunksRef.current.length);
        
        if (chunksRef.current.length === 0) {
          console.error('No audio chunks recorded!');
          toast.error("Recording failed - no audio data captured");
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        
        console.log('Recording stopped, blob created:', {
          chunks: chunksRef.current.length,
          size: blob.size,
          type: blob.type,
          url: url
        });
        
        if (blob.size === 0) {
          console.error('Blob has zero size!');
          toast.error("Recording failed - empty audio file");
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        setAudioSamples(prev => {
          const updated = [...prev];
          updated[currentSample] = {
            ...updated[currentSample],
            blob,
            url,
            recorded: true
          };
          return updated;
        });
        
        toast.success("Recording saved!");
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      // Request data every 100ms for smoother recording
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop after 10 seconds
          if (newTime >= 10) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playAudio = async (index: number) => {
    const sample = audioSamples[index];
    
    if (!sample.blob) {
      toast.error("No recording available");
      return;
    }
    
    console.log('=== PLAYBACK DEBUG ===');
    console.log('Blob size:', sample.blob.size, 'bytes');
    console.log('Blob type:', sample.blob.type);
    console.log('Has URL:', !!sample.url);
    console.log('Browser:', navigator.userAgent);
    
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      
      // Create fresh blob URL
      const audioUrl = URL.createObjectURL(sample.blob);
      console.log('Created blob URL:', audioUrl);
      
      // Create audio element
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 1.0;
      audioRef.current = audio;
      
      // Set source AFTER creating element (important for Chrome)
      audio.src = audioUrl;
      
      console.log('Waiting for audio to load...');
      
      // Wait for audio to be loadable
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('Timeout reached, attempting playback anyway...');
          resolve();
        }, 2000);
        
        audio.oncanplay = () => {
          console.log('Audio can play! Duration:', audio.duration);
          clearTimeout(timeout);
          resolve();
        };
        
        audio.onloadeddata = () => {
          console.log('Audio data loaded');
        };
        
        audio.onerror = (e) => {
          clearTimeout(timeout);
          console.error('Audio error event:', {
            error: audio.error,
            code: audio.error?.code,
            message: audio.error?.message
          });
          reject(new Error(audio.error?.message || 'Audio load failed'));
        };
        
        // Trigger load
        audio.load();
      });
      
      // Attempt playback
      console.log('Attempting to play...');
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('✅ Playback started successfully!');
        toast.success("🔊 Playing recording", { duration: 1500 });
      }
      
      // Cleanup when done
      audio.onended = () => {
        console.log('Playback ended');
        URL.revokeObjectURL(audioUrl);
      };
      
    } catch (err: any) {
      console.error("❌ Playback error:", err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      // Provide helpful error messages
      if (err.name === 'NotAllowedError') {
        toast.error("🔒 Incognito mode: Use the browser player below instead", { duration: 3000 });
      } else if (err.name === 'NotSupportedError') {
        toast.error("❌ Audio format not supported. Try the browser player below.", { duration: 3000 });
      } else if (err.message?.includes('decode')) {
        toast.error("❌ Cannot decode audio. Try re-recording.", { duration: 3000 });
      } else {
        toast.error(`❌ Playback failed. Use the browser player below.`, { duration: 3000 });
      }
    }
  };

  const retakeRecording = (index: number) => {
    setCurrentSample(index);
    const sample = audioSamples[index];
    if (sample.url) {
      URL.revokeObjectURL(sample.url);
    }
    setAudioSamples(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        blob: null,
        url: null,
        recorded: false
      };
      return updated;
    });
  };

  const handleNext = () => {
    if (currentSample < audioSamples.length - 1) {
      setCurrentSample(currentSample + 1);
    }
  };

  const allRecorded = audioSamples.every(sample => sample.recorded);

  const handleComplete = async () => {
    setIsProcessing(true);
    
    try {
      // Upload audio files and clone voice
      const formData = new FormData();
      audioSamples.forEach((sample, index) => {
        if (sample.blob) {
          formData.append(`audio_${index}`, sample.blob, `sample_${index}.webm`);
        }
      });
      formData.append('name', initialData?.resume?.personalInfo?.name || 'User');

      const response = await fetch("/api/clone-voice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Voice cloning failed");
      }

      const { voiceId } = await response.json();
      
      toast.success("Voice cloned successfully!");
      onComplete({ voiceId });
      
    } catch (error) {
      console.error("Error cloning voice:", error);
      toast.error("Failed to clone voice. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const recordedCount = audioSamples.filter(s => s.recorded).length;
  const progress = (recordedCount / audioSamples.length) * 100;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Record 3 short voice samples to create your AI voice assistant.
          Your AI will use your voice to talk to recruiters 24/7.
        </p>
        <Badge variant="secondary" className="mt-2">
          <Sparkles className="h-3 w-3 mr-1" />
          Optional - Skip if you prefer
        </Badge>
      </div>

      {/* Incognito Mode Warning */}
      {typeof window !== 'undefined' && navigator.userAgent.includes('Chrome') && (
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-600 mb-1">
                  🔒 Incognito Mode Detected
                </p>
                <p className="text-xs text-muted-foreground">
                  After recording, use the <strong>blue audio player</strong> to hear your recording. 
                  The "Play" button may not work due to browser restrictions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{recordedCount} / {audioSamples.length} samples</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Current Sample */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Sample {currentSample + 1} of {audioSamples.length}</span>
            {audioSamples[currentSample].recorded && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </CardTitle>
          <CardDescription>
            Read the following sentence naturally
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt to read */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-lg font-medium leading-relaxed">
                "{audioSamples[currentSample].prompt}"
              </p>
            </CardContent>
          </Card>

          {/* Recording controls */}
          <div className="flex flex-col items-center gap-4">
            {!audioSamples[currentSample].recorded ? (
              <>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full max-w-xs h-16 text-lg"
                  disabled={isProcessing}
                >
                  {isRecording ? (
                    <>
                      <Square className="mr-2 h-6 w-6" />
                      Stop Recording ({10 - recordingTime}s)
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-6 w-6" />
                      Start Recording
                    </>
                  )}
                </Button>
                
                {isRecording && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                    Recording... ({recordingTime}s / 10s max)
                  </div>
                )}
              </>
            ) : (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Recording complete!
                </div>
                
                {/* Native audio player - Works in all modes including incognito */}
                {audioSamples[currentSample].url && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Volume2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-600">Play Your Recording</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-muted-foreground">
                            Size: {audioSamples[currentSample].blob ? (audioSamples[currentSample].blob!.size / 1024).toFixed(2) + ' KB' : 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Type: {audioSamples[currentSample].blob?.type || 'Unknown'}
                          </p>
                        </div>
                        {audioSamples[currentSample].blob && audioSamples[currentSample].blob!.size === 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            ⚠️ Recording is empty! Please try again.
                          </p>
                        )}
                      </div>
                    </div>
                    <audio 
                      controls 
                      src={audioSamples[currentSample].url || ''}
                      className="w-full h-10"
                      preload="auto"
                      controlsList="nodownload"
                      onError={(e) => {
                        console.error('Native audio player error:', e);
                        toast.error("Audio player error - check console for details");
                      }}
                      onLoadedData={() => {
                        console.log('Native audio loaded successfully');
                      }}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => playAudio(currentSample)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Play
                  </Button>
                  <Button
                    onClick={() => retakeRecording(currentSample)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Re-record
                  </Button>
                </div>
                
                {currentSample < audioSamples.length - 1 && (
                  <Button
                    onClick={handleNext}
                    className="w-full"
                  >
                    Next Sample
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All samples status */}
      <div className="grid grid-cols-3 gap-2">
        {audioSamples.map((sample, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all ${
              index === currentSample ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setCurrentSample(index)}
          >
            <CardContent className="p-3 text-center">
              <div className="flex flex-col items-center gap-1">
                {sample.recorded ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Mic className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-xs font-medium">Sample {index + 1}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        {onSkip && (
          <Button
            onClick={onSkip}
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            Skip for Now
          </Button>
        )}
        <Button
          onClick={handleComplete}
          disabled={!allRecorded || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cloning Voice...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Create AI Voice
            </>
          )}
        </Button>
      </div>

      {/* Info card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Volume2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-semibold mb-1">Why record your voice?</p>
              <p>Your AI assistant will use your cloned voice to answer questions about your experience. Recruiters can talk to your AI 24/7, even while you sleep!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

