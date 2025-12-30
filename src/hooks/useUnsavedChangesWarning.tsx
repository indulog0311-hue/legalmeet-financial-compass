import { useEffect } from 'react';

interface UseUnsavedChangesWarningProps {
  hasUnsavedChanges: boolean;
  message?: string;
}

export function useUnsavedChangesWarning({
  hasUnsavedChanges,
  message = '¿Estás seguro de que deseas salir? Tienes cambios sin guardar que se perderán.'
}: UseUnsavedChangesWarningProps) {
  
  // Bloquear navegación del navegador (cerrar pestaña, recargar)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message]);
}
