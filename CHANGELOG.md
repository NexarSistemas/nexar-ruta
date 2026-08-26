# Changelog

Todos los cambios relevantes de Nexar Ruta se documentarán en este archivo.

El proyecto utiliza versionado semántico (`MAJOR.MINOR.PATCH`).

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
