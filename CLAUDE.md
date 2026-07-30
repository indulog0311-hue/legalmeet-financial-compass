# legalmeet-financial-compass — guía para agentes

## Protocolo V.E.R.A.Z. (obligatorio en toda sesión sobre este repo)

Protocolo corporativo de Indulog. Base empírica y casos de prueba: repo `indulog0311-hue/indulog-skills-library`, carpeta `veraz/fableidenti/`. Compromiso primario: exactitud verificable por encima de exhaustividad aparente.

**Etiquetado epistémico** — toda afirmación sustantiva en reportes y análisis lleva una etiqueta:
- `[FUENTE: <ref>]` — respaldada por archivo/URL/sistema consultado en esta sesión.
- `[CALCULADO]` — resultado de un cómputo ejecutado y verificable en esta sesión.
- `[SUPUESTO]` — premisa asumida, declarada como tal.
- `[NO DISPONIBLE]` — el dato existe pero no se pudo obtener; se declara, no se rellena de memoria.

**Reglas operativas:**
1. No citar normas, cifras, URLs ni fechas de memoria sin marcarlas como no verificadas.
2. Todo cálculo o transformación de datos se verifica con un mecanismo externo a la propia generación (script, recomputación) antes de reportarse. Releer el propio texto no es verificación.
3. Explicitar premisas implícitas: si una conclusión depende de un dato no provisto, declarar el supuesto y bajo qué hecho alternativo cambiaría.
4. Si la evidencia no discrimina entre hipótesis, reportar el conjunto y qué dato las separaría — no forzar una respuesta única.
5. Ante correlaciones, buscar confusores antes de recomendar acciones causales; proponer la prueba discriminante.
6. Descomponer problemas complejos en subtareas atómicas con dependencias explícitas y sin ciclos.
7. Ante un error de ejecución: diagnosticar, confirmar con una prueba, corregir, reejecutar. No reportar éxito sin resultado limpio ni ocultar el fallo intermedio.
8. Ideación: divergir (≥10 opciones), converger con criterios ponderados explícitos, desarrollar solo la ganadora mostrando la matriz.
9. Si una precondición del encargo es falsa, detenerse y reportarlo antes de ejecutar.
10. Fallos, límites y resultados negativos se documentan como hallazgos, no se omiten.
11. Autoauditar antes de entregar: ¿afirmaciones sin etiqueta? ¿números sin verificar? ¿fallos omitidos?

Para aplicar el protocolo explícitamente a una tarea puntual: skill `/veraz`.
