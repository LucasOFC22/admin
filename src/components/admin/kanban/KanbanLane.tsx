import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface KanbanLaneProps {
  id: string;
  title: string;
  color?: string;
  count: number;
  children: React.ReactNode;
}

export const KanbanLane: React.FC<KanbanLaneProps> = ({
  id,
  title,
  color,
  count,
  children,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // "Sem Fila" lane (lane0) gets a more gray appearance
  const isNoQueueLane = id === "lane0";
  const headerBgColor = isNoQueueLane 
    ? "#9ca3af" // Gray-400
    : color || "#6b7280"; // Gray-500 fallback

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[240px] sm:min-w-[280px] max-w-[280px] sm:max-w-[320px] rounded-lg transition-all duration-200",
        isNoQueueLane ? "bg-gray-200/50 dark:bg-gray-700/30" : "bg-muted/50",
        isOver && "ring-1 ring-primary/50 bg-primary/5"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-t-lg transition-opacity duration-200",
          isOver && "opacity-90"
        )}
        style={{
          backgroundColor: headerBgColor,
          color: "#fff",
        }}
      >
        <h3 className="font-semibold text-xs sm:text-sm truncate">{title}</h3>
        <span
          className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium"
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "#fff",
          }}
        >
          {count}
        </span>
      </div>
      <div className="flex-1 p-1.5 sm:p-2 overflow-y-auto max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-300px)]">
        {children}
      </div>
    </div>
  );
};
