import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const StartNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div
      className={`
        flex flex-col gap-2 py-2 pl-3 pr-3 rounded-xl border font-medium
        bg-white select-none transition-all duration-150
        hover:shadow-md cursor-pointer
        ${selected ? 'border-orange-400 shadow-md' : 'border-gray-200'}
      `}
      style={{ width: '230px' }}
    >
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" className="size-4 stroke-[1.5px] text-gray-800">
          <path d="M4 7L4 21"></path>
          <path d="M11.7576 3.90865C8.45236 2.22497 5.85125 3.21144 4.55426 4.2192C4.32048 4.40085 4.20358 4.49167 4.10179 4.69967C4 4.90767 4 5.10138 4 5.4888V14.7319C4.9697 13.6342 7.87879 11.9328 11.7576 13.9086C15.224 15.6744 18.1741 14.9424 19.5697 14.1795C19.7633 14.0737 19.8601 14.0207 19.9301 13.9028C20 13.7849 20 13.6569 20 13.4009V5.87389C20 5.04538 20 4.63113 19.8027 4.48106C19.6053 4.33099 19.1436 4.459 18.2202 4.71504C16.64 5.15319 14.3423 5.22532 11.7576 3.90865Z"></path>
        </svg>
        <p className="text-sm text-gray-800">Início</p>
      </div>
      
      {/* Handle de saída estilizado */}
      <div className="absolute right-[-19px] bottom-[3px] flex size-8 rounded-full justify-center items-center pointer-events-none">
        <div className="flex size-5 justify-center items-center rounded-full bg-white border border-gray-300">
          <div className="flex size-[13px] rounded-full border-[3.5px] shadow-sm border-orange-500" />
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="!w-5 !h-5 !bg-transparent !border-0 !right-[-10px]"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';
