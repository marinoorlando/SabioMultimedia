"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, FileText, Wand2, Loader2 } from "lucide-react";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

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
  text: z.string().min(10, { message: "Por favor, introduce al menos 10 caracteres." }),
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
  
  React.useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }, []);

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
    const fileName = file.name.toLowerCase();
    const fileType = file.type;

    if (fileType.startsWith("image/")) {
      reader.onload = (e) => onProcess("image", e.target?.result as string);
      reader.readAsDataURL(file);
    } else if (fileType === "text/plain") {
      reader.onload = (e) => onProcess("text", e.target?.result as string);
      reader.readAsText(file);
    } else if (fileName.endsWith(".docx")) {
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result;
          if (!(arrayBuffer instanceof ArrayBuffer)) {
            throw new Error("Failed to read file as ArrayBuffer.");
          }
          const result = await mammoth.extractRawText({ arrayBuffer });
          onProcess("text", result.value);
        } catch (error) {
          console.error("Error processing .docx file:", error);
          toast({
            variant: "destructive",
            title: "Error al procesar el archivo",
            description: "No se pudo extraer el texto del archivo .docx.",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === "application/pdf") {
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result;
          if (!(arrayBuffer instanceof ArrayBuffer)) {
            throw new Error("Failed to read file as ArrayBuffer.");
          }
          const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map(item => ('str' in item ? item.str : ''))
              .join(" ");
            fullText += pageText + "\n";
          }
          onProcess("text", fullText.trim());
        } catch (error) {
          console.error("Error processing .pdf file:", error);
          toast({
            variant: "destructive",
            title: "Error al procesar el archivo",
            description: "No se pudo extraer el texto del archivo PDF.",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileName.endsWith(".doc")) {
      toast({
        variant: "destructive",
        title: "Tipo de archivo no compatible",
        description: "Los archivos .doc no son compatibles. Por favor, conviértelo a .docx.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Tipo de archivo no compatible",
        description: `No se puede procesar '${file.name}'. Por favor, sube archivos TXT, JPG, PNG, PDF o DOCX.`,
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
          Iniciar un Nuevo Análisis
        </CardTitle>
        <CardDescription>
          Proporciona contenido a continuación para generar resúmenes o descripciones usando IA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">
              <FileText className="mr-2 h-4 w-4" />
              Entrada de Texto
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Subir Archivo
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
                      <FormLabel>Pega tu texto aquí</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Introduce un artículo largo, notas o cualquier texto que quieras procesar..."
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
                    <FormItem><FormLabel>Longitud</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona longitud" /></SelectTrigger></FormControl><SelectContent><SelectItem value="short">Corta</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="long">Larga</SelectItem></SelectContent></Select></FormItem>
                  )}/>
                  <FormField control={form.control} name="focus" render={({ field }) => (
                     <FormItem><FormLabel>Enfoque</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona enfoque" /></SelectTrigger></FormControl><SelectContent><SelectItem value="informative">Informativo</SelectItem><SelectItem value="critical">Crítico</SelectItem><SelectItem value="narrative">Narrativo</SelectItem><SelectItem value="technical">Técnico</SelectItem></SelectContent></Select></FormItem>
                  )}/>
                   <FormField control={form.control} name="format" render={({ field }) => (
                     <FormItem><FormLabel>Formato</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona formato" /></SelectTrigger></FormControl><SelectContent><SelectItem value="list">Lista</SelectItem><SelectItem value="paragraph">Párrafo</SelectItem><SelectItem value="mixed">Mixto</SelectItem></SelectContent></Select></FormItem>
                  )}/>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generar Resumen
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
                            <span className="font-semibold text-primary">Haz clic para subir</span> o arrastra y suelta
                        </p>
                        <p className="text-xs text-muted-foreground">Archivos TXT, PNG, JPG, PDF, DOCX</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" accept=".txt,.png,.jpg,.jpeg,.pdf,.docx,.doc" onChange={(e) => handleFileChange(e.target.files)} />
                </label>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
