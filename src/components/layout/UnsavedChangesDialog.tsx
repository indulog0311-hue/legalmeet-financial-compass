import { useProject } from '@/contexts/ProjectContext';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';

export function UnsavedChangesDialog() {
  const { hasUnsavedChanges } = useProject();
  
  // Solo usa beforeunload para advertir al cerrar/recargar la pestaña
  useUnsavedChangesWarning({ hasUnsavedChanges });

  // No renderiza nada - la advertencia se muestra vía el navegador
  return null;
}
