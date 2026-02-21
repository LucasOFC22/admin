import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminDialog = DialogPrimitive.Root;
const AdminDialogTrigger = DialogPrimitive.Trigger;
const AdminDialogPortal = DialogPrimitive.Portal;
const AdminDialogClose = DialogPrimitive.Close;

const AdminDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>, 
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay 
      ref={ref} 
      className={cn(
        "fixed inset-0 z-50 bg-black/40",
        "backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "transition-all duration-300 ease-in-out",
        className
      )}
      {...props} 
    />
  );
});
AdminDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const AdminDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>, 
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
  }
>(({ className, children, showCloseButton = true, ...props }, ref) => {
  return (
    <AdminDialogPortal>
      <AdminDialogOverlay />
      <DialogPrimitive.Content 
        ref={ref} 
        className={cn(
          "fixed left-[50%] top-[50%] z-50",
          // Responsive width with side margins
          "w-[calc(100%-2rem)] sm:w-full max-w-lg",
          "-translate-x-1/2 -translate-y-1/2",
          "bg-background border rounded-lg shadow-lg",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          "duration-300 ease-in-out",
          // Responsive height and padding
          "max-h-[95vh] sm:max-h-[90vh]",
          "overflow-y-auto",
          "p-4 sm:p-6",
          className
        )} 
        {...props}
      >
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 z-50 rounded-full p-2 sm:p-2.5 text-muted-foreground hover:text-foreground bg-background/80 hover:bg-background border border-border hover:border-border/80 backdrop-blur-sm transition-all duration-200 focus:outline-none shadow-sm hover:shadow-md group touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
            <span className="sr-only">Fechar modal</span>
          </DialogPrimitive.Close>
        )}
        {children}
      </DialogPrimitive.Content>
    </AdminDialogPortal>
  );
});
AdminDialogContent.displayName = DialogPrimitive.Content.displayName;

const AdminDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} 
    {...props} 
  />
);
AdminDialogHeader.displayName = "AdminDialogHeader";

const AdminDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2 sm:gap-0",
      "pt-4 sm:pt-6",
      className
    )} 
    {...props} 
  />
);
AdminDialogFooter.displayName = "AdminDialogFooter";

const AdminDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>, 
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title 
    ref={ref} 
    className={cn("text-lg font-semibold leading-none tracking-tight", className)} 
    {...props} 
  />
));
AdminDialogTitle.displayName = DialogPrimitive.Title.displayName;

const AdminDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>, 
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description 
    ref={ref} 
    className={cn("text-sm text-muted-foreground", className)} 
    {...props} 
  />
));
AdminDialogDescription.displayName = DialogPrimitive.Description.displayName;

export { 
  AdminDialog, 
  AdminDialogPortal, 
  AdminDialogOverlay, 
  AdminDialogClose, 
  AdminDialogTrigger, 
  AdminDialogContent, 
  AdminDialogHeader, 
  AdminDialogFooter, 
  AdminDialogTitle, 
  AdminDialogDescription 
};