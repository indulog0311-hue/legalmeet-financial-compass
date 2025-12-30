import { Suspense, lazy, ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// ============ HELPER FOR NAMED EXPORTS ============
// React.lazy requires default exports, so we wrap named exports
function lazyNamed<T extends ComponentType<object>>(
  factory: () => Promise<{ [key: string]: T }>,
  name: string
) {
  return lazy(() => factory().then((module) => ({ default: module[name] as T })));
}

// ============ LAZY LOADED PAGES ============
// Pages with default exports
const ThreeStatements = lazy(() => import("@/pages/ThreeStatements"));
const DiagnosticoFinanciero = lazy(() => import("@/pages/DiagnosticoFinanciero"));
const InvestorOnePager = lazy(() => import("./pages/InvestorOnePager"));
const Strategy = lazy(() => import('./pages/Strategy'));
const UnitEconomics = lazy(() => import("@/pages/UnitEconomics"));
const Valuation = lazy(() => import("@/pages/Valuation"));
const SensitivityAnalysis = lazy(() => import("@/pages/SensitivityAnalysis"));
const Auth = lazy(() => import("@/pages/Auth"));
const Perfil = lazy(() => import("@/pages/Perfil"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const EstadosFinancieros = lazy(() => import("@/pages/EstadosFinancieros"));
const Tributario = lazy(() => import("@/pages/Tributario"));
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword"));

// Pages with named exports (wrapped)
const Dashboard = lazyNamed(() => import("@/pages/Dashboard"), "Dashboard");
const Catalogo = lazyNamed(() => import("@/pages/Catalogo"), "Catalogo");
const Ingresos = lazyNamed(() => import("@/pages/Ingresos"), "Ingresos");
const Costos = lazyNamed(() => import("@/pages/Costos"), "Costos");
const KPIs = lazyNamed(() => import("@/pages/KPIs"), "KPIs");
const Alertas = lazyNamed(() => import("@/pages/Alertas"), "Alertas");
const Exportar = lazyNamed(() => import("@/pages/Exportar"), "Exportar");
const Configuracion = lazyNamed(() => import("@/pages/Configuracion"), "Configuracion");

const queryClient = new QueryClient();

// ============ LOADING FALLBACK ============
function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

// Full page loader for auth checks
function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// ============ ROUTE WRAPPERS ============

// Protected route wrapper
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Redirect authenticated users away from auth page
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ============ PROTECTED ROUTE HELPER ============
function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <MainLayout>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </MainLayout>
    </RequireAuth>
  );
}

// ============ ROUTES ============
function AppRoutes() {
  return (
    <Routes>
      {/* Public auth route */}
      <Route path="/auth" element={
        <PublicRoute>
          <Suspense fallback={<FullPageLoader />}>
            <Auth />
          </Suspense>
        </PublicRoute>
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedPage><Configuracion /></ProtectedPage>
      } />
      <Route path="/update-password" element={
        <ProtectedPage><UpdatePassword /></ProtectedPage>
      } />
      <Route path="/strategy" element={
        <ProtectedPage><Strategy /></ProtectedPage>
      } />
      <Route path="/dashboard" element={
        <ProtectedPage><Dashboard /></ProtectedPage>
      } />
      <Route path="/catalogo" element={
        <ProtectedPage><Catalogo /></ProtectedPage>
      } />
      <Route path="/ingresos" element={
        <ProtectedPage><Ingresos /></ProtectedPage>
      } />
      <Route path="/costos" element={
        <ProtectedPage><Costos /></ProtectedPage>
      } />
      <Route path="/estados-financieros" element={
        <ProtectedPage><EstadosFinancieros /></ProtectedPage>
      } />
      <Route path="/kpis" element={
        <ProtectedPage><KPIs /></ProtectedPage>
      } />
      <Route path="/tributario" element={
        <ProtectedPage><Tributario /></ProtectedPage>
      } />
      <Route path="/alertas" element={
        <ProtectedPage><Alertas /></ProtectedPage>
      } />
      <Route path="/exportar" element={
        <ProtectedPage><Exportar /></ProtectedPage>
      } />
      <Route path="/diagnostico" element={
        <ProtectedPage><DiagnosticoFinanciero /></ProtectedPage>
      } />
      <Route path="/investor" element={
        <ProtectedPage><InvestorOnePager /></ProtectedPage>
      } />
      <Route path="/unit-economics" element={
        <ProtectedPage><UnitEconomics /></ProtectedPage>
      } />
      <Route path="/valuation" element={
        <ProtectedPage><Valuation /></ProtectedPage>
      } />
      <Route path="/sensitivity" element={
        <ProtectedPage><SensitivityAnalysis /></ProtectedPage>
      } />
      <Route path="/three-statements" element={
        <ProtectedPage><ThreeStatements /></ProtectedPage>
      } />
      <Route path="/configuracion" element={
        <ProtectedPage><Configuracion /></ProtectedPage>
      } />
      <Route path="/perfil" element={
        <ProtectedPage><Perfil /></ProtectedPage>
      } />
      <Route path="*" element={
        <Suspense fallback={<FullPageLoader />}>
          <NotFound />
        </Suspense>
      } />
    </Routes>
  );
}

// ============ APP ROOT ============
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ProjectProvider>
              <AppRoutes />
            </ProjectProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
