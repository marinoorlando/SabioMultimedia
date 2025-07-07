export type SummarizeConfig = {
  length: "short" | "medium" | "long";
  focus: "informative" | "critical" | "narrative" | "technical";
  format: "list" | "paragraph" | "mixed";
};

export type ProcessedItemBase = {
  id: string;
  createdAt: Date;
  type: "text" | "image";
  title: string;
  tags: string[];
};

export type ProcessedText = ProcessedItemBase & {
  type: "text";
  originalContent: string;
  summary: string;
  config: SummarizeConfig;
};

export type ProcessedImage = ProcessedItemBase & {
  type: "image";
  imageUrl: string;
  description: string;
};

export type ProcessedItem = ProcessedText | ProcessedImage;
