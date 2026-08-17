/** Lista de idiomas da UI (código, nome traduzido, bandeira). */

import { translations } from '../../translations'

export type Language = {
  code: string
  name: string
  flag: string
}

/** Lista de idiomas com nomes no idioma actual (`t`); fallback pt-BR. */
export function getLanguages(t: any): Language[] {
  const ptBR = translations['pt-BR']
  return [
    { code: 'pt-BR', name: t?.languagePortuguese || ptBR?.languagePortuguese || 'Português', flag: '🇧🇷' },
    { code: 'es', name: t?.languageSpanish || ptBR?.languageSpanish || 'Espanhol', flag: '🇪🇸' },
    { code: 'fr', name: t?.languageFrench || ptBR?.languageFrench || 'Francês', flag: '🇫🇷' },
    { code: 'it', name: t?.languageItalian || ptBR?.languageItalian || 'Italiano', flag: '🇮🇹' },
    { code: 'de', name: t?.languageGerman || ptBR?.languageGerman || 'Alemão', flag: '🇩🇪' },
    {
      code: 'en',
      name:
        t?.languageEnglishUK ||
        t?.languageEnglish ||
        ptBR?.languageEnglishUK ||
        ptBR?.languageEnglish ||
        'Inglês (Reino Unido)',
      flag: '🇬🇧',
    },
    { code: 'en-US', name: t?.languageEnglishUS || ptBR?.languageEnglishUS || 'Inglês (EUA)', flag: '🇺🇸' },
  ]
}
