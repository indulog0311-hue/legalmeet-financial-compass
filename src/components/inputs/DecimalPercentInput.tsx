import { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DecimalPercentInputProps {
  value: number;
  onValueChange: (nextValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

/**
 * Input para porcentajes decimales (0-100).
 * - Acepta coma (,) o punto (.) como separador decimal.
 * - Valida rango configurable (default 0-100).
 * - En foco: edición libre; al salir: formatea y valida.
 */
const DecimalPercentInput = forwardRef<HTMLInputElement, DecimalPercentInputProps>(
  function DecimalPercentInput(
    {
      value,
      onValueChange,
      min = 0,
      max = 100,
      className,
      placeholder,
      disabled,
      id,
      name,
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const [raw, setRaw] = useState<string>(formatDisplay(value));

    // Sincronizar cuando cambia el value externo (y no está en foco)
    useEffect(() => {
      if (!isFocused) {
        setRaw(formatDisplay(value));
      }
    }, [value, isFocused]);

    function formatDisplay(val: number): string {
      // Mostrar con 1 decimal, usando punto
      return Number.isFinite(val) ? val.toFixed(1) : "0.0";
    }

    function parseInput(input: string): number {
      // Reemplazar coma por punto para parsear
      const normalized = input.replace(",", ".");
      // Permitir solo números y un punto decimal
      const cleaned = normalized.replace(/[^0-9.]/g, "");
      // Evitar múltiples puntos
      const parts = cleaned.split(".");
      const sanitized = parts.length > 2 
        ? parts[0] + "." + parts.slice(1).join("")
        : cleaned;
      
      const parsed = parseFloat(sanitized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function clamp(val: number): number {
      return Math.min(max, Math.max(min, val));
    }

    const handleChange = (input: string) => {
      // Permitir edición libre mientras escribe
      // Normalizar coma a punto para consistencia visual
      const normalized = input.replace(",", ".");
      setRaw(normalized);
    };

    const handleBlur = () => {
      setIsFocused(false);
      const parsed = parseInput(raw);
      const clamped = clamp(parsed);
      setRaw(formatDisplay(clamped));
      onValueChange(clamped);
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Seleccionar todo el texto al enfocar
      setRaw(formatDisplay(value));
    };

    // Validación visual: si está fuera de rango mientras edita
    const currentParsed = parseInput(raw);
    const isOutOfRange = isFocused && (currentParsed < min || currentParsed > max);

    return (
      <Input
        ref={ref}
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        value={raw}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          className,
          isOutOfRange && "border-destructive focus-visible:ring-destructive"
        )}
        aria-label="Valor porcentual"
        aria-invalid={isOutOfRange}
      />
    );
  }
);

DecimalPercentInput.displayName = "DecimalPercentInput";

export { DecimalPercentInput };
export type { DecimalPercentInputProps };
