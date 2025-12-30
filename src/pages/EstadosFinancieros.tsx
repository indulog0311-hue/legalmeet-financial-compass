// Re-export from modular folder structure
// The original monolithic file has been refactored into:
// - src/pages/EstadosFinancieros/index.tsx (orchestrator)
// - src/pages/EstadosFinancieros/hooks/useFinancialStatements.ts (business logic)
// - src/pages/EstadosFinancieros/components/*.tsx (UI components)

export { default } from './EstadosFinancieros/index';
export * from './EstadosFinancieros/hooks/useFinancialStatements';
