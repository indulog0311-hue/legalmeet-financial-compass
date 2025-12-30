// Re-export from modular folder structure
// The original monolithic file has been refactored into:
// - src/pages/Tributario/index.tsx (orchestrator)
// - src/pages/Tributario/hooks/useTaxCalculations.ts (business logic)
// - src/pages/Tributario/components/*.tsx (UI components)

export { default } from './Tributario/index';
export * from './Tributario/hooks/useTaxCalculations';
