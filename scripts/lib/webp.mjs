import { createHash } from 'node:crypto';

/**
 * The facts of a WebP file the media work needs, read from the bytes: its
 * pixel size (lossy VP8, lossless VP8L and extended VP8X containers), its
 * SHA-256 and EmDash's content hash of the same bytes (`sha1:<hex>`, the key
 * the Media Library deduplicates on). Shared by the approved-captures
 * recorder, the media script and the content tests.
 */
export function webpDimensions(bytes) {
  const buffer = Buffer.from(bytes);
  if (buffer.length < 30 || buffer.toString('latin1', 0, 4) !== 'RIFF' || buffer.toString('latin1', 8, 12) !== 'WEBP') throw new Error('not a WebP file');
  const chunk = buffer.toString('latin1', 12, 16);
  if (chunk === 'VP8 ') {
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) throw new Error('VP8 start code missing');
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') {
    return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  }
  throw new Error(`unknown WebP chunk ${JSON.stringify(chunk)}`);
}

export function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/** EmDash's content hash: SHA-1 of the bytes, prefixed `sha1:`. */
export function emdashContentHash(bytes) {
  return `sha1:${createHash('sha1').update(bytes).digest('hex')}`;
}

export function webpFacts(bytes) {
  return { ...webpDimensions(bytes), size: bytes.length, sha256: sha256Hex(bytes), contentHash: emdashContentHash(bytes) };
}
