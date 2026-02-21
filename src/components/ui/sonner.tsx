
// Simple replacement for sonner
export const showToast = ({ title, message, type }: {
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}) => {
  // Noop - toasts são exibidos pelo sistema principal
};

export const toast = {
  success: (message: string) => {},
  error: (message: string) => {},
  warning: (message: string) => {},
  info: (message: string) => {},
};
