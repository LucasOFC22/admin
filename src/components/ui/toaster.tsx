"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

const variantIcons = {
  default: null,
  destructive: XCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
}

const variantIconColors = {
  default: "text-foreground",
  destructive: "text-destructive-foreground",
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  info: "text-blue-600 dark:text-blue-400",
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
        const Icon = variantIcons[variant as keyof typeof variantIcons]
        const iconColor = variantIconColors[variant as keyof typeof variantIconColors]
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              {Icon && (
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${iconColor}`} />
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}