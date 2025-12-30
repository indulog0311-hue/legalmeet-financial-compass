import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Settings,
  Package,
  TrendingUp,
  Receipt,
  FileText,
  BarChart3,
  Calculator,
  AlertTriangle,
  Download,
  FileSearch,
  Briefcase,
  PieChart,
  Wallet,
  Activity,
  RefreshCw,
  FileSpreadsheet,
  Target,
  Search,
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

interface CommandItem {
  id: string;
  name: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  category: 'navigation' | 'actions' | 'analysis';
  shortcut?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { iniciarSimulacion, limpiarTodo, simulacionActiva } = useSimuladorStore();

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const handleAction = useCallback((action: () => void) => {
    action();
    setOpen(false);
  }, []);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      name: 'Dashboard',
      description: 'Vista general de KPIs',
      icon: LayoutDashboard,
      action: () => handleNavigation('/dashboard'),
      keywords: ['inicio', 'home', 'overview', 'kpis'],
      category: 'navigation',
      shortcut: '⌘D',
    },
    {
      id: 'nav-config',
      name: 'Configuración',
      description: 'Parámetros del modelo',
      icon: Settings,
      action: () => handleNavigation('/'),
      keywords: ['settings', 'parametros', 'setup'],
      category: 'navigation',
    },
    {
      id: 'nav-catalogo',
      name: 'Catálogo SKU',
      description: 'Productos y servicios',
      icon: Package,
      action: () => handleNavigation('/catalogo'),
      keywords: ['productos', 'sku', 'servicios'],
      category: 'navigation',
    },
    {
      id: 'nav-ingresos',
      name: 'Ingresos',
      description: 'Proyección de ingresos',
      icon: TrendingUp,
      action: () => handleNavigation('/ingresos'),
      keywords: ['revenue', 'ventas', 'gmv'],
      category: 'navigation',
    },
    {
      id: 'nav-costos',
      name: 'Costos',
      description: 'COGS y OPEX',
      icon: Receipt,
      action: () => handleNavigation('/costos'),
      keywords: ['gastos', 'expenses', 'cogs', 'opex'],
      category: 'navigation',
    },
    {
      id: 'nav-estados',
      name: 'Estados Financieros',
      description: 'P&L, Balance, Flujo de Caja',
      icon: FileText,
      action: () => handleNavigation('/estados-financieros'),
      keywords: ['pyl', 'balance', 'cashflow', 'financials'],
      category: 'navigation',
      shortcut: '⌘E',
    },
    {
      id: 'nav-kpis',
      name: 'KPIs',
      description: 'Métricas clave',
      icon: BarChart3,
      action: () => handleNavigation('/kpis'),
      keywords: ['metricas', 'indicadores'],
      category: 'navigation',
    },
    {
      id: 'nav-tributario',
      name: 'Tributario',
      description: 'Impuestos Colombia',
      icon: Calculator,
      action: () => handleNavigation('/tributario'),
      keywords: ['impuestos', 'renta', 'iva', 'tax'],
      category: 'navigation',
    },
    {
      id: 'nav-alertas',
      name: 'Alertas',
      description: 'Alertas del sistema',
      icon: AlertTriangle,
      action: () => handleNavigation('/alertas'),
      keywords: ['warnings', 'notifications'],
      category: 'navigation',
    },
    {
      id: 'nav-diagnostico',
      name: 'Diagnóstico Financiero',
      description: 'Auditoría del modelo',
      icon: FileSearch,
      action: () => handleNavigation('/diagnostico'),
      keywords: ['auditoria', 'revision', 'check'],
      category: 'navigation',
    },
    
    // Investment Analysis
    {
      id: 'nav-investor',
      name: 'Investor One-Pager',
      description: 'Deck para inversionistas',
      icon: Briefcase,
      action: () => handleNavigation('/investor'),
      keywords: ['vc', 'pitch', 'deck', 'fundraising'],
      category: 'analysis',
    },
    {
      id: 'nav-unit-economics',
      name: 'Unit Economics',
      description: 'LTV, CAC, Cohortes',
      icon: PieChart,
      action: () => handleNavigation('/unit-economics'),
      keywords: ['ltv', 'cac', 'cohorts', 'retention'],
      category: 'analysis',
    },
    {
      id: 'nav-valuation',
      name: 'Valoración',
      description: 'DCF y Cap Table',
      icon: Wallet,
      action: () => handleNavigation('/valuation'),
      keywords: ['dcf', 'wacc', 'captable', 'equity'],
      category: 'analysis',
    },
    {
      id: 'nav-sensitivity',
      name: 'Análisis de Sensibilidad',
      description: 'Escenarios y Monte Carlo',
      icon: Activity,
      action: () => handleNavigation('/sensitivity'),
      keywords: ['scenarios', 'montecarlo', 'stress'],
      category: 'analysis',
    },

    // Actions
    {
      id: 'action-recalcular',
      name: 'Recalcular Modelo',
      description: 'Recalcular todas las proyecciones',
      icon: RefreshCw,
      action: () => handleAction(() => {
        iniciarSimulacion();
      }),
      keywords: ['refresh', 'update', 'compute'],
      category: 'actions',
      shortcut: '⌘R',
    },
    {
      id: 'action-exportar',
      name: 'Exportar a Excel',
      description: 'Descargar modelo completo',
      icon: FileSpreadsheet,
      action: () => handleNavigation('/exportar'),
      keywords: ['download', 'xlsx', 'spreadsheet'],
      category: 'actions',
      shortcut: '⌘S',
    },
    {
      id: 'action-reset',
      name: 'Reiniciar Modelo',
      description: 'Volver a valores por defecto',
      icon: Target,
      action: () => handleAction(() => {
        if (window.confirm('¿Estás seguro de reiniciar el modelo? Se perderán todos los cambios.')) {
          limpiarTodo();
        }
      }),
      keywords: ['clear', 'default', 'nuevo'],
      category: 'actions',
    },
  ], [handleNavigation, handleAction, iniciarSimulacion, limpiarTodo]);

  const navigationCommands = commands.filter(c => c.category === 'navigation');
  const analysisCommands = commands.filter(c => c.category === 'analysis');
  const actionCommands = commands.filter(c => c.category === 'actions');

  return (
    <>
      {/* Keyboard hint button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs text-sidebar-muted hover:text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent rounded-lg transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar...</span>
        <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-sidebar-accent rounded font-mono">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar páginas, acciones..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          
          <CommandGroup heading="Navegación">
            {navigationCommands.map((command) => (
              <CommandItem
                key={command.id}
                value={`${command.name} ${command.keywords?.join(' ')}`}
                onSelect={command.action}
                className="flex items-center gap-3"
              >
                <command.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{command.name}</p>
                  {command.description && (
                    <p className="text-xs text-muted-foreground">{command.description}</p>
                  )}
                </div>
                {command.shortcut && (
                  <kbd className="ml-auto text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {command.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Análisis de Inversión">
            {analysisCommands.map((command) => (
              <CommandItem
                key={command.id}
                value={`${command.name} ${command.keywords?.join(' ')}`}
                onSelect={command.action}
                className="flex items-center gap-3"
              >
                <command.icon className="h-4 w-4 text-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{command.name}</p>
                  {command.description && (
                    <p className="text-xs text-muted-foreground">{command.description}</p>
                  )}
                </div>
                {command.shortcut && (
                  <kbd className="ml-auto text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {command.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Acciones">
            {actionCommands.map((command) => (
              <CommandItem
                key={command.id}
                value={`${command.name} ${command.keywords?.join(' ')}`}
                onSelect={command.action}
                className="flex items-center gap-3"
              >
                <command.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{command.name}</p>
                  {command.description && (
                    <p className="text-xs text-muted-foreground">{command.description}</p>
                  )}
                </div>
                {command.shortcut && (
                  <kbd className="ml-auto text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                    {command.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
