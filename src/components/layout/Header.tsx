import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, Search, LogOut, Save, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProjectSelector } from './ProjectSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const pageTitles: Record<string, string> = {
  '/': 'Configuración',
  '/dashboard': 'Dashboard Ejecutivo',
  '/catalogo': 'Catálogo Maestro V5.0',
  '/ingresos': 'Proyección de Ingresos',
  '/costos': 'Estructura de Costos',
  '/estados-financieros': 'Estados Financieros',
  '/kpis': 'Indicadores Clave (KPIs)',
  '/tributario': 'Modelo Tributario',
  '/alertas': 'Centro de Alertas',
  '/exportar': 'Exportar Reportes',
  '/configuracion': 'Configuración',
  '/diagnostico': 'Diagnóstico Financiero',
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, simulacionActiva } = useSimuladorStore();
  const { user, signOut } = useAuth();
  const { activeProject, isSyncing, syncToDatabase, hasUnsavedChanges, lastSavedAt } = useProject();
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  
  const pageTitle = pageTitles[location.pathname] || 'LegalMeet Financiero';

  // Load user profile with avatar
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setAvatarUrl(data.avatar_url);
        setProfileName(data.full_name);
      }
    }
    
    loadProfile();
  }, [user]);

  // Get user initials
  const getInitials = () => {
    if (!user) return '??';
    const name = profileName || user.user_metadata?.full_name || '';
    const email = user.email || '';
    
    if (name) {
      const parts = name.split(' ');
      return parts.map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
    }
    
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Title & Project Selector */}
        <div className="flex items-center gap-4">
          <div className="lg:hidden w-12" /> {/* Spacer for mobile menu button */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
              <p className="text-xs text-muted-foreground">
                {activeProject?.name || 'LegalMeet Colombia S.A.S.'} | {config.añoInicio}-{config.añoFin}
              </p>
            </div>
            <div className="hidden sm:block">
              <ProjectSelector />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Save Status & Button */}
          {activeProject && (
            <div className="flex items-center gap-2">
              {/* Unsaved indicator */}
              {hasUnsavedChanges && (
                <span className="text-xs text-amber-500 hidden md:inline">
                  Cambios sin guardar
                </span>
              )}
              {!hasUnsavedChanges && lastSavedAt && (
                <span className="text-xs text-muted-foreground hidden md:inline">
                  Guardado {lastSavedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={hasUnsavedChanges ? "default" : "outline"}
                    size="sm"
                    onClick={syncToDatabase}
                    disabled={isSyncing}
                    className="gap-2"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="hidden md:inline">Guardar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasUnsavedChanges 
                    ? 'Guardar cambios ahora' 
                    : 'Auto-guardado activo cada 30s'}
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Search */}
          <div className="hidden lg:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar..."
              className="w-48 pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          {/* Simulation Status */}
          <Badge variant={simulacionActiva ? 'default' : 'secondary'} className="hidden sm:inline-flex">
            {simulacionActiva ? 'Activa' : 'Sin Simular'}
          </Badge>

          {/* Help */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profileName || user?.user_metadata?.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate('/perfil')} 
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
