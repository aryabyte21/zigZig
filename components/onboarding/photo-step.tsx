"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Upload, 
  Camera, 
  Loader2, 
  Sparkles, 
  CheckCircle,
  RefreshCw,
  Download,
  X
} from "lucide-react";

interface PhotoStepProps {
  onComplete: (data: any) => void;
  initialData: any;
}

export function PhotoStep({ onComplete, initialData }: PhotoStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [aiAvatar, setAiAvatar] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload photo to Supabase Storage
      const formData = new FormData();
      formData.append("photo", file);

      const uploadResponse = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || `Upload failed with status ${uploadResponse.status}`);
      }

      const { photoUrl } = await uploadResponse.json();
      setUploadedPhoto(photoUrl);
      setUploadProgress(100);
      clearInterval(progressInterval);

      // Auto-generate AI avatar after photo upload (mandatory)
      setTimeout(() => {
        handleGenerateAvatar(photoUrl);
      }, 500);

      // Don't show toast here - wizard handles step completion
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      console.error("Error message:", error.message);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleGenerateAvatar = async (photoUrl?: string) => {
    const targetPhotoUrl = photoUrl || uploadedPhoto;
    if (!targetPhotoUrl) return;

    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoUrl: targetPhotoUrl }),
      });

      if (!response.ok) throw new Error("Avatar generation failed");

      const { avatarUrl } = await response.json();
      setAiAvatar(avatarUrl);
      
      toast.success("AI avatar generated! You can continue now.");
    } catch (error) {
      console.error("Error generating avatar:", error);
      toast.error("Failed to generate avatar. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAiAvatar = async () => {
    setIsGenerating(true);
    
    try {
      // Generate avatar using user's name from initialData
      const userName = initialData?.resume?.personalInfo?.name || "Professional";
      
      const response = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: `# Steps

1. **Analyze the Image**: Examine the original image to understand its composition, color palette, and key elements.
2. **Study Studio Ghibli Style**: Familiarize yourself with the distinctive features of Studio Ghibli's art style, including:
   - Soft, vibrant color palettes
   - Detailed backgrounds with a focus on nature
   - Expressive character designs with large, emotive eyes
   - Use of light and shadow to create depth
3. **Sketch the Transformation**: Create a preliminary sketch that incorporates the Ghibli style elements into the original image.
4. **Apply Color and Texture**: Use soft, vibrant colors typical of Studio Ghibli films. Pay attention to textures that mimic traditional animation techniques.
5. **Refine Details**: Add intricate details to the background and characters, ensuring they align with the Ghibli aesthetic.
6. **Final Adjustments**: Make any necessary adjustments to lighting, contrast, and saturation to achieve a cohesive look.

# Output Format

Provide a digital image file that reflects the transformation of the original image into the Studio Ghibli style. The file should be in a common format such as JPEG or PNG.

# Notes

- Pay special attention to the emotional tone of the image, ensuring it aligns with the whimsical and heartfelt nature of Studio Ghibli films.
- Consider the use of traditional animation techniques, such as hand-drawn lines and watercolor effects, to enhance authenticity.
- Ensure that the transformed image maintains the essence of the original while fully embracing the Ghibli style.`,
          style: "ghibli"
        }),
      });

      if (!response.ok) throw new Error("Avatar generation failed");

      const { avatarUrl } = await response.json();
      setAiAvatar(avatarUrl);
      
      // Don't show toast here - avatar generation is optional and UI shows success state
    } catch (error) {
      console.error("Error generating avatar:", error);
      toast.error("Failed to generate avatar. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    // Only use AI avatar (required)
    if (!aiAvatar) {
      toast.error("Please wait for AI avatar generation to complete");
      return;
    }
    
    onComplete({ 
      photo: uploadedPhoto,
      aiAvatar: aiAvatar,
      selectedAvatar: aiAvatar // Only AI avatar
    });
  };

  const handleRemovePhoto = () => {
    setUploadedPhoto(null);
    setAiAvatar(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Upload your photo and we'll automatically create a beautiful Studio Ghibli-style AI avatar for your portfolio.
        </p>
        <Badge variant="secondary" className="mt-2">
          AI Avatar Generation Required
        </Badge>
      </div>

      {/* Upload Area */}
      {!uploadedPhoto && (
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
              <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? "Drop your photo here" : "Upload your photo"}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your photo, or click to browse
              </p>
              <Badge variant="secondary">JPG, PNG, WEBP • Max 5MB</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Uploading photo...</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Preview & Avatar Generation */}
      {uploadedPhoto && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Original Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Your Photo
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <Avatar className="h-48 w-48">
                  <AvatarImage 
                    src={uploadedPhoto} 
                    alt="Your photo" 
                    className="object-cover object-center" 
                  />
                  <AvatarFallback>
                    <Camera className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating AI avatar...
                  </div>
                ) : (
                  "Original photo uploaded"
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Avatar
                </span>
              </CardTitle>
              <CardDescription>
                Studio Ghibli style professional avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                {aiAvatar ? (
                  <Avatar className="h-48 w-48">
                    <AvatarImage 
                      src={aiAvatar} 
                      alt="AI Avatar" 
                      className="object-cover object-center" 
                    />
                    <AvatarFallback>
                      <Sparkles className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-48 w-48 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {aiAvatar ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-600 justify-center">
                    <CheckCircle className="h-4 w-4" />
                    AI avatar ready!
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleGenerateAvatar()}
                      disabled={isGenerating}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Regenerate
                    </Button>
                    <Button
                      onClick={() => window.open(aiAvatar, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Download className="mr-2 h-3 w-3" />
                      Preview
                    </Button>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating your AI avatar...
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This may take 10-30 seconds
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  AI avatar will be generated automatically
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Avatar Info */}
      {uploadedPhoto && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                  AI Avatar Generation (Required)
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  We automatically transform your photo into a beautiful Studio Ghibli-style 
                  professional avatar using advanced AI. This creates a unique, artistic representation 
                  that will be used for your portfolio.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Studio Ghibli Style</Badge>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Professional Look</Badge>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Warm Tones</Badge>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Auto-Generated</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      {uploadedPhoto && (
        <div className="flex flex-col items-center gap-3 pt-4">
          {!aiAvatar && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Please wait for AI avatar generation to complete before continuing
              </p>
            </div>
          )}
          <Button
            onClick={handleContinue}
            disabled={!aiAvatar || isGenerating}
            className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Avatar...
              </>
            ) : aiAvatar ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Continue to Portfolio Generation
              </>
            ) : (
              "Waiting for AI Avatar..."
            )}
          </Button>
        </div>
      )}

    </div>
  );
}
