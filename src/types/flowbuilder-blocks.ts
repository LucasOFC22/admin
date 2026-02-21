/**
 * Specific data types for each FlowBuilder block type
 * 
 * Note: These types document the expected structure but allow additional properties
 * for backwards compatibility with existing data.
 */

// Menu section row
export interface MenuSectionRow {
  id?: string;
  title: string;
  description?: string;
  targetGroupId?: string;
}

// Menu section
export interface MenuSection {
  title?: string;
  rows?: MenuSectionRow[];
}

// Menu block data structure
export interface MenuData {
  title?: string;
  header?: string;
  body?: string;
  footer?: string;
  sections?: MenuSection[];
  options?: MenuSectionRow[];
}

// Button item
export interface ButtonItem {
  id?: string;
  title: string;
  value?: string;
  targetGroupId?: string;
}

// Buttons data structure
export interface ButtonsData {
  title?: string;
  body?: string;
  footer?: string;
  buttons?: ButtonItem[];
}

// Condition comparison
export interface ConditionComparison {
  variable: string;
  operator: string;
  value: string;
}

// Condition rule with comparisons
export interface ConditionRuleData {
  comparisons: ConditionComparison[];
  targetGroupId?: string;
}

// Conditions data structure
export interface ConditionsData {
  variable?: string;
  operator?: string;
  value?: string;
  comparisons?: ConditionComparison[];
  rules?: ConditionRuleData[];
}

// Randomizer path
export interface RandomizerPath {
  id: string;
  percentage: number;
  targetGroupId?: string;
}

// Location data structure
export interface LocationData {
  latitude?: number;
  longitude?: number;
  name?: string;
  address?: string;
}

// Variable item for tags/variables
export interface VariableItem {
  name: string;
  value?: string;
}

/**
 * FlowBlockData is a flexible record type that allows any properties.
 * This maintains backwards compatibility while providing type hints for known properties.
 * 
 * Common properties across block types:
 * - label?: string - Display label for the block
 * - message?: string - Message content (text blocks)
 * - menuData?: MenuData - Menu configuration
 * - buttonsData?: ButtonsData - Buttons configuration
 * - conditions?: ConditionsData - Condition rules
 * - question?: string - Question text
 * - variable?: string - Variable name to store results
 * - percent?: number - Randomizer percentage
 * - sec?: number - Interval in seconds
 * - queueIds?: string[] - Ticket queue IDs
 * - tags?: string[] - Tag list
 * - url?: string - URL for webhooks/documents
 * - code?: string - JavaScript code
 * - targetGroupId?: string - Jump target
 */
export type FlowBlockData = Record<string, any>;

// Type-safe accessors for common block data patterns
export interface TypedMenuBlockData {
  label?: string;
  menuData?: MenuData;
  title?: string;
  options?: MenuSectionRow[];
  invalidMessage?: string;
}

export interface TypedButtonsBlockData {
  label?: string;
  buttonsData?: ButtonsData;
  title?: string;
  buttons?: ButtonItem[];
}

export interface TypedConditionBlockData {
  label?: string;
  conditions?: ConditionsData;
  rules?: ConditionRuleData[];
  defaultTargetGroupId?: string;
}

export interface TypedTextBlockData {
  label?: string;
  content?: string;
  message?: string;
  delay?: number;
  typing?: boolean;
}

export interface TypedQuestionBlockData {
  label?: string;
  question?: string;
  variable?: string;
  variableName?: string;
  validationType?: 'text' | 'email' | 'phone' | 'number' | 'date' | 'cpf' | 'cnpj';
  invalidMessage?: string;
  required?: boolean;
  answerKey?: string;
}

export interface TypedTicketBlockData {
  label?: string;
  department?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  subject?: string;
  assignTo?: string;
  queueIds?: string[];
}

export interface TypedRandomizerBlockData {
  label?: string;
  percent?: number;
  paths?: RandomizerPath[];
}

export interface TypedIntervalBlockData {
  label?: string;
  delay?: number;
  sec?: number;
  unit?: 'seconds' | 'minutes' | 'hours';
}

export interface TypedLocationBlockData {
  label?: string;
  location?: LocationData;
  requestType?: 'current' | 'address';
  saveToVariable?: string;
}

export interface TypedTagsBlockData {
  label?: string;
  tags?: string[] | VariableItem[];
  action?: 'add' | 'remove' | 'set';
}

export interface TypedWebhookBlockData {
  label?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  saveResponseTo?: string;
}

export interface TypedJumpBlockData {
  label?: string;
  targetGroupId?: string;
}

export interface TypedDocumentBlockData {
  label?: string;
  url?: string;
  caption?: string;
  mimeType?: string;
}

export interface TypedJavaScriptBlockData {
  label?: string;
  code?: string;
  saveResultTo?: string;
}

// Map block types to their typed data interfaces
export interface BlockTypeToDataMap {
  text: TypedTextBlockData;
  menu: TypedMenuBlockData;
  question: TypedQuestionBlockData;
  condition: TypedConditionBlockData;
  ticket: TypedTicketBlockData;
  tags: TypedTagsBlockData;
  typebot: { label?: string; typebotId?: string; startGroupId?: string };
  openai: { label?: string; model?: string; systemPrompt?: string; userPrompt?: string; temperature?: number; maxTokens?: number; saveToVariable?: string };
  randomizer: TypedRandomizerBlockData;
  interval: TypedIntervalBlockData;
  location: TypedLocationBlockData;
  setVariable: { label?: string; variableName?: string; value?: string; valueType?: 'static' | 'expression' | 'random' };
  webhook: TypedWebhookBlockData;
  httpRequest: TypedWebhookBlockData & { queryParams?: Record<string, string>; timeout?: number };
  buttons: TypedButtonsBlockData;
  jump: TypedJumpBlockData;
  document: TypedDocumentBlockData;
  convertBase64: { label?: string; sourceVariable?: string; targetVariable?: string; action?: 'encode' | 'decode' };
  loop: { label?: string; iterateOver?: string; itemVariable?: string; indexVariable?: string; targetGroupId?: string };
  javascript: TypedJavaScriptBlockData;
}

// Helper type to get block data type from block type
export type GetBlockData<T extends keyof BlockTypeToDataMap> = BlockTypeToDataMap[T];
