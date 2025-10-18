"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  X,
  Brain,
  Sparkles,
  Building,
  GraduationCap,
  Github,
  Linkedin,
  Globe,
  Zap
} from "lucide-react";

interface EnhancedResumeUploadProps {
  onComplete: (data: any) => void;
  initialData: any;
}

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
}

export function EnhancedResumeUpload({ onComplete, initialData }: EnhancedResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [inputMethod, setInputMethod] = useState<'file' | 'text'>('text');
  const [resumeText, setResumeText] = useState<string>('');
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    {
      id: 'upload',
      label: 'AI Processing',
      icon: <Brain className="h-4 w-4" />,
      status: 'pending',
      description: 'Analyzing resume with Gemini AI'
    },
    {
      id: 'extract',
      label: 'Data Extraction',
      icon: <Upload className="h-4 w-4" />,
      status: 'pending',
      description: 'Extracting name, links, and experience'
    },
    {
      id: 'enrich',
      label: 'Logo Enhancement',
      icon: <Sparkles className="h-4 w-4" />,
      status: 'pending',
      description: 'Fetching company and school logos'
    },
    {
      id: 'complete',
      label: 'Complete',
      icon: <CheckCircle className="h-4 w-4" />,
      status: 'pending',
      description: 'Your enhanced resume is ready!'
    }
  ]);

  const updateStepStatus = (stepId: string, status: ProcessingStep['status']) => {
    setProcessingSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Upload
      updateStepStatus('upload', 'processing');
      
      const formData = new FormData();
      formData.append("file", file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 25) {
            clearInterval(progressInterval);
            return 25;
          }
          return prev + 5;
        });
      }, 100);

      const uploadResponse = await fetch("/api/process-pdf-resume", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(30);
      updateStepStatus('upload', 'completed');

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Upload failed");
      }

      // Step 2: AI Extraction
      updateStepStatus('extract', 'processing');
      setProgress(50);

      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const data = await uploadResponse.json();
      setProgress(75);
      updateStepStatus('extract', 'completed');

      // Step 3: Data Enrichment
      updateStepStatus('enrich', 'processing');
      
      // Simulate enrichment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(90);
      updateStepStatus('enrich', 'completed');

      // Step 4: Complete
      updateStepStatus('complete', 'processing');
      setProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus('complete', 'completed');

      // PDF endpoint returns data directly, not wrapped in data property
      console.log('PDF processing completed, data:', data);
      setExtractedData(data);
      onComplete({ resume: data });
      
      toast.success("Resume processed successfully with AI enhancements!");
      
    } catch (error: any) {
      console.error("Error processing resume:", error);
      toast.error(`Failed to process resume: ${error.message}`);
      
      // Mark current processing step as error
      const currentStep = processingSteps.find(step => step.status === 'processing');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error');
      }
      
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  }, [processingSteps, onComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleTextProcessing = async () => {
    if (!resumeText.trim()) {
      toast.error("Please enter your resume text");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Processing
      updateStepStatus('upload', 'processing');
      setProgress(25);

      const processResponse = await fetch("/api/process-text-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeText: resumeText.trim() }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || "Processing failed");
      }

      updateStepStatus('upload', 'completed');
      updateStepStatus('extract', 'processing');
      setProgress(50);

      const data = await processResponse.json();
      
      updateStepStatus('extract', 'completed');
      updateStepStatus('enrich', 'processing');
      setProgress(75);

      // Simulate enrichment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateStepStatus('enrich', 'completed');
      updateStepStatus('complete', 'processing');
      setProgress(90);

      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus('complete', 'completed');
      setProgress(100);

      console.log('Text processing completed, data:', data);
      setExtractedData(data);
      onComplete({ resume: data });
      
      toast.success("Resume processed successfully!");
    } catch (error: any) {
      console.error("Error processing resume:", error);
      toast.error(`Failed to process resume: ${error.message}`);
      
      const currentStep = processingSteps.find(step => step.status === 'processing');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setExtractedData(null);
    setProgress(0);
    setResumeText('');
    setProcessingSteps(prev => 
      prev.map(step => ({ ...step, status: 'pending' }))
    );
  };

  if (extractedData) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-lg">Resume Processed Successfully!</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <h5 className="font-semibold text-sm">Personal Information</h5>
              </div>
              
              {extractedData.personalInfo && (
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {extractedData.personalInfo.name}</div>
                  <div><strong>Email:</strong> {extractedData.personalInfo.email}</div>
                  <div><strong>Location:</strong> {extractedData.personalInfo.location}</div>
                  {extractedData.personalInfo.phone && (
                    <div><strong>Phone:</strong> {extractedData.personalInfo.phone}</div>
                  )}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Globe className="h-4 w-4 text-purple-600" />
                </div>
                <h5 className="font-semibold text-sm">Social Links</h5>
              </div>
              
              {extractedData.socialLinks && (
                <div className="space-y-2">
                  {extractedData.socialLinks.linkedin && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-3 w-3 text-blue-600" />
                      <span className="text-xs">LinkedIn Profile</span>
                    </div>
                  )}
                  {extractedData.socialLinks.github && (
                    <div className="flex items-center gap-2">
                      <Github className="h-3 w-3 text-gray-800 dark:text-gray-200" />
                      <span className="text-xs">GitHub Profile</span>
                    </div>
                  )}
                  {extractedData.socialLinks.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3 text-green-600" />
                      <span className="text-xs">Portfolio Website</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
                <h5 className="font-semibold text-sm">Work Experience</h5>
              </div>
              
              {extractedData.experience && extractedData.experience.length > 0 && (
                <div className="space-y-2">
                  {extractedData.experience.slice(0, 3).map((exp: any, index: number) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{exp.title}</div>
                      <div className="text-muted-foreground">{exp.company}</div>
                    </div>
                  ))}
                  {extractedData.experience.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{extractedData.experience.length - 3} more positions
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Education */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <GraduationCap className="h-4 w-4 text-orange-600" />
                </div>
                <h5 className="font-semibold text-sm">Education</h5>
              </div>
              
              {extractedData.education && extractedData.education.length > 0 && (
                <div className="space-y-2">
                  {extractedData.education.map((edu: any, index: number) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{edu.degree}</div>
                      <div className="text-muted-foreground">{edu.school}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Zap className="h-4 w-4 text-indigo-600" />
                </div>
                <h5 className="font-semibold text-sm">Skills Extracted</h5>
              </div>
              
              {extractedData.skills && (
                <div className="flex flex-wrap gap-2">
                  {extractedData.skills.slice(0, 15).map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {extractedData.skills.length > 15 && (
                    <Badge variant="secondary" className="text-xs">
                      +{extractedData.skills.length - 15} more skills
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              <Brain className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI is Processing Your Resume</h3>
            <p className="text-muted-foreground">
              Our advanced AI is extracting and enriching your professional information
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-4">
              {processingSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300
                    ${step.status === 'completed' ? 'bg-green-100 border-green-500 text-green-600' :
                      step.status === 'processing' ? 'bg-blue-100 border-blue-500 text-blue-600 animate-pulse' :
                      step.status === 'error' ? 'bg-red-100 border-red-500 text-red-600' :
                      'bg-gray-100 border-gray-300 text-gray-400'}
                  `}>
                    {step.status === 'processing' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : step.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'processing' ? 'text-blue-600' :
                      step.status === 'error' ? 'text-red-600' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  </div>
                  
                  {step.status === 'processing' && (
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            Upload PDF
          </button>
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
                  Copy and paste your resume content below. Our AI will extract the key information and enhance it with logos and social data.
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
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Process Resume with AI
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Upload Area */}
      {inputMethod === 'file' && !extractedData && (
        <>
          <Card>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
                  ${isDragActive 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105" 
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                  }
                `}
              >
                <input {...getInputProps()} />
                
                <div className="space-y-4">
                  <div className="relative mx-auto w-16 h-16">
                    <div className={`
                      absolute inset-0 rounded-full transition-all duration-300
                      ${isDragActive ? 'bg-blue-100 dark:bg-blue-900/20 scale-110' : 'bg-gray-100 dark:bg-gray-800'}
                    `}>
                      <Upload className={`
                        absolute inset-0 m-auto h-6 w-6 transition-all duration-300
                        ${isDragActive ? 'text-blue-600 scale-110' : 'text-gray-600'}
                      `} />
                    </div>
                    {isDragActive && (
                      <div className="absolute -inset-2 rounded-full border-2 border-blue-400 animate-ping"></div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {isDragActive ? "Drop your resume here!" : "Upload your PDF resume"}
                    </h3>
                <p className="text-muted-foreground mb-4">
                  Our AI will directly read your PDF and extract all information with company logos, social data, and more
                </p>
                    
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Brain className="h-4 w-4" />
                        <span>AI-Powered</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4" />
                        <span>Auto-Enhanced</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        <span>Lightning Fast</span>
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className="text-xs">
                    PDF only • Max 10MB • Secure Processing
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Notice */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">✨ Enhanced PDF Processing</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Our AI can now directly read PDF files with advanced document understanding. 
                  Upload your PDF for instant extraction with company logos and social data enrichment!
                </p>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Brain className="h-5 w-5 text-blue-600" />
                </div>
              <div>
                <h4 className="font-medium text-sm">Direct PDF Reading</h4>
                <p className="text-xs text-muted-foreground">Advanced AI document understanding</p>
              </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Building className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Logo Enrichment</h4>
                  <p className="text-xs text-muted-foreground">Fetches company & school logos</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Social Integration</h4>
                  <p className="text-xs text-muted-foreground">Enriches LinkedIn & GitHub data</p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
