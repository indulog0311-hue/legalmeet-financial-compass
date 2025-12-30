import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Loader2, User, Building2, Mail, Lock, Save, Cloud } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
  company: z.string().trim().max(100, 'Máximo 100 caracteres').optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

interface Profile {
  id: string;
  full_name: string | null;
  company: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default function Perfil() {
  const { user } = useAuth();
  const { enableAutoSave, setEnableAutoSave } = useProject();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load profile
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile(data);
          setAvatarUrl(data.avatar_url);
          setFullName(data.full_name || '');
          setCompany(data.company || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        toast.error('Error al cargar perfil');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const getInitials = () => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.substring(0, 2).toUpperCase() || '??';
  };

  const handleSaveProfile = async () => {
    setErrors({});
    
    const validation = profileSchema.safeParse({ full_name: fullName, company });
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          company: company.trim() || null,
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast.success('Perfil actualizado');
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Error al guardar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setErrors({});
    
    const validation = passwordSchema.safeParse({ 
      currentPassword, 
      newPassword, 
      confirmPassword 
    });
    
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    try {
      setIsChangingPassword(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada');
    } catch (err: any) {
      console.error('Error changing password:', err);
      toast.error(err.message || 'Error al cambiar contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perfil de Usuario</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Actualiza tu nombre y datos de contacto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          {user && (
            <AvatarUpload
              userId={user.id}
              currentAvatarUrl={avatarUrl}
              fallback={getInitials()}
              onAvatarChange={setAvatarUrl}
            />
          )}

          <Separator />

          {/* Form fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre completo
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
                maxLength={100}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo electrónico
              </Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                El correo no se puede cambiar
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
              </Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Nombre de tu empresa"
                maxLength={100}
              />
              {errors.company && (
                <p className="text-sm text-destructive">{errors.company}</p>
              )}
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Preferencias de Sincronización
          </CardTitle>
          <CardDescription>
            Configura cómo se guardan tus datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSave">Auto-guardado</Label>
              <p className="text-sm text-muted-foreground">
                Guardar cambios automáticamente cada 30 segundos
              </p>
            </div>
            <Switch
              id="autoSave"
              checked={enableAutoSave}
              onCheckedChange={setEnableAutoSave}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>
            Cambia tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive">{errors.newPassword}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={isChangingPassword || !newPassword || !confirmPassword}
            variant="outline"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cambiando...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Cambiar contraseña
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
