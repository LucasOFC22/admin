import React from 'react';

/**
 * Type for React icon components from lucide-react or similar libraries
 * Use this instead of `any` for icon props
 */
export type IconComponent = React.ComponentType<{
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
}>;

/**
 * Type for lucide-react icons specifically (more strict)
 */
export type LucideIcon = React.ForwardRefExoticComponent<
  React.SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number;
  }
>;
