import React, { useState, lazy, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, TrendingUp, Receipt, 
  FileText, BarChart3, Calculator, AlertTriangle, 
  Download, Settings, ChevronLeft, Menu, FileSearch, Briefcase,
  PieChart, Wallet, Activity, ChevronDown, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Lazy load CommandPalette to avoid initialization issues
const CommandPalette = lazy(() => import('./CommandPalette').then(mod => ({ default: mod.CommandPalette })));

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'default' | 'accent' | 'warning' | 'success';
}

interface NavGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Flat navigation items (no children)
const mainNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Configuración', href: '/', icon: Settings, badge: 'INICIO', badgeVariant: 'success' },
];

// Grouped navigation
const navGroups: NavGroup[] = [
  {
    name: 'Estados Financieros',
    icon: FileText,
    defaultOpen: true,
    items: [
      { name: 'P&L (Resultados)', href: '/estados-financieros', icon: FileText },
      { name: '3-Statement Model', href: '/three-statements', icon: FileText, badge: 'NEW', badgeVariant: 'accent' },
      { name: 'Ingresos', href: '/ingresos', icon: TrendingUp },
      { name: 'Costos & OPEX', href: '/costos', icon: Receipt },
      { name: 'Tributario', href: '/tributario', icon: Calculator },
    ],
  },
  {
    name: 'Unit Economics',
    icon: PieChart,
    items: [
      { name: 'Cohortes & LTV', href: '/unit-economics', icon: PieChart, badge: 'VC', badgeVariant: 'accent' },
      { name: 'KPIs SaaS', href: '/kpis', icon: BarChart3 },
    ],
  },
  {
    name: 'Análisis de Riesgo',
    icon: Activity,
    items: [
      { name: 'Sensibilidad', href: '/sensitivity', icon: Activity, badge: 'PRO', badgeVariant: 'accent' },
      { name: 'Valoración DCF', href: '/valuation', icon: Wallet, badge: 'VC', badgeVariant: 'accent' },
    ],
  },
  {
    name: 'Investor Relations',
    icon: Briefcase,
    items: [
      { name: 'One-Pager', href: '/investor', icon: Briefcase, badge: 'VC', badgeVariant: 'warning' },
      { name: 'Diagnóstico', href: '/diagnostico', icon: FileSearch },
    ],
  },
];

// Footer navigation
const footerNavigation: NavItem[] = [
  { name: 'Catálogo SKU', href: '/catalogo', icon: Package },
  { name: 'Alertas', href: '/alertas', icon: AlertTriangle },
  { name: 'Exportar', href: '/exportar', icon: Download },
];

function NavItemComponent({ 
  item, 
  isActive, 
  collapsed,
  onClick 
}: { 
  item: NavItem; 
  isActive: boolean; 
  collapsed: boolean;
  onClick?: () => void;
}) {
  const badgeColors = {
    default: 'bg-sidebar-muted/50 text-sidebar-muted',
    accent: 'bg-accent text-accent-foreground',
    warning: 'bg-warning text-warning-foreground',
    success: 'bg-success text-success-foreground',
  };

  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'nav-item group',
        isActive
          ? 'nav-active'
          : 'nav-item-default'
      )}
    >
      <item.icon className={cn(
        'h-4 w-4 flex-shrink-0 transition-colors',
        isActive ? 'text-sidebar-primary' : 'text-sidebar-muted group-hover:text-sidebar-foreground'
      )} />
      
      <span className={cn('truncate flex-1', collapsed && 'lg:hidden')}>
        {item.name}
      </span>
      
      {item.badge && !collapsed && (
        <span className={cn(
          'ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide',
          badgeColors[item.badgeVariant || 'default']
        )}>
          {item.badge}
        </span>
      )}
      
      {isActive && !collapsed && (
        <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary ml-2" />
      )}
    </Link>
  );
}

function NavGroupComponent({ 
  group, 
  collapsed,
  onItemClick 
}: { 
  group: NavGroup; 
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  const location = useLocation();
  const hasActiveChild = group.items.some(item => location.pathname === item.href);
  const [isOpen, setIsOpen] = useState(group.defaultOpen || hasActiveChild);

  return (
    <Collapsible open={isOpen && !collapsed} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'nav-item w-full justify-between',
            hasActiveChild ? 'text-sidebar-foreground' : 'nav-item-default'
          )}
        >
          <div className="flex items-center gap-3">
            <group.icon className={cn(
              'h-4 w-4 flex-shrink-0',
              hasActiveChild ? 'text-sidebar-primary' : 'text-sidebar-muted'
            )} />
            <span className={cn('truncate', collapsed && 'lg:hidden')}>
              {group.name}
            </span>
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 text-sidebar-muted transition-transform duration-200',
            isOpen && 'rotate-180',
            collapsed && 'lg:hidden'
          )} />
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pl-4 space-y-0.5 mt-1">
        {group.items.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            isActive={location.pathname === item.href}
            collapsed={collapsed}
            onClick={onItemClick}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  const handleMobileClose = () => {
    if (window.innerWidth < 1024) {
      setCollapsed(true);
    }
  };
  
  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar transition-all duration-300",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "w-72"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <div className={cn("flex items-center gap-3", collapsed && "lg:hidden")}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
              <span className="text-accent-foreground font-bold text-sm">LM</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
                LegalMeet Analytics
              </span>
              <span className="text-[10px] text-sidebar-muted uppercase tracking-widest">
                Modelo Financiero V6
              </span>
            </div>
          </div>
          
          {/* Collapse button - desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Command Palette Trigger */}
        <div className={cn("px-3 py-3 border-b border-sidebar-border", collapsed && "lg:hidden")}>
          <Suspense fallback={
            <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-sidebar-muted bg-sidebar-accent/50 rounded-lg w-full">
              <Search className="h-3.5 w-3.5" />
              <span>Buscar...</span>
              <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-sidebar-accent rounded font-mono">⌘K</kbd>
            </button>
          }>
            <CommandPalette />
          </Suspense>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {/* Main flat navigation */}
          {mainNavigation.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isActive={location.pathname === item.href}
              collapsed={collapsed}
              onClick={handleMobileClose}
            />
          ))}

          {/* Separator */}
          <div className="h-px bg-sidebar-border my-3" />

          {/* Grouped navigation */}
          <div className="space-y-2">
            {navGroups.map((group) => (
              <NavGroupComponent
                key={group.name}
                group={group}
                collapsed={collapsed}
                onItemClick={handleMobileClose}
              />
            ))}
          </div>

          {/* Footer navigation */}
          <div className="h-px bg-sidebar-border my-3" />
          
          {footerNavigation.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isActive={location.pathname === item.href}
              collapsed={collapsed}
              onClick={handleMobileClose}
            />
          ))}
        </nav>

        {/* Footer Info */}
        <div className={cn(
          "p-4 border-t border-sidebar-border",
          collapsed && "lg:px-2"
        )}>
          <div className={cn(
            "p-3 rounded-lg bg-sidebar-accent/30",
            collapsed && "lg:hidden"
          )}>
            <p className="text-[10px] text-sidebar-muted uppercase tracking-wider">Periodo de análisis</p>
            <p className="text-sm font-semibold text-sidebar-foreground">2026 - 2031</p>
            <p className="text-[10px] text-sidebar-muted mt-1">72 meses proyectados</p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
