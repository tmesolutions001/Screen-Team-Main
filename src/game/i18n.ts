import { useSettings } from '@/lib/settings';
import type { Lang } from './books';
import type { GameMode } from './engine';

/**
 * Every piece of simulator text (menu, rounds, results), in English
 * and Spanish. Only the simulator follows the language setting; the app home
 * and the Song Formatter stay in English.
 */
export interface SimText {
  langName: string;
  languageToggle: string;
  modes: Record<GameMode, string>;
  menu: {
    title: string;
    subtitle: string;
    back: string;
    start: (mode: string) => string;
    descriptions: Record<GameMode, string>;
  };
  round: {
    mode: string;
    timeLeft: string;
    score: string;
    quit: string;
    progress: string;
    listen: string;
    answer: string;
    accuracy: (n: number) => string;
    enter: string;
    space: string;
    toSubmit: string;
    or: string;
  };
  results: {
    roundComplete: string;
    perfect: string;
    noAnswers: string;
    accuracy: string;
    correct: string;
    missed: string;
    missedSection: string;
    prompt: string;
    youTyped: string;
    issue: string;
    allCorrect: (n: number) => string;
    noneAnswered: string;
    modes: string;
    playAgain: string;
    home: string;
    fastest: string;
    whyWrong: string;
  };
}

export const SIM_TEXT: Record<Lang, SimText> = {
  en: {
    langName: 'English',
    languageToggle: 'Simulator language: English. Switch to Spanish',
    modes: { classic: 'Classic', 'chapter-verse': 'Chapter–Verse', book: 'Book', warmup: 'Warm Up' },
    menu: {
      title: 'Simulator',
      subtitle: 'Sixty seconds. Listen, then type the reference.',
      back: 'Back to Screen Team App',
      start: (mode) => `Start ${mode} mode`,
      descriptions: {
        classic: 'Book, chapter and verse.',
        'chapter-verse': 'Chapter and verse numbers only. Warm up on the numberpad.',
        book: 'Book names only.',
        warmup: 'Chapter–Verse, Book, then Classic, with a countdown before each.',
      },
    },
    round: {
      mode: 'Mode',
      timeLeft: 'Time left',
      score: 'Score',
      quit: 'Quit round',
      progress: 'Round progress',
      listen: 'Listen · type the reference',
      answer: 'Type the answer for the prompt',
      accuracy: (n) => `${n}% accuracy`,
      enter: 'Enter',
      space: 'Space',
      toSubmit: 'to submit',
      or: 'or',
    },
    results: {
      roundComplete: 'Round complete',
      perfect: 'Perfect round',
      noAnswers: 'No answers',
      accuracy: 'Accuracy',
      correct: 'Correct',
      missed: 'Missed',
      missedSection: 'What you missed',
      prompt: 'Prompt',
      youTyped: 'You typed',
      issue: 'Issue',
      allCorrect: (n) => `Every prompt answered correctly — ${n} for ${n}.`,
      noneAnswered: 'No prompts were answered this round.',
      modes: 'Modes',
      playAgain: 'Play again',
      home: 'Back to Screen Team App',
      fastest: 'Fastest',
      whyWrong: 'Why this was marked wrong',
    },
  },
  es: {
    langName: 'Español',
    languageToggle: 'Idioma del simulador: español. Cambiar a inglés',
    modes: { classic: 'Clásico', 'chapter-verse': 'Capítulo–Versículo', book: 'Libro', warmup: 'Calentamiento' },
    menu: {
      title: 'Simulador',
      subtitle: 'Sesenta segundos. Escucha y luego escribe la referencia.',
      back: 'Volver a Screen Team App',
      start: (mode) => `Empezar el modo ${mode}`,
      descriptions: {
        classic: 'Libro, capítulo y versículo.',
        'chapter-verse': 'Solo números de capítulo y versículo. Calienta con el teclado numérico.',
        book: 'Solo nombres de libros.',
        warmup: 'Capítulo–Versículo, Libro y luego Clásico, con una cuenta regresiva antes de cada uno.',
      },
    },
    round: {
      mode: 'Modo',
      timeLeft: 'Tiempo',
      score: 'Puntos',
      quit: 'Salir de la ronda',
      progress: 'Progreso de la ronda',
      listen: 'Escucha · escribe la referencia',
      answer: 'Escribe la respuesta a la referencia',
      accuracy: (n) => `${n}% de precisión`,
      enter: 'Enter',
      space: 'Espacio',
      toSubmit: 'para enviar',
      or: 'o',
    },
    results: {
      roundComplete: 'Ronda terminada',
      perfect: 'Ronda perfecta',
      noAnswers: 'Sin respuestas',
      accuracy: 'Precisión',
      correct: 'Correctas',
      missed: 'Falladas',
      missedSection: 'Lo que fallaste',
      prompt: 'Referencia',
      youTyped: 'Escribiste',
      issue: 'Problema',
      allCorrect: (n) => `Todas las referencias correctas: ${n} de ${n}.`,
      noneAnswered: 'No respondiste ninguna referencia en esta ronda.',
      modes: 'Modos',
      playAgain: 'Jugar de nuevo',
      home: 'Volver a Screen Team App',
      fastest: 'Lo más rápido',
      whyWrong: 'Por qué se marcó como incorrecta',
    },
  },
};

/** The simulator's language and its text, from the saved setting. */
export const useSimText = (): { lang: Lang; t: SimText } => {
  const { simLang } = useSettings();
  return { lang: simLang, t: SIM_TEXT[simLang] };
};
