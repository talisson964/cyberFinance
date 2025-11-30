/**
 * Formata texto aplicando capitalização adequada
 * - Primeira letra de cada palavra em maiúscula
 * - Mantém acrônimos conhecidos em maiúsculo (CPF, CNPJ, etc.)
 * - Respeita preposições e artigos em minúsculo quando no meio da frase
 */

const ACRONYMS = ['CPF', 'CNPJ', 'RG', 'CEP', 'PIX', 'INSS', 'FGTS', 'GPS', 'USA', 'BR'];
const LOWERCASE_WORDS = ['de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'a', 'o', 'as', 'os', 'em', 'para', 'com', 'por', 'sem'];

export function capitalizeText(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Preservar espaços múltiplos usando regex ao invés de split
  return text
    .trim()
    .replace(/\S+/g, (word, offset) => {
      // Calcular se é a primeira palavra (offset 0 ou após espaços)
      const textBeforeWord = text.substring(0, offset).trim();
      const isFirstWord = textBeforeWord.length === 0;
      
      const lowerWord = word.toLowerCase();
      
      // Verificar se é um acrônimo conhecido
      const upperWord = word.toUpperCase();
      if (ACRONYMS.includes(upperWord)) {
        return upperWord;
      }

      // Verificar se é preposição/artigo (exceto no início)
      if (!isFirstWord && LOWERCASE_WORDS.includes(lowerWord)) {
        return lowerWord;
      }

      // Capitalizar primeira letra
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}

/**
 * Formata texto de descrição/nota mantendo quebras de linha
 */
export function capitalizeMultiline(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text
    .split('\n')
    .map(line => capitalizeText(line))
    .join('\n');
}

/**
 * Formata nome próprio (sem modificar preposições)
 */
export function capitalizeName(name: string): string {
  if (!name || typeof name !== 'string') return name;

  return name
    .trim()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

