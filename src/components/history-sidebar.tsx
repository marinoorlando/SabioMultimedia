"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { History, Image as ImageIcon, FileText, PlusCircle, Search } from "lucide-react";

import type { ProcessedItem } from "@/lib/types";
import { cn } from "@/lib/utils";
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
        <Button variant="outline" onClick={() => onSelectItem(null)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Análisis
        </Button>
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
