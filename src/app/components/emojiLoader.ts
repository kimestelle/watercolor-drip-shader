export type EmojiMapping = {
  unicode: string;
  unicodeHex: string[]; 
  docomo?: string;
  kddi?: string;
  softbank?: string;
};

export async function loadEmojis(): Promise<EmojiMapping[]> {
    const res = await fetch("/emojis.txt");
    const text = await res.text();

    const lines = text
        .split("\n")
        .filter(line => line.trim() && !line.startsWith("#"));

    const emojis: EmojiMapping[] = lines.map(line => {
        const fields = line.split(";").map(f => f.trim());

        const unicodeHex = fields[0].split(" ");
        const codePoints = unicodeHex.map(cp => parseInt(cp, 16));
        const unicode = String.fromCodePoint(...codePoints);

        return {
            unicode,
            unicodeHex,
            docomo: fields[1] || undefined,
            kddi: fields[2] || undefined,
            softbank: fields[3] || undefined,
        };
    });

    return emojis;
}

export async function getRandomEmoji(): Promise<EmojiMapping | null> {
    const emojis = await loadEmojis();
    if (emojis.length === 0) return null;
    return emojis[Math.floor(Math.random() * emojis.length)];
}
