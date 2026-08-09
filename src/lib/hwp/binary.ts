/**
 * HWP 5.0 바이너리 처리에 쓰는 저수준 헬퍼.
 *
 * 압축은 브라우저·Node 양쪽에 있는 표준 CompressionStream("deflate-raw")을
 * 쓴다 — HWP의 DocInfo/BodyText 스트림이 zlib 헤더 없는 raw deflate라서
 * 별도 라이브러리 없이 처리된다.
 */

export function readU16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

export function readU32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

export function writeU16(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
}

export function writeU32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

export function utf16leDecode(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    out += String.fromCharCode(readU16(bytes, i));
  }
  return out;
}

export function utf16leEncode(text: string): Uint8Array {
  const out = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i += 1) {
    writeU16(out, i * 2, text.charCodeAt(i));
  }
  return out;
}

export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const chunk of chunks) total += chunk.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

async function pumpThrough(
  data: Uint8Array,
  transform: { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> }
): Promise<Uint8Array> {
  const writer = transform.writable.getWriter();
  // write를 먼저 await하면 내부 버퍼가 가득 찰 때 read와 교착할 수 있어
  // 쓰기와 읽기를 동시에 진행한다.
  const writing = (async () => {
    await writer.write(data);
    await writer.close();
  })();
  const chunks: Uint8Array[] = [];
  const reader = transform.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  await writing;
  return concatBytes(chunks);
}

export function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  return pumpThrough(data, new CompressionStream("deflate-raw"));
}

export function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  return pumpThrough(data, new DecompressionStream("deflate-raw"));
}
