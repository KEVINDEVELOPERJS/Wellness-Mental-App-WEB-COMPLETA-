import type { LucideIcon } from 'lucide-react';

/**
 * Identificadores únicos de cada mini-juego disponible en la app.
 * Este string es el mismo que se pasa como `gameType` a `onGameComplete`
 * y como clave de mapeo hacia el `tipoActividad` del backend.
 */
export type GameId =
  | 'calma-match'
  | 'puzzle'
  | 'arte'
  | 'ritmo'
  | 'jardin'
  | 'respira'
  | 'pop'
  | 'flujo'
  | 'memo'
  | 'ordena'
  | 'mente-guerrera';

/**
 * Tipo de actividad gamificada que el backend espera (prefijo `JUEGO_`).
 */
export type GameActivityType =
  | 'JUEGO_CALMA_MATCH'
  | 'JUEGO_PUZZLE_ZEN'
  | 'JUEGO_ARTE_EMOCIONAL'
  | 'JUEGO_RITMO_CALMA'
  | 'JUEGO_JARDIN_MENTAL'
  | 'JUEGO_RESPIRA_ZEN'
  | 'JUEGO_POP_ESTRES'
  | 'JUEGO_FLUJO_ZEN'
  | 'JUEGO_MEMO_SERENO'
  | 'JUEGO_ORDENA_ZEN'
  | 'JUEGO_MENTE_GUERRERA';

/**
 * Tipo de elemento de la cuadrícula de juegos de la página principal.
 */
export interface GameDefinition {
  id: GameId;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  /** Si es `boolean`, siempre disponible (o bloqueado). Si es función, evalúa el desbloqueo. */
  unlocked: boolean | ((nivel?: number) => boolean);
}

/**
 * Firma del callback de finalización de partida que todos los juegos invocan.
 * El `score` es la puntuación interna del juego; los puntos ganados en la app
 * se calculan como `Math.floor(score / 10)`.
 */
export type GameCompleteHandler = (
  score: number,
  combo: number,
  gameType?: string,
  duration?: number
) => void;

/**
 * Mapa de `GameId` -> `GameActivityType`. Debe mantenerse sincronizado con el
 * `gameTypeMap` del backend (`LogroRepository.otorgarPuntos`).
 */
export const GAME_ID_TO_ACTIVITY: Record<GameId, GameActivityType> = {
  'calma-match': 'JUEGO_CALMA_MATCH',
  puzzle: 'JUEGO_PUZZLE_ZEN',
  arte: 'JUEGO_ARTE_EMOCIONAL',
  ritmo: 'JUEGO_RITMO_CALMA',
  jardin: 'JUEGO_JARDIN_MENTAL',
  respira: 'JUEGO_RESPIRA_ZEN',
  pop: 'JUEGO_POP_ESTRES',
  flujo: 'JUEGO_FLUJO_ZEN',
  memo: 'JUEGO_MEMO_SERENO',
  ordena: 'JUEGO_ORDENA_ZEN',
  'mente-guerrera': 'JUEGO_MENTE_GUERRERA',
};

/**
 * Convierte un `gameType` recibido desde un componente de juego (de tipo
 * `string` para compatibilidad) a un `GameActivityType` válido de backend.
 * Devuelve un valor por defecto si no se reconoce.
 */
export function resolveActivityType(gameType?: string): GameActivityType {
  if (!gameType) return 'JUEGO_CALMA_MATCH';
  const normalized = gameType as GameId;
  return GAME_ID_TO_ACTIVITY[normalized] ?? 'JUEGO_CALMA_MATCH';
}
