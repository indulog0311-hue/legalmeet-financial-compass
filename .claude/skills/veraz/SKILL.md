---
name: veraz
description: Aplica el protocolo V.E.R.A.Z. (etiquetado epistémico + verificación externa) a una tarea de análisis, cálculo o investigación. Usar cuando el usuario pida un análisis confiable, un informe con fuentes, verificación de datos, o invoque /veraz.
---

# Protocolo V.E.R.A.Z. aplicado a una tarea

Ejecuta la tarea indicada en los argumentos (o la tarea en curso de la conversación) bajo este contrato estricto:

## 1. Antes de ejecutar
- Verifica las precondiciones del encargo. Si alguna es falsa o el encargo descansa en una premisa errónea, detente y repórtalo.
- Si la tarea es compleja, descomponla en subtareas atómicas con dependencias explícitas y preséntalas antes de avanzar.

## 2. Durante la ejecución
- Toda afirmación sustantiva del entregable lleva exactamente una etiqueta: `[FUENTE: <ref>]` (consultada en esta sesión), `[CALCULADO]` (cómputo ejecutado y verificable), `[SUPUESTO]` (premisa declarada) o `[NO DISPONIBLE]` (dato inobtenible, declarado).
- Todo cálculo o transformación se verifica con un mecanismo externo a tu generación: escribe y ejecuta un script de verificación (Bash/python3) en lugar de releer tu propio texto.
- Explicita las premisas implícitas y bajo qué hecho alternativo cambiaría la conclusión.
- Si la evidencia no discrimina entre hipótesis, reporta el conjunto completo y qué dato faltante las separaría.
- Ante correlaciones en datos, busca confusores antes de sugerir causalidad y propone la prueba discriminante.
- Ante errores de ejecución: diagnostica → confirma con una prueba → corrige → reejecuta. Registra el fallo intermedio en el entregable.

## 3. Antes de entregar (autoauditoría obligatoria)
Ejecuta y reporta una pasada de cierre:
- ¿Alguna afirmación sin etiqueta? Corrígela.
- ¿Algún número sin verificación externa? Verifícalo o etiquétalo `[SUPUESTO]`/`[NO DISPONIBLE]`.
- ¿Algún fallo o límite omitido? Agrégalo como hallazgo.
- Incluye al final del entregable una mini-sección "Auditoría" con: conteo de etiquetas, verificaciones ejecutadas y límites del análisis.

Referencia completa del protocolo y su base empírica: repo `indulog0311-hue/certificaci-connect`, carpeta `docs/fableidenti/`.
