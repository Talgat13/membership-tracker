/**
 * Georgian (Mkhedruli) to Latin transliteration based on the National Standard of Georgia (2002).
 */

const GEORGIAN_TO_LATIN_MAP: Record<string, string> = {
  // Standard 33 Mkhedruli letters
  'ა': 'a',
  'ბ': 'b',
  'გ': 'g',
  'დ': 'd',
  'ე': 'e',
  'ვ': 'v',
  'ზ': 'z',
  'თ': 't',
  'ი': 'i',
  'კ': 'k',
  'ლ': 'l',
  'მ': 'm',
  'ნ': 'n',
  'ო': 'o',
  'პ': 'p',
  'ჟ': 'zh',
  'რ': 'r',
  'ს': 's',
  'ტ': 't',
  'უ': 'u',
  'ფ': 'p',
  'ქ': 'k',
  'ღ': 'gh',
  'ყ': 'q',
  'შ': 'sh',
  'ჩ': 'ch',
  'ც': 'ts',
  'ძ': 'dz',
  'წ': 'ts',
  'ჭ': 'ch',
  'ხ': 'kh',
  'ჯ': 'j',
  'ჰ': 'h',

  // Capitalized Asomtavruli / Mtavruli forms
  'Ⴀ': 'A', 'Ⴁ': 'B', 'Ⴂ': 'G', 'Ⴃ': 'D', 'Ⴄ': 'E', 'Ⴅ': 'V', 'Ⴆ': 'Z',
  'Ⴇ': 'T', 'Ⴈ': 'I', 'Ⴉ': 'K', 'Ⴊ': 'L', 'Ⴋ': 'M', 'Ⴌ': 'N', 'Ⴍ': 'O',
  'Ⴎ': 'P', 'Ⴏ': 'Zh', 'Ⴐ': 'R', 'Ⴑ': 'S', 'Ⴒ': 'T', 'Ⴓ': 'U', 'Ⴔ': 'P',
  'Ⴕ': 'K', 'Ⴖ': 'Gh', 'Ⴗ': 'Q', 'Ⴘ': 'Sh', 'Ⴙ': 'Ch', 'Ⴚ': 'Ts', 'Ⴛ': 'Dz',
  'Ⴜ': 'Ts', 'Ⴝ': 'Ch', 'Ⴞ': 'Kh', 'Ⴟ': 'J', 'Ⴠ': 'H',

  // Mtavruli letters (Unicode U+1C90 to U+1CBF)
  'Ა': 'a', 'Ბ': 'b', 'Გ': 'g', 'Დ': 'd', 'Ე': 'e', 'Ვ': 'v', 'Ზ': 'z',
  'Თ': 't', 'Ი': 'i', 'Კ': 'k', 'Ლ': 'l', 'Მ': 'm', 'Ნ': 'n', 'Ო': 'o',
  'Პ': 'p', 'Ჟ': 'zh', 'Რ': 'r', 'Ს': 's', 'Ტ': 't', 'Უ': 'u', 'Ფ': 'p',
  'Ქ': 'k', 'Ღ': 'gh', 'Ყ': 'q', 'Შ': 'sh', 'Ჩ': 'ch', 'Ც': 'ts', 'Ძ': 'dz',
  'Წ': 'ts', 'Ჭ': 'ch', 'Ხ': 'kh', 'Ჯ': 'j', 'Ჰ': 'h',

  // Archaic / extended characters
  'ჱ': 'ey', 'ჲ': 'y', 'ჳ': 'wi', 'ჴ': 'q', 'ჵ': 'ho',
};

// Common Georgian business prefixes and prefixes to strip from sender names
const BUSINESS_PREFIX_REGEX = /\b(ი\/მ|ი\.მ\.|ი\/მ\.|ინდ\.?\s*მეწარმე|ინდივიდუალური\s+მეწარმე|შპს|შ\.პ\.ს\.|შპს\.|სს|ს\.ს\.|ააიპ|ა\.ა\.ი\.პ\.|llc|ltd|jsc|sole\s+proprietorship)\b/gi;

// Common payment description noise words (Fitpass, transfer, fee, etc.)
const PURPOSE_NOISE_REGEX = /\b(ჩარიცხვა|გადმომრიცხავი|ანგარიში|ბანკი|დანიშნულება|ფიტპასის|ფიტ\s*პასის|ფიტპასი|ფიტ\s*პასი|საფასური|მომსახურება|თანხის|გადარიცხვა|გადახდა|შენატანი|fitpass|fit\s+pass|membership|payment|transfer|fee|subscription|abonement)\b/gi;

/**
 * Transliterates a Georgian string (Mkhedruli) to Latin characters.
 */
export function transliterateGeorgian(text: string): string {
  if (!text) return '';
  return text
    .split('')
    .map((char) => GEORGIAN_TO_LATIN_MAP[char] ?? char)
    .join('');
}

/**
 * Normalizes text for fuzzy or exact comparison:
 * - Lowercases
 * - Converts Georgian to Latin
 * - Removes non-alphanumeric characters (keeps spaces)
 * - Collapses extra spaces and trims
 */
export function normalizeForComparison(text: string): string {
  if (!text) return '';
  const transliterated = transliterateGeorgian(text);
  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Removes business prefixes (e.g. "ი/მ", "შპს", "LLC") from a sender or payer string.
 */
export function stripBusinessPrefixes(text: string): string {
  if (!text) return '';
  return text
    .replace(BUSINESS_PREFIX_REGEX, ' ')
    .replace(/["'«»()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cleans bank description / purpose text by removing common boilerplate words.
 */
export function cleanPurposeText(text: string): string {
  if (!text) return '';
  return text
    .replace(PURPOSE_NOISE_REGEX, ' ')
    .replace(/["'«»()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits normalized text into sorted unique word tokens.
 */
export function tokenizeAndSort(text: string): string[] {
  const normalized = normalizeForComparison(text);
  if (!normalized) return [];
  return normalized
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

/**
 * Checks whether any Georgian letters exist in a string.
 */
export function containsGeorgian(text: string): boolean {
  return /[\u10A0-\u10FF\u1C90-\u1CBF]/.test(text);
}
