import React, { createContext, useContext, ReactNode } from 'react';
import { useProjectSync } from '@/hooks/useProjectSync';

type ProjectContextType = ReturnType<typeof useProjectSync>;

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const projectSync = useProjectSync();

  return (
    <ProjectContext.Provider value={projectSync}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
