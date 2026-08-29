# Changelog

Todos los cambios relevantes de Nexar Ruta se documentarán en este archivo.

El proyecto utiliza versionado semántico (`MAJOR.MINOR.PATCH`).

## [0.4.0] - 2026-08-28

### Agregado

- Banco explícito ampliado a 30 puzzles 5x5, con 10 puzzles `easy`, 10 `medium` y 10 `hard`.
- Identidad estable por puzzle y validación de duplicados y equivalencias por rotación o reflexión.
- Selector de dificultad con los modos Aleatorio, Fácil, Media y Difícil.
- Indicador discreto de la dificultad real del puzzle presentado.
- Persistencia independiente de ciclo, puzzle y sesión para cada modo.
- Restauración del recorrido, tiempo y estado al volver a un modo o recargar la página.

### Cambiado

- Los récords y el ciclo Aleatorio se migran desde la persistencia de v0.3.0; los récords pasan a asociarse con la identidad única del puzzle.
- La selección sin repetición opera sobre los 30 puzzles en Aleatorio y sobre los 10 del nivel elegido en los demás modos.
- La dificultad usa un criterio explícito basado en cantidad y distribución de checkpoints, longitud de tramos y recorrido.
- La suite cubre distribución del banco, validez, variedad, ciclos independientes, transiciones, persistencia, datos corruptos, cambios de dificultad, récords y regresiones de v0.3.0.

## [0.3.0] - 2026-08-28

### Agregado

- Banco explícito de 20 puzzles 5x5 con solución conocida y checkpoints ordenados.
- Validación programática del banco: tamaño, índices, unicidad, adyacencia ortogonal y orden de checkpoints.
- Selección aleatoria sin repetición durante cada ciclo de 20 puzzles, persistida localmente.
- Inicio automático de un ciclo nuevo al agotar el banco, sin repetir de inmediato el último puzzle del ciclo anterior.
- Récord local individual por puzzle, con puntaje, tiempo, movimientos y pistas.

### Cambiado

- El indicador discreto de ciclo muestra el avance como `Puzzle N de 20`.
- La acción `Nueva partida` es la única que selecciona otro puzzle; reinicio, pausa y deshacer conservan el actual.

## [0.2.0] - 2026-08-26

### Agregado

- Inicio explícito de la partida con estados visibles de lista, activa, pausada y terminada.
- Cronómetro con inicio en `00:00`, pausa manual y pausa automática al perder foco.
- Interacción por clic y arrastre sobre casillas adyacentes válidas.
- Panel de partida con tiempo, movimientos, puntaje y récord local.
- Sistema de pistas determinista apoyado en la solución conocida de cada tablero.
- Puntaje final congelado al completar la partida.
- Persistencia del mejor resultado con `localStorage`.

### Cambiado

- El contador de movimientos ahora refleja la cantidad de casillas válidas actualmente recorridas.
- Reiniciar una partida restablece recorrido, tiempo, movimientos, pistas, puntaje y estado sin borrar el récord histórico.
- La documentación de controles incorpora inicio explícito, arrastre y fórmula de puntaje.

## [0.1.0] - 2026-08-26

### Agregado

- MVP inicial de Nexar Ruta.
- Tablero 5x5 responsive.
- Tres puzzles con solución garantizada.
- Recorrido por casillas adyacentes.
- Checkpoints que deben visitarse en orden.
- Validación para impedir repetir casillas.
- Contador de movimientos.
- Acciones para deshacer, reiniciar y cargar otro tablero.
- Mensajes de estado y validación durante la partida.
- Estructura estática compatible con alojamiento sin backend.
