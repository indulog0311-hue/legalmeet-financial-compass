import { forwardRef, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/formatters";

type Mode = "integer" | "currency";

interface FormattedNumberInputProps {
  value: number;
  onValueChange: (nextValue: number) => void;
  mode?: Mode;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  autoFocus?: boolean;
  inputClassName?: string;
}

/**
 * Input numérico con formato de miles (sin decimales).
 * - En foco: muestra valor "crudo" (solo dígitos) para facilitar edición.
 * - Sin foco: muestra valor formateado (miles es-CO).
 */
const FormattedNumberInput = forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  function FormattedNumberInput(
    {
      value,
      onValueChange,
      mode = "currency",
      className,
      placeholder,
      disabled,
      id,
      name,
      autoFocus,
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const [raw, setRaw] = useState<string>(String(Math.max(0, Math.floor(value || 0))));

    useEffect(() => {
      if (isFocused) return;
      setRaw(String(Math.max(0, Math.floor(value || 0))));
    }, [value, isFocused]);

    const formatted = useMemo(() => {
      const safe = Math.max(0, Math.floor(value || 0));
      return formatNumber(safe);
    }, [value]);

    const handleChange = (next: string) => {
      const onlyDigits = next.replace(/\D/g, "");
      setRaw(onlyDigits);

      const parsed = onlyDigits === "" ? 0 : parseInt(onlyDigits, 10);
      onValueChange(Number.isFinite(parsed) ? parsed : 0);
    };

    return (
      <Input
        ref={ref}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        value={isFocused ? raw : formatted}
        onFocus={() => {
          setIsFocused(true);
          setRaw(String(Math.max(0, Math.floor(value || 0))));
        }}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(className)}
        aria-label={mode === "currency" ? "Valor monetario" : "Cantidad"}
      />
    );
  }
);

FormattedNumberInput.displayName = "FormattedNumberInput";

export { FormattedNumberInput };
export type { FormattedNumberInputProps };
