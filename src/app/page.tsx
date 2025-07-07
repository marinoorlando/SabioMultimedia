"use client";

import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import { History } from "lucide-react";

import type { ProcessedItem, SummarizeConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { summarizeText } from "@/ai/flows/summarize-text";
import { describeImage } from "@/ai/flows/describe-image";

import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { HistorySidebar } from "@/components/history-sidebar";
import { ContentInput } from "@/components/content-input";
import { ResultsView } from "@/components/results-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to generate a placeholder title
const generateTitle = (content: string) => {
  return content.split(' ').slice(0, 5).join(' ') + '...';
}

export default function Home() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<ProcessedItem[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedItem = React.useMemo(() => {
    return items.find((item) => item.id === selectedId) ?? null;
  }, [items, selectedId]);

  const handleProcessNewItem = async (
    type: "text" | "image",
    content: string,
    config?: SummarizeConfig,
    filename?: string
  ) => {
    setIsLoading(true);
    setSelectedId(null); // Deselect any previous item

    try {
      const id = uuidv4();
      let newItem: ProcessedItem;

      if (type === "text") {
        const result = await summarizeText({
          text: content,
          length: config?.length ?? "medium",
          focus: config?.focus ?? "informative",
          format: config?.format ?? "paragraph",
        });
        newItem = {
          id,
          type: "text",
          title: filename || generateTitle(content),
          createdAt: new Date(),
          tags: ["texto", "resumen"],
          originalContent: content,
          summary: result.summary,
          config: config ?? { length: 'medium', focus: 'informative', format: 'paragraph' },
          originalFilename: filename,
        };
      } else {
        const result = await describeImage({ photoDataUri: content });
        newItem = {
          id,
          type: "image",
          title: filename || "Nuevo Análisis de Imagen",
          createdAt: new Date(),
          tags: ["imagen", "visión"],
          imageUrl: content,
          description: result.description,
          originalFilename: filename,
        };
      }

      setItems((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
      toast({
        title: "¡Éxito!",
        description: `${type === 'text' ? 'Resumen' : 'Descripción'} generado correctamente.`,
      });
    } catch (error) {
      console.error("Error processing item:", error);
      toast({
        variant: "destructive",
        title: "¡Uy! Algo salió mal.",
        description: "Hubo un problema con la solicitud de IA.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateItem = (updatedItem: ProcessedItem) => {
    setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleSelectItem = (id: string | null) => {
    setSelectedId(id);
  };
  
  if (!isMounted) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
       </div>
    );
  }

  return (
    <SidebarProvider>
      <HistorySidebar
        items={items}
        selectedId={selectedId}
        onSelectItem={handleSelectItem}
      />
      <SidebarInset>
        <div className={cn("min-h-screen", selectedItem ? "bg-muted/20" : "bg-background")}>
          <main className="mx-auto max-w-5xl p-4 md:p-8">
            {isLoading ? (
              <LoadingState />
            ) : selectedItem ? (
              <ResultsView item={selectedItem} onUpdate={handleUpdateItem} />
            ) : (
              <ContentInput onProcess={handleProcessNewItem} isLoading={isLoading}/>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function LoadingState() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <Skeleton className="h-8 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}
