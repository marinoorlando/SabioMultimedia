"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, FileText, Wand2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SummarizeConfig } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  text: z.string().min(10, { message: "Please enter at least 10 characters." }),
  length: z.enum(["short", "medium", "long"]),
  focus: z.enum(["informative", "critical", "narrative", "technical"]),
  format: z.enum(["list", "paragraph", "mixed"]),
});

interface ContentInputProps {
  onProcess: (type: "text" | "image", content: string, config?: SummarizeConfig) => void;
  isLoading: boolean;
}

export function ContentInput({ onProcess, isLoading }: ContentInputProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      length: "medium",
      focus: "informative",
      format: "paragraph",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const config: SummarizeConfig = {
      length: values.length,
      focus: values.focus,
      format: values.format,
    };
    onProcess("text", values.text, config);
  }

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();

    if (file.type.startsWith("image/")) {
      reader.onload = (e) => onProcess("image", e.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file.type === "text/plain") {
      reader.onload = (e) => onProcess("text", e.target?.result as string);
      reader.readAsText(file);
    } else {
      toast({
        variant: "destructive",
        title: "Unsupported File Type",
        description: `Cannot process ${file.type}. Please upload TXT, JPG, or PNG files.`,
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center gap-2">
          <Wand2 />
          Start a New Analysis
        </CardTitle>
        <CardDescription>
          Provide content below to generate summaries or descriptions using AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">
              <FileText className="mr-2 h-4 w-4" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              File Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paste your text here</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a long article, notes, or any text you want to process..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="length" render={({ field }) => (
                    <FormItem><FormLabel>Length</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select length" /></SelectTrigger></FormControl><SelectContent><SelectItem value="short">Short</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="long">Long</SelectItem></SelectContent></Select></FormItem>
                  )}/>
                  <FormField control={form.control} name="focus" render={({ field }) => (
                     <FormItem><FormLabel>Focus</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select focus" /></SelectTrigger></FormControl><SelectContent><SelectItem value="informative">Informative</SelectItem><SelectItem value="critical">Critical</SelectItem><SelectItem value="narrative">Narrative</SelectItem><SelectItem value="technical">Technical</SelectItem></SelectContent></Select></FormItem>
                  )}/>
                   <FormField control={form.control} name="format" render={({ field }) => (
                     <FormItem><FormLabel>Format</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger></FormControl><SelectContent><SelectItem value="list">List</SelectItem><SelectItem value="paragraph">Paragraph</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent></Select></FormItem>
                  )}/>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate Summary
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="upload">
            <div className="pt-4">
                <label
                    htmlFor="dropzone-file"
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer",
                        "bg-muted/50 hover:bg-muted",
                        "border-border hover:border-primary/50",
                        dragActive && "border-primary bg-primary/10"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">TXT, PNG, JPG files</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" accept=".txt,.png,.jpg,.jpeg" onChange={(e) => handleFileChange(e.target.files)} />
                </label>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
