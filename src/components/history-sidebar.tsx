"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { History, Image as ImageIcon, FileText, PlusCircle, Search, Settings, Download, Upload, Trash2 } from "lucide-react";

import type { ProcessedItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";


interface HistorySidebarProps {
  items: ProcessedItem[];
  selectedId: string | null;
  onSelectItem: (id: string | null) => void;
}

export function HistorySidebar({
  items,
  selectedId,
  onSelectItem,
}: HistorySidebarProps) {
  const { state } = useSidebar();
  const [filter, setFilter] = React.useState("");

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(filter.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="size-8 text-primary" />
          <h1
            className={cn(
              "font-headline text-2xl font-bold text-primary",
              "group-data-[collapsible=icon]:hidden"
            )}
          >
            Sabio MultiMedia
          </h1>
        </div>
      </SidebarHeader>

      <div
        className={cn(
          "flex flex-col p-2 gap-2",
          "group-data-[collapsible=icon]:hidden"
        )}
      >
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar historial..."
            className="pl-8 h-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onSelectItem(null)} className="flex-1">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Análisis
            </Button>
            <SettingsDialog />
        </div>
      </div>

      <SidebarContent>
        <SidebarMenu>
          {filteredItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onSelectItem(item.id)}
                isActive={selectedId === item.id}
                tooltip={{ children: item.title, side: "right" }}
                className="h-auto flex-col items-start p-2"
              >
                <div className="flex w-full items-center gap-2">
                  {item.type === "image" ? (
                    <ImageIcon className="h-4 w-4 text-accent" />
                  ) : (
                    <FileText className="h-4 w-4 text-accent" />
                  )}
                  <span className="flex-1 truncate font-medium">
                    {item.title}
                  </span>
                </div>
                <div className="w-full pl-6">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: es })}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {items.length === 0 && (
            <div
              className={cn(
                "p-4 text-center text-sm text-muted-foreground",
                "group-data-[collapsible=icon]:hidden"
              )}
            >
              <History className="mx-auto h-8 w-8 mb-2" />
              Tu historial aparecerá aquí.
            </div>
          )}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}


function SettingsDialog() {
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const allItems = await db.items.toArray();
      const jsonString = JSON.stringify(allItems, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "multimedia-sage-historial.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "¡Exportado!", description: "Tu historial ha sido exportado a un archivo .json." });
    } catch (error) {
      console.error("Error exporting history:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo exportar el historial." });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                throw new Error("No se pudo leer el archivo.");
            }
            const importedItems = JSON.parse(text);

            if (!Array.isArray(importedItems) || (importedItems.length > 0 && (!importedItems[0].id || !importedItems[0].createdAt))) {
                 throw new Error("Formato de JSON inválido.");
            }
            
            const itemsToImport: ProcessedItem[] = importedItems.map((item: any) => ({
                ...item,
                createdAt: new Date(item.createdAt),
            }));

            await db.items.bulkPut(itemsToImport);
            toast({
                title: "¡Importación exitosa!",
                description: "Tu historial ha sido importado y fusionado correctamente.",
            });
        } catch (error) {
            console.error("Error al importar el historial:", error);
            toast({
                variant: "destructive",
                title: "Error de importación",
                description: "El archivo seleccionado no es válido o está corrupto.",
            });
        } finally {
            if(event.target) event.target.value = "";
        }
    };
    reader.readAsText(file);
  };

  const handleDeleteAll = async () => {
    try {
      await db.items.clear();
      toast({ title: "¡Historial eliminado!", description: "Se ha borrado todo tu historial de análisis." });
    } catch (error) {
       console.error("Error deleting history:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el historial." });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Ajustes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustes del Historial</DialogTitle>
          <DialogDescription>
            Gestiona tus datos de análisis. Puedes exportar tu historial para tener una copia de seguridad o importarlo a otro dispositivo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Exportar Historial
          </Button>
          <Button onClick={handleImportClick} variant="outline">
            <Upload className="mr-2 h-4 w-4" /> Importar Historial
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileSelected} className="hidden" accept=".json" />
          <Separator className="my-2" />
          <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Todo el Historial
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente todo tu historial.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll}>
                  Sí, eliminar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
