"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Edit, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const editPortfolioSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  is_published: z.boolean(),
});

type EditPortfolioFormData = z.infer<typeof editPortfolioSchema>;

interface Portfolio {
  id: string;
  title: string;
  description: string;
  slug: string;
  is_published: boolean;
  updated_at: string;
  created_at: string;
}

interface EditPortfolioDialogProps {
  portfolio: Portfolio;
  onUpdate: (updatedPortfolio: Portfolio) => void;
  trigger?: React.ReactNode;
}

export function EditPortfolioDialog({ portfolio, onUpdate, trigger }: EditPortfolioDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditPortfolioFormData>({
    resolver: zodResolver(editPortfolioSchema),
    defaultValues: {
      title: portfolio.title,
      description: portfolio.description || "",
      is_published: portfolio.is_published,
    },
  });

  const onSubmit = async (data: EditPortfolioFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/update-portfolio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioId: portfolio.id,
          ...data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update portfolio');
      }

      const result = await response.json();
      
      // Update the portfolio in the parent component
      onUpdate({
        ...portfolio,
        title: data.title,
        description: data.description || "",
        is_published: data.is_published,
        updated_at: new Date().toISOString(),
      });

      toast.success("Portfolio updated successfully");
      setOpen(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update portfolio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isSubmitting) return; // Prevent closing while submitting
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      form.reset({
        title: portfolio.title,
        description: portfolio.description || "",
        is_published: portfolio.is_published,
      });
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      
      if (event.key === 'Escape' && !isSubmitting) {
        setOpen(false);
      }
      
      if ((event.key === 'Enter' && (event.metaKey || event.ctrlKey)) && !isSubmitting) {
        event.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isSubmitting, form, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Portfolio</DialogTitle>
          <DialogDescription>
            Update your portfolio details. Use Cmd+Enter (Mac) or Ctrl+Enter (Windows) to save quickly.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter portfolio title"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter portfolio description"
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of your portfolio (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Published</FormLabel>
                    <FormDescription>
                      Make this portfolio publicly visible
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Updating..." : "Update Portfolio"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
