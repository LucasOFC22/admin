import React from 'react';
import { Handle, Position } from 'reactflow';
import { 
  MessageSquare, 
  Ticket, 
  Bot, 
  Shuffle, 
  GitBranch, 
  HelpCircle, 
  Sparkles, 
  List, 
  Clock,
  MapPin,
  Tag,
  Trash2,
  AlertCircle,
  GripVertical,
  Globe,
  ChevronUp,
  ChevronDown,
  Plus,
  FileText,
  ToggleLeft,
  SkipForward,
  FileOutput,
  Repeat,
  Code2
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { FormattedWhatsAppText } from '@/utils/whatsappFormatting';
import { FlowBlock } from '@/types/flowbuilder';
import { Button } from '@/components/ui/button';

const blockConfig: Record<string, { icon: any; label: string; color: string; bgColor: string; borderColor: string }> = {
  text: { icon: MessageSquare, label: 'Texto', color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
  menu: { icon: List, label: 'Menu de Opções', color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' },
  buttons: { icon: ToggleLeft, label: 'Botões', color: 'text-teal-600', bgColor: 'bg-teal-100', borderColor: 'border-teal-300' },
  question: { icon: HelpCircle, label: 'Pergunta', color: 'text-cyan-600', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-300' },
  condition: { icon: GitBranch, label: 'Condição', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
  ticket: { icon: Ticket, label: 'Fila', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' },
  tags: { icon: Tag, label: 'Tags', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' },
  typebot: { icon: Bot, label: 'Typebot', color: 'text-indigo-600', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-300' },
  openai: { icon: Sparkles, label: 'OpenAI', color: 'text-violet-600', bgColor: 'bg-violet-100', borderColor: 'border-violet-300' },
  randomizer: { icon: Shuffle, label: 'Randomizador', color: 'text-pink-600', bgColor: 'bg-pink-100', borderColor: 'border-pink-300' },
  interval: { icon: Clock, label: 'Intervalo', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-300' },
  location: { icon: MapPin, label: 'Localização', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
  httpRequest: { icon: Globe, label: 'HTTP Request', color: 'text-rose-600', bgColor: 'bg-rose-100', borderColor: 'border-rose-300' },
  jump: { icon: SkipForward, label: 'Pular para Grupo', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
  document: { icon: FileText, label: 'Documento', color: 'text-sky-600', bgColor: 'bg-sky-100', borderColor: 'border-sky-300' },
  convertBase64: { icon: FileOutput, label: 'Converter Base64', color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' },
  loop: { icon: Repeat, label: 'Loop', color: 'text-indigo-600', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-300' },
  javascript: { icon: Code2, label: 'JavaScript', color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
};

// Get menu options from block data
const getMenuOptions = (block: FlowBlock): { id: string; title: string }[] => {
  if (block.type !== 'menu') return [];
  
  const sections = block.data?.menuData?.sections || [];
  const options: { id: string; title: string }[] = [];
  
  sections.forEach((section: any) => {
    section.rows?.forEach((row: any) => {
      options.push({ id: row.id || `option-${options.length}`, title: row.title || 'Opção' });
    });
  });
  
  return options;
};

// Get button options from block data
const getButtonOptions = (block: FlowBlock): { id: string; title: string }[] => {
  if (block.type !== 'buttons') return [];
  
  const buttons = block.data?.buttonsData?.buttons || [];
  return buttons.map((btn: any) => ({
    id: btn.id || `btn-${buttons.indexOf(btn)}`,
    title: btn.title || 'Botão'
  }));
};

interface FlowBlockItemProps {
  block: FlowBlock;
  onClick: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  groupId: string;
  showOutputHandles?: boolean;
  onAddConditionRule?: () => void;
  onEditConditionRule?: (ruleIndex: number) => void;
}

const FlowBlockItemComponent: React.FC<FlowBlockItemProps> = ({ 
  block, 
  onClick, 
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  groupId,
  showOutputHandles = true,
  onAddConditionRule,
  onEditConditionRule
}) => {
  const config = blockConfig[block.type] || { icon: MessageSquare, label: block.type, color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' };
  const Icon = config.icon;
  const outputOptions = getMenuOptions(block);
  const isMenu = block.type === 'menu';
  const menuBody = block.data?.menuData?.body || '';

  // Render expanded menu block with connection handles
  const menuTitle = block.data?.menuData?.header || '';
  const menuFooter = block.data?.menuData?.footer || '';
  
  if (isMenu && showOutputHandles) {
    return (
      <div
        className={cn(
          "group relative flex gap-2 p-3 rounded-lg items-start w-full",
          "bg-white border border-gray-200",
          "transition-all duration-150"
        )}
      >
        {/* Menu Icon */}
        <List className="size-4 shrink-0 text-purple-500 stroke-2 mt-1" />
        
        <div className="flex flex-col gap-2 flex-1">
          {/* Title */}
          {menuTitle && (
            <div 
              className="flex p-2 rounded-md border border-purple-200 bg-purple-50 w-full cursor-pointer hover:border-purple-300 transition-colors"
              onClick={onClick}
            >
              <p className="text-xs font-medium text-purple-700">{menuTitle}</p>
            </div>
          )}
          
          {/* Body/Description */}
          {menuBody && (
            <div 
              className="flex p-2 rounded-md border border-gray-200 bg-gray-50 w-full cursor-pointer hover:border-gray-300 transition-colors"
              onClick={onClick}
            >
              <p className="text-xs text-gray-600 line-clamp-2 whitespace-pre-wrap">{menuBody}</p>
            </div>
          )}

          {/* Options with handles */}
          <div className="flex flex-col gap-1.5">
            {outputOptions.length > 0 ? (
              outputOptions.map((option) => (
                <div key={option.id} className="relative flex items-center">
                  <div 
                    className="flex p-3 rounded-md border w-full bg-white cursor-pointer hover:border-gray-300 transition-colors"
                    onClick={onClick}
                  >
                    <p className="text-xs text-gray-700">{option.title}</p>
                  </div>
                  {/* Connection Handle */}
                  <div className="absolute right-[-49px] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={`${block.id}-${option.id}`}
                      className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
                    >
                      <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-purple-400 pointer-events-none" />
                    </Handle>
                  </div>
                </div>
              ))
            ) : (
              <div 
                className="flex p-3 rounded-md border w-full bg-white cursor-pointer hover:border-gray-300 transition-colors"
                onClick={onClick}
              >
                <p className="text-xs text-gray-500">Configure as opções...</p>
              </div>
            )}
            
            {/* Fallback option */}
            <div className="relative flex items-center">
              <div 
                className="flex px-4 py-2 border rounded-md bg-white items-center cursor-pointer w-full hover:border-gray-300 transition-colors"
                onClick={onClick}
              >
                <AlertCircle className="h-3 w-3 text-gray-400 mr-2" />
                <p className="text-xs text-gray-500">Nenhuma das Alternativas</p>
              </div>
              {/* Connection Handle */}
              <div className="absolute right-[-49px] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${block.id}-fallback`}
                  className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
                >
                  <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-gray-400 pointer-events-none" />
                </Handle>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          {menuFooter && (
            <div 
              className="flex p-2 rounded-md border border-dashed border-gray-300 bg-gray-50/50 w-full cursor-pointer hover:border-gray-400 transition-colors"
              onClick={onClick}
            >
              <p className="text-[10px] text-gray-500 italic">{menuFooter}</p>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Render expanded buttons block with connection handles
  const isButtons = block.type === 'buttons';
  const buttonOptions = getButtonOptions(block);
  const buttonsBody = block.data?.buttonsData?.body || '';
  const buttonsFooter = block.data?.buttonsData?.footer || '';
  
  if (isButtons && showOutputHandles) {
    return (
      <div
        className={cn(
          "group relative flex gap-2 p-3 rounded-lg items-start w-full",
          "bg-white border border-gray-200",
          "transition-all duration-150"
        )}
      >
        {/* Buttons Icon */}
        <ToggleLeft className="size-4 shrink-0 text-teal-500 stroke-2 mt-1" />
        
        <div className="flex flex-col gap-2 flex-1">
          {/* Body/Description */}
          {buttonsBody && (
            <div 
              className="flex p-2 rounded-md border border-gray-200 bg-gray-50 w-full cursor-pointer hover:border-gray-300 transition-colors"
              onClick={onClick}
            >
              <p className="text-xs text-gray-600 line-clamp-2 whitespace-pre-wrap">{buttonsBody}</p>
            </div>
          )}

          {/* Buttons with handles */}
          <div className="flex flex-col gap-1.5">
            {buttonOptions.length > 0 ? (
              buttonOptions.map((option) => (
                <div key={option.id} className="relative flex items-center">
                  <div 
                    className="flex p-3 rounded-md border w-full bg-teal-50 border-teal-200 cursor-pointer hover:border-teal-300 transition-colors"
                    onClick={onClick}
                  >
                    <p className="text-xs text-teal-700 font-medium">{option.title}</p>
                  </div>
                  {/* Connection Handle */}
                  <div className="absolute right-[-49px] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={`${block.id}-${option.id}`}
                      className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
                    >
                      <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-teal-400 pointer-events-none" />
                    </Handle>
                  </div>
                </div>
              ))
            ) : (
              <div 
                className="flex p-3 rounded-md border w-full bg-white cursor-pointer hover:border-gray-300 transition-colors"
                onClick={onClick}
              >
                <p className="text-xs text-gray-500">Configure os botões...</p>
              </div>
            )}
            
            {/* Fallback option */}
            <div className="relative flex items-center">
              <div 
                className="flex px-4 py-2 border rounded-md bg-white items-center cursor-pointer w-full hover:border-gray-300 transition-colors"
                onClick={onClick}
              >
                <AlertCircle className="h-3 w-3 text-gray-400 mr-2" />
                <p className="text-xs text-gray-500">Nenhuma das Alternativas</p>
              </div>
              {/* Connection Handle */}
              <div className="absolute right-[-49px] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${block.id}-fallback`}
                  className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
                >
                  <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-gray-400 pointer-events-none" />
                </Handle>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          {buttonsFooter && (
            <div 
              className="flex p-2 rounded-md border border-dashed border-gray-300 bg-gray-50/50 w-full cursor-pointer hover:border-gray-400 transition-colors"
              onClick={onClick}
            >
              <p className="text-[10px] text-gray-500 italic">{buttonsFooter}</p>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

// Render expanded condition block (Typebot style with multiple independent rules)
  if (block.type === 'condition' && showOutputHandles) {
    const operatorsWithoutValue = ['exists', 'not_exists', 'not_found', 'is_empty', 'is_not_empty'];
    
    // Support both old structure (comparisons) and new structure (rules)
    const conditionData = block.data?.conditions;
    const rules: Array<{ comparisons: Array<{ variable: string; operator: string; value: string }> }> = 
      conditionData?.rules || 
      (conditionData?.comparisons?.length > 0 ? [{ comparisons: conditionData.comparisons }] : []);
    
    const getOperatorLabel = (operator: string) => {
      switch (operator) {
        case 'exists': return 'is set';
        case 'not_exists': return 'is not set';
        case 'not_found': return 'not found';
        case 'is_empty': return 'is empty';
        case 'is_not_empty': return 'is not empty';
        case '==': return '=';
        case '!=': return '≠';
        case '>': return '>';
        case '<': return '<';
        case '>=': return '≥';
        case '<=': return '≤';
        case 'contains': return 'contains';
        case 'not_contains': return 'not contains';
        case 'starts_with': return 'starts with';
        case 'ends_with': return 'ends with';
        default: return operator;
      }
    };
    
    const getRuleLabel = (rule: { comparisons: Array<{ variable: string; operator: string; value: string }> }) => {
      const validComparisons = rule.comparisons.filter(c => 
        c.variable && (operatorsWithoutValue.includes(c.operator) || c.value)
      );
      
      if (validComparisons.length === 0) return null;
      
      // Show first comparison with variable in purple
      const first = validComparisons[0];
      const opLabel = getOperatorLabel(first.operator);
      const hasValue = !operatorsWithoutValue.includes(first.operator);
      
      return {
        variable: first.variable,
        operator: opLabel,
        value: hasValue ? first.value : null,
        extraCount: validComparisons.length - 1
      };
    };
    
    const validRules = rules.filter(rule => {
      const label = getRuleLabel(rule);
      return label !== null;
    });
    
    return (
      <div
        className={cn(
          "group relative flex gap-2 p-3 rounded-lg items-start w-full",
          "bg-white border border-gray-200",
          "transition-all duration-150"
        )}
      >
        {/* Filter Icon with add button */}
        <div className="flex flex-col items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className="size-4 shrink-0 text-amber-500 stroke-2">
            <path d="M8.85746 12.5061C6.36901 10.6456 4.59564 8.59915 3.62734 7.44867C3.3276 7.09253 3.22938 6.8319 3.17033 6.3728C2.96811 4.8008 2.86701 4.0148 3.32795 3.5074C3.7889 3 4.60404 3 6.23433 3H17.7657C19.396 3 20.2111 3 20.672 3.5074C21.133 4.0148 21.0319 4.8008 20.8297 6.37281C20.7706 6.83191 20.6724 7.09254 20.3726 7.44867C19.403 8.60062 17.6261 10.6507 15.1326 12.5135C14.907 12.6821 14.7583 12.9567 14.7307 13.2614C14.4837 15.992 14.2559 17.4876 14.1141 18.2442C13.8853 19.4657 12.1532 20.2006 11.226 20.8563C10.6741 21.2466 10.0043 20.782 9.93278 20.1778C9.79643 19.0261 9.53961 16.6864 9.25927 13.2614C9.23409 12.9539 9.08486 12.6761 8.85746 12.5061Z"></path>
          </svg>
          {/* Add condition button */}
          {onAddConditionRule && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddConditionRule(); }}
              className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 hover:bg-amber-100 text-gray-400 hover:text-amber-600 transition-colors"
              title="Adicionar condição"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
          {/* Rules list */}
          <div className="flex flex-col gap-1.5">
            {validRules.length > 0 ? (
              validRules.map((rule, ruleIndex) => {
                const label = getRuleLabel(rule)!;
                return (
                  <div key={ruleIndex} className="relative flex items-center">
                    <div 
                      className="flex flex-wrap items-center gap-1.5 p-3 rounded-md border w-full bg-white cursor-pointer hover:border-gray-300 transition-colors min-w-0"
                      onClick={() => onEditConditionRule ? onEditConditionRule(ruleIndex) : onClick()}
                    >
                      <span className="text-xs text-gray-700 shrink-0">SE</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500 text-white text-xs font-medium shrink-0 max-w-[120px] truncate">
                        {label.variable}
                      </span>
                      <span className="text-xs text-gray-700 shrink-0">{label.operator}</span>
                      {label.value && (
                        <span className="text-xs text-gray-700 break-all max-w-[100px] truncate" title={label.value}>
                          {label.value}
                        </span>
                      )}
                      {label.extraCount > 0 && (
                        <span className="text-xs text-gray-400 ml-1 shrink-0">+{label.extraCount}</span>
                      )}
                    </div>
                    {/* Connection Handle */}
                    <div className="absolute right-[-49px] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={`${block.id}-rule-${ruleIndex}`}
                        className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
                      >
                        <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-orange-400 pointer-events-none" />
                      </Handle>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="relative flex items-center">
                <div 
                  className="flex items-center gap-1.5 p-3 rounded-md border w-full bg-white cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => onEditConditionRule ? onEditConditionRule(0) : onClick()}
                >
                  <span className="text-xs text-gray-500">Adicionar condição...</span>
                </div>
                {/* Connection Handle */}
                <div className="absolute right-[-49px] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`${block.id}-rule-0`}
                    className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
                  >
                    <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-orange-400 pointer-events-none" />
                  </Handle>
                </div>
              </div>
            )}
            
            {/* Else/Senão */}
            <div className="relative flex items-center">
              <div className="flex px-4 py-2 border rounded-md bg-white items-center cursor-not-allowed w-full">
                <p className="text-xs text-gray-500">Senão</p>
              </div>
              {/* Connection Handle */}
              <div className="absolute right-[-49px] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${block.id}-else`}
                  className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
                >
                  <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-orange-400 pointer-events-none" />
                </Handle>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Render expanded randomizer block
  if (block.type === 'randomizer' && showOutputHandles) {
    const percent = block.data?.percent || 50;
    return (
      <div
        className={cn(
          "group relative rounded-lg overflow-visible",
          "bg-pink-50 border-2",
          config.borderColor,
          "transition-all duration-150"
        )}
      >
        {/* Header */}
        <div 
          className={cn("flex items-center gap-2 px-3 py-2 border-b cursor-pointer", config.borderColor, config.bgColor)}
          onClick={onClick}
        >
          <Icon className={cn("h-4 w-4", config.color)} />
          <span className="text-xs font-semibold text-gray-800 flex-1">{config.label}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isFirst && onMoveUp && (
              <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-white/50" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
                <ChevronUp className="h-3 w-3" />
              </Button>
            )}
            {!isLast && onMoveDown && (
              <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-white/50" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
                <ChevronDown className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Branches */}
        <div className="px-3 py-2 space-y-1.5">
          <div className="relative flex items-center">
            <div className="flex-1 bg-pink-100 border border-pink-300 rounded px-2 py-1.5 mr-4" onClick={onClick}>
              <span className="text-xs text-pink-700">Caminho A ({percent}%)</span>
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={`${block.id}-a`}
              className="flow-handle-tight !absolute !right-0 !w-4 !h-4 !bg-pink-500 !border-2 !border-white !z-[15] hover:!scale-125 transition-transform"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
          <div className="relative flex items-center">
            <div className="flex-1 bg-purple-100 border border-purple-300 rounded px-2 py-1.5 mr-4" onClick={onClick}>
              <span className="text-xs text-purple-700">Caminho B ({100 - percent}%)</span>
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={`${block.id}-b`}
              className="flow-handle-tight !absolute !right-0 !w-4 !h-4 !bg-purple-500 !border-2 !border-white !z-[15] hover:!scale-125 transition-transform"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Render interval block
  if (block.type === 'interval' && showOutputHandles) {
    const seconds = block.data?.sec || 0;
    
    return (
      <div
        className={cn(
          "group relative flex gap-2 p-3 rounded-lg items-center w-full",
          "bg-white border border-gray-200",
          "transition-all duration-150 cursor-pointer"
        )}
        onClick={onClick}
      >
        {/* Clock Icon */}
        <Clock className="size-4 shrink-0 text-purple-500 stroke-2" />
        
        <p className="text-gray-800 text-sm flex-1 max-w-[180px] break-words">
          Wait for {seconds}s
        </p>
        
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Render question block with variable badge
  if (block.type === 'question' && showOutputHandles) {
    const questionMessage = block.data?.typebotIntegration?.message || '';
    const answerKey = block.data?.typebotIntegration?.answerKey || '';
    
    return (
      <div
        className={cn(
          "group relative rounded-lg overflow-visible",
          "bg-white border border-gray-200",
          "transition-all duration-150"
        )}
      >
        {/* Content */}
        <div className="px-3 py-2.5 cursor-pointer" onClick={onClick}>
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-700 flex-1 line-clamp-2">
              {questionMessage ? (
                <FormattedWhatsAppText text={questionMessage} />
              ) : (
                'Configure a pergunta'
              )}
            </div>
          </div>
          {answerKey && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500">Definir</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-600 text-white rounded">
                {answerKey}
              </span>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Render text block with icon style
  if (block.type === 'text' && showOutputHandles) {
    const textMessage = block.data?.description || block.data?.message || block.data?.text || '';
    
    return (
      <div
        className={cn(
          "group relative rounded-lg overflow-visible",
          "bg-white border border-gray-200",
          "transition-all duration-150"
        )}
      >
        {/* Content */}
        <div className="px-3 py-2.5 cursor-pointer" onClick={onClick}>
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-700 flex-1 max-h-24 overflow-hidden">
              {textMessage ? (
                <FormattedWhatsAppText text={textMessage} />
              ) : (
                'Clique para adicionar texto'
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Render ticket/queue block
  if (block.type === 'ticket' && showOutputHandles) {
    const queueNames = block.data?.queueNames || [];
    const queueIds = block.data?.queueIds || [];
    const hasQueues = queueIds.length > 0;
    
    return (
      <div
        className={cn(
          "group relative flex gap-2 p-3 rounded-lg items-start w-full",
          "bg-white border border-gray-200",
          "transition-all duration-150 cursor-pointer"
        )}
        onClick={onClick}
      >
        {/* Ticket Icon */}
        <Ticket className="size-4 shrink-0 text-orange-500 stroke-2 mt-0.5" />
        
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {hasQueues ? (
            <>
              <p className="text-xs text-gray-500">Transferir para fila:</p>
              <div className="flex flex-wrap gap-1">
                {queueNames.map((name: string, idx: number) => (
                  <span key={idx} className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                    {name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Configure a fila...</p>
          )}
        </div>
        
        {/* Connection Handle */}
        <div className="absolute right-[-34px] bottom-[50%] translate-y-[50%] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
          <Handle
            type="source"
            position={Position.Right}
            id={`${block.id}-output`}
            className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
          >
            <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-orange-400 pointer-events-none" />
          </Handle>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Render tags block
  if (block.type === 'tags' && showOutputHandles) {
    const selectedTags = block.data?.selectedTags || [];
    const hasTags = selectedTags.length > 0;
    
    return (
      <div
        className={cn(
          "group relative flex gap-2 p-3 rounded-lg items-start w-full",
          "bg-white border border-gray-200",
          "transition-all duration-150 cursor-pointer"
        )}
        onClick={onClick}
      >
        {/* Tag Icon */}
        <Tag className="size-4 shrink-0 text-emerald-500 stroke-2 mt-0.5" />
        
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {hasTags ? (
            <>
              <p className="text-xs text-gray-500">Tags selecionadas:</p>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag: any, idx: number) => (
                  <span 
                    key={idx} 
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ 
                      backgroundColor: tag.color ? `${tag.color}20` : '#dcfce7',
                      color: tag.color || '#15803d'
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Configure as tags...</p>
          )}
        </div>
        
        {/* Connection Handle */}
        <div className="absolute right-[-34px] bottom-[50%] translate-y-[50%] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
          <Handle
            type="source"
            position={Position.Right}
            id={`${block.id}-output`}
            className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
          >
            <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-orange-400 pointer-events-none" />
          </Handle>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Render location block
  if (block.type === 'location' && showOutputHandles) {
    const location = block.data?.location || {};
    const hasLocation = location.latitude || location.longitude;
    
    return (
      <div
        className={cn(
          "group relative rounded-lg overflow-visible",
          "bg-white border border-gray-200",
          "transition-all duration-150"
        )}
      >
        {/* Content */}
        <div className="px-3 py-2.5 cursor-pointer" onClick={onClick}>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {hasLocation ? (
                <div className="space-y-1.5">
                  {location.name && (
                    <p className="text-xs font-medium text-gray-700">{location.name}</p>
                  )}
                  {location.address && (
                    <p className="text-[10px] text-gray-500 break-words max-w-[180px]">{location.address}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {location.latitude && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">Lat:</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-600 text-white rounded">
                          {location.latitude}
                        </span>
                      </div>
                    )}
                    {location.longitude && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">Lng:</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-600 text-white rounded">
                          {location.longitude}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Configure a localização...</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Connection Handle */}
        <div className="absolute right-[-34px] bottom-[50%] translate-y-[50%] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
          <Handle
            type="source"
            position={Position.Right}
            id={`${block.id}-output`}
            className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
          >
            <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-orange-400 pointer-events-none" />
          </Handle>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Render HTTP Request block
  if (block.type === 'httpRequest' && showOutputHandles) {
    const method = block.data?.method || 'GET';
    const url = block.data?.url || '';
    const outputMappings = block.data?.outputMappings || [];
    
    return (
      <div
        className={cn(
          "group relative rounded-lg overflow-visible",
          "bg-white border border-gray-200",
          "transition-all duration-150"
        )}
      >
        {/* Content */}
        <div className="px-3 py-2.5 cursor-pointer" onClick={onClick}>
          <div className="flex items-start gap-2">
            <Globe className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-2">
              {/* URL */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded">
                  {method}
                </span>
                <p className="text-xs text-gray-700 flex-1 break-words max-w-[160px]">
                  {url || 'Configure a URL...'}
                </p>
              </div>
              
              {/* Output Mappings */}
              {outputMappings.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                  {outputMappings.map((mapping: any, idx: number) => (
                    <div key={mapping.id || idx} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">Definir</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-600 text-white rounded">
                          {mapping.variable || 'variável'}
                        </span>
                      </div>
                      {mapping.path && (
                        <span className="text-[10px] text-gray-400 pl-8 break-all">
                          {mapping.path}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        
        {/* Error Output Handle (red) - positioned INSIDE the block boundary to avoid capturing bottom handle clicks */}
        <Handle
          type="source"
          position={Position.Right}
          id={`${block.id}-error`}
          className="http-error-handle !absolute !w-2.5 !h-2.5 !bg-red-500 !border-2 !border-white !rounded-full !right-0 !top-1/2 !-translate-y-1/2"
          style={{ 
            zIndex: 1,
            transform: 'translateX(50%) translateY(-50%)'
          }}
        />
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Render Loop block with two connection handles
  if (block.type === 'loop' && showOutputHandles) {
    const arrayVar = block.data?.arrayVariable || '';
    const itemVar = block.data?.itemVariable || 'item';
    const indexVar = block.data?.indexVariable || '';
    
    return (
      <div
        className={cn(
          "group relative flex gap-2 p-3 rounded-lg items-start w-full",
          "bg-white border border-gray-200",
          "transition-all duration-150"
        )}
      >
        {/* Loop Icon */}
        <Repeat className="size-4 shrink-0 text-indigo-500 stroke-2 mt-1" />
        
        <div className="flex flex-col gap-2 flex-1">
          {/* Loop Configuration */}
          <div 
            className="flex flex-col gap-1 p-2 rounded-md border border-indigo-200 bg-indigo-50 w-full cursor-pointer hover:border-indigo-300 transition-colors"
            onClick={onClick}
          >
            <p className="text-xs font-medium text-indigo-700">Loop</p>
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white rounded">
                {arrayVar || '{{array}}'}
              </span>
              <span className="text-[10px] text-indigo-600">→</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-600 text-white rounded">
                {itemVar}
              </span>
              {indexVar && (
                <>
                  <span className="text-[10px] text-indigo-600">,</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-600 text-white rounded">
                    {indexVar}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Loop Body Connection */}
          <div className="relative flex items-center">
            <div 
              className="flex p-3 rounded-md border w-full bg-indigo-100 border-indigo-300 cursor-pointer hover:border-indigo-400 transition-colors"
              onClick={onClick}
            >
              <div className="flex items-center gap-2">
                <Repeat className="h-3 w-3 text-indigo-600" />
                <p className="text-xs text-indigo-700 font-medium">Para cada item</p>
              </div>
            </div>
            {/* Loop Body Handle */}
            <div className="absolute right-[-49px] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
              <Handle
                type="source"
                position={Position.Right}
                id={`${block.id}-loop_body`}
                className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
              >
                <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-indigo-500 pointer-events-none" />
              </Handle>
            </div>
          </div>
          
          {/* Loop Complete Connection */}
          <div className="relative flex items-center">
            <div 
              className="flex px-4 py-2 border rounded-md bg-white items-center cursor-pointer w-full hover:border-gray-300 transition-colors"
              onClick={onClick}
            >
              <SkipForward className="h-3 w-3 text-gray-500 mr-2" />
              <p className="text-xs text-gray-600">Após o loop</p>
            </div>
            {/* Loop Complete Handle */}
            <div className="absolute right-[-49px] flex w-5 h-5 rounded-full justify-center items-center z-[15] flow-handle-wrapper">
              <Handle
                type="source"
                position={Position.Right}
                id={`${block.id}-loop_complete`}
                className="flow-handle-tight !relative !w-5 !h-5 !bg-white !border !border-gray-300 !rounded-full !z-[15] flex items-center justify-center hover:!scale-110 transition-transform"
              >
                <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-green-500 pointer-events-none" />
              </Handle>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Render Jump block with special style
  if (block.type === 'jump') {
    const targetGroupTitle = block.data?.targetGroupTitle || '';
    
    return (
      <div
        className={cn(
          "group relative rounded-lg overflow-visible",
          "bg-white border border-gray-200",
          "transition-all duration-150"
        )}
      >
        {/* Content */}
        <div className="px-3 py-2.5 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-2">
            <SkipForward className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs text-gray-600">Pulando para</span>
            {targetGroupTitle ? (
              <span className="text-xs px-2 py-0.5 bg-purple-600 text-white rounded-md font-medium">
                {targetGroupTitle}
              </span>
            ) : (
              <span className="text-xs text-gray-400 italic">Selecionar grupo...</span>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isFirst && onMoveUp && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
              <ChevronUp className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          {!isLast && onMoveDown && (
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // Default compact rendering for other block types
  const getBlockDescription = (): string => {
    switch (block.type) {
      case 'text':
        return block.data?.message?.substring(0, 40) || 'Mensagem de texto';
      case 'ticket':
        const queues = block.data?.queueIds;
        if (queues?.length > 0) return `${queues.length} fila(s)`;
        return 'Criar ticket';
      case 'tags':
        const tags = block.data?.selectedTags;
        if (tags?.length > 0) return tags.map((t: any) => t.name).join(', ').substring(0, 40);
        return 'Tags';
      case 'typebot':
        return block.data?.typebotIntegration?.name || 'Typebot';
      case 'openai':
        return block.data?.typebotIntegration?.name || 'OpenAI';
      case 'interval':
        return block.data?.intervalDescription || 'Intervalo';
      case 'location':
        return 'Solicitar localização';
      case 'httpRequest':
        const method = block.data?.method || 'GET';
        const url = block.data?.url?.substring(0, 25) || 'Configurar URL';
        return `${method} ${url}`;
      case 'jump':
        return block.data?.targetGroupTitle || 'Configurar destino';
      case 'convertBase64':
        const srcVar = block.data?.sourceVariable || '';
        const outVar = block.data?.outputVariable || '';
        return srcVar && outVar ? `${srcVar} → ${outVar}` : 'Configurar conversão';
      case 'javascript':
        return block.data?.description || 'Executar código JS';
      default:
        return block.type;
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 p-2.5 rounded-lg cursor-pointer",
        "bg-white hover:bg-gray-50",
        "border border-gray-200 hover:border-gray-300",
        "transition-all duration-150"
      )}
      onClick={onClick}
    >
      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-blue-600">{block.order}</span>
      </div>
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", config.bgColor)}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0 max-w-[180px]">
        <p className="text-xs font-semibold text-gray-800">{config.label}</p>
        <p className="text-[10px] text-gray-500 break-words">{getBlockDescription()}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isFirst && onMoveUp && (
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}>
            <ChevronUp className="h-3 w-3" />
          </Button>
        )}
        {!isLast && onMoveDown && (
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}>
            <ChevronDown className="h-3 w-3" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

export const FlowBlockItem = FlowBlockItemComponent;
