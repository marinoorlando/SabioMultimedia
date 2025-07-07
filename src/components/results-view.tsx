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
    toast({ title: "¡Copiado!", description: `${type} copiado al portapapeles.` });
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
    md += `**Etiquetas:** ${item.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
    if(item.type === 'text') {
      md += `## Resumen\n\n${item.summary}\n\n---\n\n`;
      md += `## Texto Original\n\n> ${item.originalContent.replace(/\n/g, '\n> ')}`;
    } else {
      md += `## Descripción\n\n${item.description}\n\n`;
      md += `![Imagen](${item.imageUrl})\n`;
    }
    return md;
  }
  
  const getDownloadFilename = (extension: 'txt' | 'md') => {
    const baseFilename = item.originalFilename 
      ? item.originalFilename.substring(0, item.originalFilename.lastIndexOf('.')) || item.originalFilename
      : item.id;
    
    const suffix = item.type === 'text' ? 'resumen' : 'descripcion';

    return `${baseFilename}-${suffix}.${extension}`;
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-3xl text-primary">{item.title}</CardTitle>
              <CardDescription>
                Analizado el {new Date(item.createdAt).toLocaleString('es-ES')}
              </CardDescription>
            </div>
            <ExportMenu
              onCopy={() => copyToClipboard(item.type === 'text' ? item.summary : item.description, 'Resultado')}
              onDownloadTxt={() => downloadFile(getDownloadFilename('txt'), item.type === 'text' ? item.summary : item.description)}
              onDownloadMd={() => downloadFile(getDownloadFilename('md'), createMarkdown())}
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
        <h3 className="font-headline text-xl font-semibold mb-2">Texto Original</h3>
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
            <h3 className="font-headline text-xl font-semibold">Resumen de IA</h3>
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
        <h3 className="font-headline text-xl font-semibold mb-2">Imagen Original</h3>
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
            <h3 className="font-headline text-xl font-semibold">Descripción de IA</h3>
            <div className="flex items-center gap-1">
              <RefineDialog item={item} onUpdate={onUpdate} />
              <GeneratePromptDialog item={item} />
            </div>
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
                    <Download className="mr-2 h-4 w-4" /> Exportar
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onCopy}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar Resultado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownloadTxt}>
                    <Download className="mr-2 h-4 w-4" /> Descargar .txt
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={onDownloadMd}>
                    <Download className="mr-2 h-4 w-4" /> Descargar .md
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
        userFeedback: "El usuario quiere mejorar esto.",
        refinementInstructions: instructions,
      });

      const updatedItem = { ...item };
      if (updatedItem.type === 'text') {
        updatedItem.summary = result.refinedSummary;
      } else {
        updatedItem.description = result.refinedSummary;
      }
      onUpdate(updatedItem);
      toast({ title: "¡Refinado con éxito!" });
      setIsOpen(false);
    } catch (error) {
      console.error("Refinement failed:", error);
      toast({ variant: "destructive", title: "Falló el refinamiento", description: "Por favor, inténtalo de nuevo." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="mr-2 h-4 w-4" /> Refinar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2"><Wand2/>Refinar Generación de IA</DialogTitle>
          <DialogDescription>
            Proporciona instrucciones sobre cómo mejorar el resumen o la descripción.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="instructions">Instrucciones de Refinamiento</Label>
            <Textarea 
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej: 'Hazlo más formal', 'Céntrate en los aspectos financieros', 'Añade más detalles sobre el personaje principal'."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleRefine} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Refinar y Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


function GeneratePromptDialog({ item }: { item: ProcessedImage }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedPrompt, setGeneratedPrompt] = React.useState("");

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedPrompt("");
    try {
      const { generateImagePrompt } = await import("@/ai/flows/generate-image-prompt");
      const result = await generateImagePrompt({
        description: item.description,
      });
      setGeneratedPrompt(result.imagePrompt);
      toast({ title: "Image prompt generated successfully!" });
    } catch (error) {
      console.error("Image prompt generation failed:", error);
      toast({ variant: "destructive", title: "Prompt generation failed", description: "Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Prompt copied to clipboard." });
  };
  
  React.useEffect(() => {
    if (!isOpen) {
      setGeneratedPrompt("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Wand2 className="mr-2 h-4 w-4" /> Prompt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2"><Wand2/>Generate Image Prompt</DialogTitle>
          <DialogDescription>
            Use the AI description to generate a detailed prompt for an image generator. The result will be in English.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 min-h-[200px]">
            {isLoading ? (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : generatedPrompt ? (
              <div className="space-y-2">
                <Label htmlFor="generated-prompt">Generated Prompt</Label>
                <div className="relative">
                    <Textarea 
                      id="generated-prompt"
                      readOnly
                      value={generatedPrompt}
                      className="min-h-[120px] pr-10 bg-muted/50"
                    />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => copyToClipboard(generatedPrompt)}
                    >
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy Prompt</span>
                    </Button>
                </div>
              </div>
            ) : (
                 <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">
                    <span className="font-semibold text-foreground">Original Description:</span><br />
                    {item.description}
                </div>
            )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {generatedPrompt ? "Regenerate" : "Generate Prompt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
