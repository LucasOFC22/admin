import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
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
  Play,
  Tag,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeMessageRenderer } from '@/utils/safeMessageRenderer';

const getNodeConfig = (type: string) => {
  const normalizedType = type?.toLowerCase().trim();
  switch (normalizedType) {
    case 'start':
      return {
        icon: Play,
        color: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-300',
        textColor: 'text-emerald-700'
      };
    case 'text':
      return {
        icon: MessageSquare,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        textColor: 'text-blue-700'
      };
    case 'menu':
      return {
        icon: List,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300',
        textColor: 'text-purple-700'
      };
    case 'ticket':
      return {
        icon: Ticket,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        textColor: 'text-orange-700'
      };
    case 'typebot':
      return {
        icon: Bot,
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-300',
        textColor: 'text-indigo-700'
      };
    case 'randomizer':
      return {
        icon: Shuffle,
        color: 'from-pink-500 to-pink-600',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-300',
        textColor: 'text-pink-700'
      };
    case 'condition':
      return {
        icon: GitBranch,
        color: 'from-violet-500 to-violet-600',
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-300',
        textColor: 'text-violet-700'
      };
    case 'question':
      return {
        icon: HelpCircle,
        color: 'from-cyan-500 to-cyan-600',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-300',
        textColor: 'text-cyan-700'
      };
    case 'openai':
      return {
        icon: Sparkles,
        color: 'from-violet-500 to-violet-600',
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-300',
        textColor: 'text-violet-700'
      };
    case 'interval':
      return {
        icon: Clock,
        color: 'from-slate-500 to-slate-600',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-300',
        textColor: 'text-slate-700'
      };
    case 'tags':
      return {
        icon: Tag,
        color: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-300',
        textColor: 'text-emerald-700'
      };
    case 'location':
      return {
        icon: MapPin,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        textColor: 'text-green-700'
      };
    default:
      return {
        icon: MessageSquare,
        color: 'from-gray-500 to-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300',
        textColor: 'text-gray-700'
      };
  }
};

const CustomNode = ({ data, selected }: NodeProps) => {
  const normalizedType = data.type?.toLowerCase().trim();
  const config = getNodeConfig(normalizedType);
  const Icon = config.icon;
  const isStart = normalizedType === 'start';
  const isMenu = normalizedType === 'menu';
  const isCondition = normalizedType === 'condition';

  return (
    <div
      className={cn(
        'rounded-lg border-2 shadow-lg transition-all duration-200',
        config.borderColor,
        config.bgColor,
        selected && 'ring-4 ring-primary/30 scale-105'
      )}
      style={{ 
        minWidth: isMenu ? '280px' : '200px',
        maxWidth: isMenu ? '320px' : '280px',
        width: isMenu ? '320px' : '280px'
      }}
    >
      {/* Handle de entrada (não aparece no start) */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-white"
        />
      )}

      {/* Header com ícone e gradiente */}
      <div className={cn('px-4 py-2 bg-gradient-to-r', config.color, 'rounded-t-md')}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm truncate">
            {data.type === 'start' ? 'Início' : (data.type === 'text' ? data.description : data.label)}
          </span>
        </div>
      </div>

      {/* Corpo do node */}
      <div className="px-4 py-3">
        {isCondition ? (
          // Renderização de múltiplas condições com saídas independentes
          <div className="space-y-2">
            {data.conditions?.rules && data.conditions.rules.length > 0 ? (
              <>
                {data.conditions.rules.map((rule: any, index: number) => {
                  const ruleLabel = rule.comparisons?.[0]
                    ? `${rule.comparisons[0].variable} ${rule.comparisons[0].operator} ${rule.comparisons[0].value || ''}`
                    : `Condição ${index + 1}`;
                  return (
                    <div
                      key={`rule-${index}`}
                      className="flex items-center justify-between text-xs bg-white rounded px-2 py-1.5 border border-violet-200"
                    >
                      <div className="flex-1 truncate">
                        <span className="text-violet-700 font-medium text-[11px]">
                          {ruleLabel.length > 25 ? ruleLabel.substring(0, 25) + '...' : ruleLabel}
                        </span>
                        {rule.comparisons?.length > 1 && (
                          <span className="text-violet-400 text-[10px] ml-1">
                            (+{rule.comparisons.length - 1})
                          </span>
                        )}
                      </div>
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={`condition-${index}`}
                        className="!w-3 !h-3 !bg-gradient-to-br from-violet-400 to-violet-600 !border-2 !border-white !static !transform-none !right-[-8px] !z-50 hover:!scale-125 transition-transform"
                        style={{ position: 'absolute', right: '-8px' }}
                      />
                    </div>
                  );
                })}
                {/* Saída Else (padrão) */}
                <div className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1.5 border border-gray-200">
                  <span className="text-gray-500 font-medium text-[11px]">Else (Padrão)</span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id="else"
                    className="!w-3 !h-3 !bg-gradient-to-br from-gray-400 to-gray-500 !border-2 !border-white !static !transform-none !right-[-8px] !z-40 hover:!scale-125 transition-transform"
                    style={{ position: 'absolute', right: '-8px' }}
                  />
                </div>
              </>
            ) : (
              // Estado vazio - ainda sem condições
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs bg-white rounded px-2 py-1.5 border border-violet-200 border-dashed">
                  <span className="text-violet-400 font-medium text-[11px]">Adicione condições...</span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id="condition-0"
                    className="!w-3 !h-3 !bg-gradient-to-br from-violet-400 to-violet-600 !border-2 !border-white !static !transform-none !right-[-8px] !z-50 hover:!scale-125 transition-transform"
                    style={{ position: 'absolute', right: '-8px' }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1.5 border border-gray-200">
                  <span className="text-gray-500 font-medium text-[11px]">Else (Padrão)</span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id="else"
                    className="!w-3 !h-3 !bg-gradient-to-br from-gray-400 to-gray-500 !border-2 !border-white !static !transform-none !right-[-8px] !z-40 hover:!scale-125 transition-transform"
                    style={{ position: 'absolute', right: '-8px' }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : isMenu ? (
          // Novo formato com seções
          data.menuData?.sections ? (
            <div className="space-y-2">
              {data.menuData.header && (
                <SafeMessageRenderer 
                  message={data.menuData.header} 
                  className={cn('text-xs font-bold', config.textColor)}
                />
              )}
              <SafeMessageRenderer 
                message={(data.menuData.body?.substring(0, 50) || '') + (data.menuData.body?.length > 50 ? '...' : '')} 
                className={cn('text-xs font-medium', config.textColor)}
              />
              <div className="space-y-2">
                {data.menuData.sections.map((section: any) => (
                  <div key={section.id} className="space-y-1">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase">
                      {section.title}
                    </p>
                    {section.rows.map((row: any) => (
                      <div
                        key={row.id}
                        className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 border border-gray-200"
                      >
                        <div className="flex-1 truncate">
                          <span className="text-gray-700 font-medium">
                            {row.title}
                          </span>
                          {row.description && (
                            <p className="text-[10px] text-gray-500 truncate">
                              {row.description}
                            </p>
                          )}
                        </div>
                        <Handle
                          type="source"
                          position={Position.Right}
                          id={row.id}
                          className="!w-3 !h-3 !bg-gradient-to-br from-purple-400 to-purple-600 !border-2 !border-white !static !transform-none !right-[-8px] !z-50 hover:!scale-125 transition-transform"
                          style={{ position: 'absolute', right: '-8px' }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Formato antigo (compatibilidade)
            data.arrayOption && data.arrayOption.length > 0 ? (
              <div className="space-y-2">
                <SafeMessageRenderer 
                  message={(data.message?.substring(0, 50) || '') + (data.message?.length > 50 ? '...' : '')} 
                  className={cn('text-xs font-medium', config.textColor)}
                />
                <div className="space-y-1">
                  {data.arrayOption.map((option: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 border border-gray-200"
                    >
                      <span className="text-gray-600 truncate">
                        {option.number}. {option.value}
                      </span>
                      <Handle
                        type="source"
                        position={Position.Right}
                        id={`option-${option.number}`}
                        className="!w-3 !h-3 !bg-gradient-to-br from-purple-400 to-purple-600 !border-2 !border-white !static !transform-none !right-[-8px] !z-50 hover:!scale-125 transition-transform"
                        style={{ position: 'absolute', right: '-8px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className={cn('text-xs', config.textColor)}>
                Menu vazio
              </p>
            )
          )
        ) : (
          <SafeMessageRenderer 
            message={data.description || 'Sem descrição'} 
            className={cn('text-xs', config.textColor, 'line-clamp-2')}
          />
        )}
      </div>

      {/* Handle de saída (para nodes não-menu e não-condition) */}
      {!isMenu && !isCondition && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-gradient-to-br from-primary to-primary/80 border-2 border-white"
        />
      )}
    </div>
  );
};

export default memo(CustomNode);
