export type CatalogItem = {
  id: string;
  sourceKey: string;
  title: string;
  subtitle?: string;
  status: "pending" | "done";
  canComplete: boolean;
};

export type AssistantAction = {
  type: string;
  title: string;
  itemId?: string;
  ok: boolean;
  message?: string;
};

export type NeedsConfirm = {
  itemId: string;
  title: string;
  reason: string;
};

export type AssistantCommandResult = {
  reply: string;
  actions: AssistantAction[];
  needsConfirm?: NeedsConfirm;
};
