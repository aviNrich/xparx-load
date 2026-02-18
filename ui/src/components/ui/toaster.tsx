import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'bg-white border border-neutral-200 shadow-lg rounded-xl',
          title: 'text-neutral-900 font-semibold',
          description: 'text-neutral-600 text-sm',
          actionButton: 'bg-primary-500 text-white hover:bg-primary-600',
          cancelButton: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
          closeButton: 'bg-white border border-neutral-200 hover:bg-neutral-50',
          success: 'border-success-200 bg-success-50',
          error: 'border-error-200 bg-error-50',
          warning: 'border-warning-200 bg-warning-50',
          info: 'border-info-200 bg-info-50',
        },
      }}
      duration={4000}
      closeButton
      richColors
    />
  );
}
