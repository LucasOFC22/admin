import React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanLane } from "./KanbanLane";
import { KanbanCard, KanbanCardData } from "./KanbanCard";

export interface KanbanLaneData {
  id: string;
  title: string;
  color?: string;
  cards: KanbanCardData[];
}

interface KanbanBoardProps {
  lanes: KanbanLaneData[];
  onCardMove?: (cardId: string, sourceLaneId: string, targetLaneId: string) => void;
  onCardClick?: (card: KanbanCardData) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  lanes,
  onCardMove,
  onCardClick,
}) => {
  const [activeCard, setActiveCard] = React.useState<KanbanCardData | null>(null);
  const [activeLaneId, setActiveLaneId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const findLaneByCardId = (cardId: string): string | null => {
    for (const lane of lanes) {
      if (lane.cards.some((card) => card.id === cardId)) {
        return lane.id;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const cardId = active.id as string;
    const laneId = findLaneByCardId(cardId);
    
    if (laneId) {
      const lane = lanes.find((l) => l.id === laneId);
      const card = lane?.cards.find((c) => c.id === cardId);
      if (card) {
        setActiveCard(card);
        setActiveLaneId(laneId);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Salvar referência à lane de origem antes de limpar estado
    const sourceLaneId = activeLaneId;
    
    if (!over || !sourceLaneId) {
      setActiveCard(null);
      setActiveLaneId(null);
      return;
    }

    const cardId = active.id as string;
    const overId = over.id as string;
    
    // Detectar a lane de destino de forma robusta:
    // 1. Se solto diretamente na lane
    // 2. Se solto sobre outro card, usar containerId do sortable context
    // 3. Fallback: procurar a lane original do card de destino
    let targetLaneId: string | null = null;
    
    // Verifica se solto diretamente em uma lane
    const droppedOnLane = lanes.find((lane) => lane.id === overId);
    if (droppedOnLane) {
      targetLaneId = droppedOnLane.id;
    } else {
      // Solto sobre um card - usar containerId do sortable context
      const sortableData = over.data.current?.sortable;
      if (sortableData?.containerId) {
        targetLaneId = sortableData.containerId;
      } else {
        // Fallback: procurar nas lanes originais (não no estado atual que pode estar desatualizado)
        for (const lane of lanes) {
          if (lane.cards.some((card) => card.id === overId)) {
            targetLaneId = lane.id;
            break;
          }
        }
      }
    }

    // Validar que a lane de destino existe e é diferente da origem
    const targetLaneExists = targetLaneId && lanes.some(l => l.id === targetLaneId);
    
    if (!targetLaneId || !targetLaneExists) {
      // Drop em área inválida - cancelar silenciosamente
      console.log('[KanbanBoard] Drop cancelado - lane de destino inválida:', targetLaneId);
      setActiveCard(null);
      setActiveLaneId(null);
      return;
    }
    
    if (targetLaneId !== sourceLaneId) {
      console.log('[KanbanBoard] Movendo card:', cardId, 'de', sourceLaneId, 'para', targetLaneId);
      onCardMove?.(cardId, sourceLaneId, targetLaneId);
    }

    setActiveCard(null);
    setActiveLaneId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-2 sm:gap-4 h-full overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
        {lanes.map((lane) => (
          <KanbanLane
            key={lane.id}
            id={lane.id}
            title={lane.title}
            color={lane.color}
            count={lane.cards.length}
          >
            <SortableContext
              id={lane.id}
              items={lane.cards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2 min-h-[100px]">
                {lane.cards.map((card) => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    onClick={() => onCardClick?.(card)}
                  />
                ))}
              </div>
            </SortableContext>
          </KanbanLane>
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="opacity-80">
            <KanbanCard card={activeCard} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
