"use client"

import * as React from "react";
import Image from "next/image";
import { Copy, Download, Edit, Loader2, Save, Wand2 } from "lucide-react";

import type { ProcessedItem, ProcessedText, ProcessedImage } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { refineSummary } from "@/ai/flows/refine-summary";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


interface ResultsViewProps {
  item: ProcessedItem;
  onUpdate: (item: ProcessedItem) => void;
}

export function ResultsView({ item, onUpdate }: ResultsViewProps) {
  const { toast } = useToast();
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${type} copied to clipboard.` });
  };

  const downloadFile = (filename: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const createMarkdown = () => {
    let md = `# ${item.title}\n\n`;
    md += `**Tags:** ${item.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
    if(item.type === 'text') {
      md += `## Summary\n\n${item.summary}\n\n---\n\n`;
      md += `## Original Text\n\n> ${item.originalContent.replace(/\n/g, '\n> ')}`;
    } else {
      md += `## Description\n\n${item.description}\n\n`;
      md += `![Image](${item.imageUrl})\n`;
    }
    return md;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-3xl text-primary">{item.title}</CardTitle>
              <CardDescription>
                Analyzed on {new Date(item.createdAt).toLocaleString()}
              </CardDescription>
            </div>
            <ExportMenu
              onCopy={() => copyToClipboard(item.type === 'text' ? item.summary : item.description, 'Result')}
              onDownloadTxt={() => downloadFile(`${item.id}.txt`, item.type === 'text' ? item.summary : item.description)}
              onDownloadMd={() => downloadFile(`${item.id}.md`, createMarkdown())}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Separator />
          {item.type === "text" ? (
            <TextView item={item} onUpdate={onUpdate} />
          ) : (
            <ImageView item={item} onUpdate={onUpdate} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TextView({ item, onUpdate }: { item: ProcessedText, onUpdate: (item: ProcessedItem) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-headline text-xl font-semibold mb-2">Original Text</h3>
        <Card className="bg-muted/30 max-h-96 overflow-y-auto">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {item.originalContent}
            </p>
          </CardContent>
        </Card>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-headline text-xl font-semibold">AI Summary</h3>
            <RefineDialog item={item} onUpdate={onUpdate} />
        </div>
        <Card className="bg-background">
            <CardContent className="p-4">
                <p className="whitespace-pre-wrap">{item.summary}</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ImageView({ item, onUpdate }: { item: ProcessedImage, onUpdate: (item: ProcessedItem) => void }) {
  return (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-headline text-xl font-semibold mb-2">Original Image</h3>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
          <Image
            src={item.imageUrl}
            alt="User uploaded image"
            layout="fill"
            objectFit="contain"
            data-ai-hint="abstract painting"
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-headline text-xl font-semibold">AI Description</h3>
            <RefineDialog item={item} onUpdate={onUpdate} />
        </div>
        <Card className="bg-background">
            <CardContent className="p-4">
                 <p className="whitespace-pre-wrap">{item.description}</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExportMenu({ onCopy, onDownloadTxt, onDownloadMd }: { onCopy: () => void, onDownloadTxt: () => void, onDownloadMd: () => void}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onCopy}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Result
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownloadTxt}>
                    <Download className="mr-2 h-4 w-4" /> Download .txt
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={onDownloadMd}>
                    <Download className="mr-2 h-4 w-4" /> Download .md
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function RefineDialog({ item, onUpdate }: { item: ProcessedItem, onUpdate: (item: ProcessedItem) => void }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [instructions, setInstructions] = React.useState("");

  const handleRefine = async () => {
    setIsLoading(true);
    try {
      const originalText = item.type === 'text' ? item.originalContent : item.description;
      const initialSummary = item.type === 'text' ? item.summary : item.description;

      const result = await refineSummary({
        originalText,
        initialSummary,
        userFeedback: "User wants to improve this.",
        refinementInstructions: instructions,
      });

      const updatedItem = { ...item };
      if (updatedItem.type === 'text') {
        updatedItem.summary = result.refinedSummary;
      } else {
        updatedItem.description = result.refinedSummary;
      }
      onUpdate(updatedItem);
      toast({ title: "Successfully refined!" });
      setIsOpen(false);
    } catch (error) {
      console.error("Refinement failed:", error);
      toast({ variant: "destructive", title: "Refinement failed", description: "Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="mr-2 h-4 w-4" /> Refine
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2"><Wand2/>Refine AI Generation</DialogTitle>
          <DialogDescription>
            Provide instructions on how to improve the summary or description.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="instructions">Refinement Instructions</Label>
            <Textarea 
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., 'Make it more formal', 'Focus on the financial aspects', 'Add more details about the main character'."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleRefine} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Refine and Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
