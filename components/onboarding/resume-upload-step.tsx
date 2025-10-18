"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  X
} from "lucide-react";

interface ResumeUploadStepProps {
  onComplete: (data: any) => void;
  initialData: any;
}

export function ResumeUploadStep({ onComplete, initialData }: ResumeUploadStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [inputMethod, setInputMethod] = useState<'file' | 'text'>('text');
  const [resumeText, setResumeText] = useState<string>('');

  // Removed unnecessary useEffect - onComplete is called directly after processing

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    setIsUploading(true);
    setProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to Supabase Storage
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload-resume", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const { fileUrl } = await uploadResponse.json();
      setProgress(100);
      clearInterval(progressInterval);

      // Process resume with AI
      setIsProcessing(true);
      const processResponse = await fetch("/api/process-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileUrl, fileName: file.name }),
      });

      if (!processResponse.ok) throw new Error("Processing failed");

      const data = await processResponse.json();
      setExtractedData(data);
      onComplete({ resume: data });
      
      toast.success("Resume processed successfully!");
    } catch (error) {
      console.error("Error processing resume:", error);
      toast.error("Failed to process resume. Please try again.");
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, []);

  const handleTextProcessing = async () => {
    if (!resumeText.trim()) {
      toast.error("Please enter your resume text");
      return;
    }

    setIsProcessing(true);
    try {
      const processResponse = await fetch("/api/process-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeText: resumeText.trim() }),
      });

      if (!processResponse.ok) throw new Error("Processing failed");

      const data = await processResponse.json();
      setExtractedData(data);
      onComplete({ resume: data });
      
      toast.success("Resume processed successfully!");
    } catch (error) {
      console.error("Error processing resume:", error);
      toast.error("Failed to process resume. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Removed handleContinue - onComplete is called directly after processing

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setExtractedData(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Input Method Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setInputMethod('text')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMethod === 'text'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Paste Text (Recommended)
          </button>
          <button
            onClick={() => setInputMethod('file')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMethod === 'file'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Upload File
          </button>
        </div>
      </div>

      {/* PDF Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Have a PDF resume?</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              For best results, copy and paste your resume text using the "Paste Text" option. 
              This ensures accurate AI processing and contact information extraction.
            </p>
          </div>
        </div>
      </div>

      {/* Text Input Area */}
      {inputMethod === 'text' && !extractedData && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Paste Your Resume Text</h3>
                <p className="text-muted-foreground mb-4">
                  Copy and paste your resume content below. Our AI will extract the key information.
                </p>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume content here..."
                className="w-full min-h-[300px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={handleTextProcessing}
                disabled={!resumeText.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  "Process Resume Text"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      {inputMethod === 'file' && !uploadedFile && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? "Drop your resume here" : "Upload your resume"}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your resume, or click to browse
              </p>
              <Badge variant="secondary">PDF, DOC, DOCX • Max 10MB</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploadedFile && (isUploading || isProcessing) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <h4 className="font-medium">{uploadedFile.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
            
            {isUploading && (
              <>
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            )}
            
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing with AI...</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Extracting your experience, skills, and achievements
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Extracted Data Preview */}
      {extractedData && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold">Resume Processed Successfully</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {extractedData.name && (
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground">Name</h5>
                  <p>{extractedData.name}</p>
                </div>
              )}

              {extractedData.title && (
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground">Professional Title</h5>
                  <p>{extractedData.title}</p>
                </div>
              )}

              {extractedData.summary && (
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground">Summary</h5>
                  <p className="text-sm">{extractedData.summary}</p>
                </div>
              )}

              {extractedData.skills && extractedData.skills.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-2">Skills</h5>
                  <div className="flex flex-wrap gap-1">
                    {extractedData.skills.slice(0, 10).map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {extractedData.skills.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{extractedData.skills.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {extractedData.experience && extractedData.experience.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-2">
                    Experience ({extractedData.experience.length} positions)
                  </h5>
                  <div className="space-y-2">
                    {extractedData.experience.slice(0, 2).map((exp: any, index: number) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{exp.title} at {exp.company}</p>
                        <p className="text-muted-foreground">{exp.duration}</p>
                      </div>
                    ))}
                    {extractedData.experience.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{extractedData.experience.length - 2} more positions
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="text-center">
              <p className="text-sm text-green-600 font-medium">
                ✓ Ready to continue to next step
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Entry Option */}
      {!uploadedFile && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Don't have a resume file?
          </p>
          <Button 
            variant="outline" 
            onClick={() => onComplete({ resume: null })}
          >
            Skip and enter manually
          </Button>
        </div>
      )}
    </div>
  );
}
