/**
 * SMS parts calculator.
 *
 * GSM-7 encoding: 160 chars per part (153 for multi-part)
 * Unicode encoding: 70 chars per part (67 for multi-part)
 */

// Matches only GSM-7 basic characters
const GSM_7_REGEX = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\\[~\]|€]*$/

export type SmsPartsInfo = {
  characters: number
  parts: number
  encoding: "GSM-7" | "Unicode"
  perPart: number
}

export function calculateSmsParts(message: string): SmsPartsInfo {
  if (!message) {
    return { characters: 0, parts: 0, encoding: "GSM-7", perPart: 160 }
  }

  const isGsm7 = GSM_7_REGEX.test(message)
  const characters = message.length

  if (isGsm7) {
    const parts = characters <= 160 ? 1 : Math.ceil(characters / 153)
    return {
      characters,
      parts: characters === 0 ? 0 : parts,
      encoding: "GSM-7",
      perPart: characters <= 160 ? 160 : 153,
    }
  }

  const parts = characters <= 70 ? 1 : Math.ceil(characters / 67)
  return {
    characters,
    parts: characters === 0 ? 0 : parts,
    encoding: "Unicode",
    perPart: characters <= 70 ? 70 : 67,
  }
}