/**
 * Chunk text into smaller fragments for batch processing
 * @param text The source text
 * @param maxSize Maximum characters per chunk
 */
export function chunkText(text: string, maxSize: number = 4000): string[] {
    const chunks: string[] = [];
    let currentPos = 0;

    while (currentPos < text.length) {
        // Find the best split point (last newline before maxSize if possible)
        let endPos = currentPos + maxSize;
        if (endPos > text.length) endPos = text.length;

        // Try to split at a newline to maintain Markdown integrity
        if (endPos < text.length) {
            const lastNewline = text.lastIndexOf("\n", endPos);
            if (lastNewline > currentPos) {
                endPos = lastNewline;
            }
        }

        chunks.push(text.slice(currentPos, endPos).trim());
        currentPos = endPos;
    }

    return chunks;
}
