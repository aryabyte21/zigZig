"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Link as LinkIcon, 
  Camera, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Loader2
} from "lucide-react";

import { EnhancedResumeUpload } from "@/components/onboarding/enhanced-resume-upload";
import { LinksStep } from "@/components/onboarding/links-step";
import { PhotoStep } from "@/components/onboarding/photo-step";

interface OnboardingWizardProps {
  profile: any;
}

const steps = [
  {
    id: 1,
    title: "Upload Resume",
    description: "Upload your PDF resume and let AI extract & enhance your information (Please wait it takes a while)",
    icon: FileText,
    component: EnhancedResumeUpload,
  },
  {
    id: 2,
    title: "Add Links",
    description: "Connect your social media and professional links",
    icon: LinkIcon,
    component: LinksStep,
  },
  {
    id: 3,
    title: "Upload Photo",
    description: "Add your photo and generate an AI avatar",
    icon: Camera,
    component: PhotoStep,
  },
];

export function OnboardingWizard({ profile }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepData, setStepData] = useState({
    resume: null,
    links: {},
    photo: null,
    aiAvatar: null,
  });
  const router = useRouter();

  const currentStepData = steps.find(step => step.id === currentStep);
  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepId: number, data: any) => {
    console.log(`Step ${stepId} completed with data:`, data);
    setStepData(prev => {
      const newStepData = { ...prev, ...data };
      console.log('Updated stepData:', newStepData);
      console.log('Current stepData:', stepData);
      console.log('New stepData:', newStepData);
      console.log('Data:', data);
      return newStepData;
    });
    
    if (stepId < steps.length) {
      handleNext();
    }
  };

  const handleFinish = async () => {
    setIsGenerating(true);
    
    try {
      // Generate AI portfolio
      const response = await fetch("/api/generate-portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeData: stepData.resume,
          links: stepData.links,
          photo: stepData.photo,
          aiAvatar: stepData.aiAvatar,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate portfolio");

      const result = await response.json();
      
      toast.success("Portfolio generated successfully!");
      // Redirect to the public portfolio view
      router.push(result.portfolioUrl || `/portfolio/${result.slug}`);
    } catch (error) {
      console.error("Error generating portfolio:", error);
      toast.error("Failed to generate portfolio. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const CurrentStepComponent = currentStepData?.component;

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Step {currentStep} of {steps.length}
          </span>
          <Badge variant="secondary">
            {Math.round(progress)}% Complete
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center space-x-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors
                ${isActive 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : isCompleted 
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-muted-foreground/30 text-muted-foreground"
                }
              `}>
                <Icon className="h-5 w-5" />
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-16 h-0.5 mx-4 transition-colors
                  ${isCompleted ? "bg-green-500" : "bg-muted-foreground/30"}
                `} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStepData && <currentStepData.icon className="h-5 w-5" />}
            {currentStepData?.title}
          </CardTitle>
          <CardDescription>
            {currentStepData?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {CurrentStepComponent && (
            <CurrentStepComponent
              onComplete={(data: any) => handleStepComplete(currentStep, data)}
              initialData={stepData}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep === steps.length ? (
          <Button
            onClick={handleFinish}
            disabled={isGenerating}
            className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Portfolio...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate My Portfolio
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={currentStep === steps.length}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
