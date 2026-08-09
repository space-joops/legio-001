import { readU16, readU32, utf16leEncode, writeU16, writeU32 } from "./binary";

/**
 * OLE CFB(복합 문서) 파서 + 작성기 — HWP 5.0 컨테이너.
 *
 * 읽기는 v3(512B 섹터) 파일을 스트림 트리로 평탄화하고, 쓰기는 기존
 * 레이아웃 재현 없이 전체를 새로 짠다. 섹터 배치는
 * [FAT][디렉터리][miniFAT][미니스트림][일반 스트림] 순서로 고정한다.
 *
 * 4096바이트 미만 스트림은 규격대로 64B 미니 섹터에 담는다 — 치환 후
 * BodyText가 4096 경계를 넘나들어도 스트림 단위로 자동 분류된다.
 */

export interface CfbStream {
  /** 예: ["BodyText", "Section0"] */
  path: string[];
  data: Uint8Array;
}

export interface CfbStorage {
  path: string[];
  clsid: Uint8Array;
}

export interface CfbDocument {
  streams: CfbStream[];
  storages: CfbStorage[];
  rootClsid: Uint8Array;
}

const SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const SECTOR_SIZE = 512;
const MINI_SECTOR_SIZE = 64;
const MINI_CUTOFF = 4096;
const FREESECT = 0xffffffff;
const ENDOFCHAIN = 0xfffffffe;
const FATSECT = 0xfffffffd;
const NOSTREAM = 0xffffffff;
const DIR_ENTRY_SIZE = 128;
const TYPE_STORAGE = 1;
const TYPE_STREAM = 2;
const TYPE_ROOT = 5;

function pathKey(path: string[]): string {
  return path.join("/");
}

export function getStream(doc: CfbDocument, path: string): Uint8Array {
  const stream = doc.streams.find((s) => pathKey(s.path) === path);
  if (!stream) throw new Error(`CFB: 스트림이 없습니다: ${path}`);
  return stream.data;
}

export function setStream(doc: CfbDocument, path: string, data: Uint8Array): void {
  const stream = doc.streams.find((s) => pathKey(s.path) === path);
  if (stream) {
    stream.data = data;
  } else {
    doc.streams.push({ path: path.split("/"), data });
  }
}

export function removeStream(doc: CfbDocument, path: string): void {
  const index = doc.streams.findIndex((s) => pathKey(s.path) === path);
  if (index >= 0) doc.streams.splice(index, 1);
}

/**
 * CFB 디렉터리 정렬 규칙: 이름이 짧은 쪽 우선, 같으면 대문자로 바꿔
 * 코드유닛 비교. 이 순서가 틀리면 한글이 스트림을 못 찾는다.
 */
export function compareDirNames(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  const ua = a.toUpperCase();
  const ub = b.toUpperCase();
  for (let i = 0; i < ua.length; i += 1) {
    const diff = ua.charCodeAt(i) - ub.charCodeAt(i);
    if (diff !== 0) return diff;
  }
  return 0;
}

interface RawDirEntry {
  name: string;
  type: number;
  left: number;
  right: number;
  child: number;
  clsid: Uint8Array;
  startSect: number;
  size: number;
}

export function parseCfb(file: Uint8Array): CfbDocument {
  for (let i = 0; i < SIGNATURE.length; i += 1) {
    if (file[i] !== SIGNATURE[i]) throw new Error("CFB: 시그니처가 올바르지 않습니다");
  }
  if (readU16(file, 26) !== 3 || readU16(file, 30) !== 9) {
    throw new Error("CFB: v3(512바이트 섹터) 파일만 지원합니다");
  }
  const sectorBytes = (sector: number): Uint8Array => {
    const start = SECTOR_SIZE + sector * SECTOR_SIZE;
    if (start + SECTOR_SIZE > file.length) {
      throw new Error(`CFB: 섹터 ${sector}이 파일 범위를 벗어났습니다`);
    }
    return file.subarray(start, start + SECTOR_SIZE);
  };

  // DIFAT: 헤더 109칸 + 추가 DIFAT 섹터 체인.
  const fatSectorIds: number[] = [];
  for (let i = 0; i < 109; i += 1) {
    const value = readU32(file, 76 + i * 4);
    if (value < FATSECT) fatSectorIds.push(value);
  }
  let difatSector = readU32(file, 68);
  let difatGuard = 0;
  while (difatSector !== ENDOFCHAIN && difatSector !== FREESECT) {
    if (difatGuard++ > 4096) throw new Error("CFB: DIFAT 체인이 순환합니다");
    const sector = sectorBytes(difatSector);
    for (let i = 0; i < 127; i += 1) {
      const value = readU32(sector, i * 4);
      if (value < FATSECT) fatSectorIds.push(value);
    }
    difatSector = readU32(sector, 508);
  }

  const fat = new Uint32Array(fatSectorIds.length * 128);
  fatSectorIds.forEach((id, index) => {
    const sector = sectorBytes(id);
    for (let i = 0; i < 128; i += 1) fat[index * 128 + i] = readU32(sector, i * 4);
  });

  const readChain = (start: number): Uint8Array[] => {
    const sectors: Uint8Array[] = [];
    let current = start;
    while (current !== ENDOFCHAIN && current !== FREESECT) {
      if (sectors.length > fat.length) throw new Error("CFB: FAT 체인이 순환합니다");
      sectors.push(sectorBytes(current));
      current = fat[current];
    }
    return sectors;
  };
  const readChainData = (start: number, size: number): Uint8Array => {
    const sectors = readChain(start);
    const out = new Uint8Array(size);
    let offset = 0;
    for (const sector of sectors) {
      if (offset >= size) break;
      const take = Math.min(SECTOR_SIZE, size - offset);
      out.set(sector.subarray(0, take), offset);
      offset += take;
    }
    if (offset < size) throw new Error("CFB: 스트림 데이터가 부족합니다");
    return out;
  };

  // 디렉터리 엔트리 전체.
  const dirSectors = readChain(readU32(file, 48));
  const entries: RawDirEntry[] = [];
  for (const sector of dirSectors) {
    for (let offset = 0; offset + DIR_ENTRY_SIZE <= SECTOR_SIZE; offset += DIR_ENTRY_SIZE) {
      const nameLen = readU16(sector, offset + 64);
      let name = "";
      for (let i = 0; i + 2 <= Math.min(nameLen, 64) - 2; i += 2) {
        name += String.fromCharCode(readU16(sector, offset + i));
      }
      entries.push({
        name,
        type: sector[offset + 66],
        left: readU32(sector, offset + 68),
        right: readU32(sector, offset + 72),
        child: readU32(sector, offset + 76),
        clsid: sector.slice(offset + 80, offset + 96),
        startSect: readU32(sector, offset + 116),
        size: readU32(sector, offset + 120),
      });
    }
  }
  const root = entries[0];
  if (!root || root.type !== TYPE_ROOT) throw new Error("CFB: 루트 엔트리가 없습니다");

  // 미니스트림(루트 엔트리의 스트림)과 miniFAT.
  const miniStream = readChainData(root.startSect, root.size);
  const miniFatSectors = readChain(readU32(file, 60));
  const miniFat = new Uint32Array(miniFatSectors.length * 128);
  miniFatSectors.forEach((sector, index) => {
    for (let i = 0; i < 128; i += 1) miniFat[index * 128 + i] = readU32(sector, i * 4);
  });
  const readMiniChainData = (start: number, size: number): Uint8Array => {
    const out = new Uint8Array(size);
    let offset = 0;
    let current = start;
    let guard = 0;
    while (current !== ENDOFCHAIN && current !== FREESECT && offset < size) {
      if (guard++ > miniFat.length) throw new Error("CFB: miniFAT 체인이 순환합니다");
      const from = current * MINI_SECTOR_SIZE;
      const take = Math.min(MINI_SECTOR_SIZE, size - offset);
      out.set(miniStream.subarray(from, from + take), offset);
      offset += take;
      current = miniFat[current];
    }
    if (offset < size) throw new Error("CFB: 미니 스트림 데이터가 부족합니다");
    return out;
  };

  const doc: CfbDocument = { streams: [], storages: [], rootClsid: root.clsid };
  const visited = new Set<number>();
  const walk = (entryId: number, parentPath: string[]): void => {
    if (entryId === NOSTREAM) return;
    if (visited.has(entryId)) throw new Error("CFB: 디렉터리 트리가 순환합니다");
    visited.add(entryId);
    const entry = entries[entryId];
    if (!entry) throw new Error(`CFB: 디렉터리 엔트리 ${entryId}가 없습니다`);
    walk(entry.left, parentPath);
    const path = [...parentPath, entry.name];
    if (entry.type === TYPE_STORAGE) {
      doc.storages.push({ path, clsid: entry.clsid });
      walk(entry.child, path);
    } else if (entry.type === TYPE_STREAM) {
      const data =
        entry.size === 0
          ? new Uint8Array(0)
          : entry.size < MINI_CUTOFF
            ? readMiniChainData(entry.startSect, entry.size)
            : readChainData(entry.startSect, entry.size);
      doc.streams.push({ path, data });
    }
    walk(entry.right, parentPath);
  };
  walk(root.child, []);
  return doc;
}

interface BuildNode {
  name: string;
  type: number;
  clsid: Uint8Array;
  data: Uint8Array | null;
  children: BuildNode[];
  // 배치 단계에서 채움
  id: number;
  left: number;
  right: number;
  child: number;
  startSect: number;
  size: number;
}

function makeNode(name: string, type: number): BuildNode {
  return {
    name,
    type,
    clsid: new Uint8Array(16),
    data: null,
    children: [],
    id: -1,
    left: NOSTREAM,
    right: NOSTREAM,
    child: NOSTREAM,
    startSect: ENDOFCHAIN,
    size: 0,
  };
}

/** 정렬된 형제 배열을 중앙값 재귀로 균형 BST로 엮고 서브트리 루트를 돌려준다. */
function linkSiblings(sorted: BuildNode[]): number {
  if (sorted.length === 0) return NOSTREAM;
  const mid = sorted.length >> 1;
  const node = sorted[mid];
  node.left = linkSiblings(sorted.slice(0, mid));
  node.right = linkSiblings(sorted.slice(mid + 1));
  return node.id;
}

export function buildCfb(doc: CfbDocument): Uint8Array {
  // 1. 트리 구성 — 스트림 경로의 중간 storage는 자동 생성하고
  //    doc.storages의 CLSID를 입힌다.
  const root = makeNode("Root Entry", TYPE_ROOT);
  root.clsid = doc.rootClsid;
  const storageByKey = new Map<string, BuildNode>([["", root]]);
  const ensureStorage = (path: string[]): BuildNode => {
    const key = pathKey(path);
    const existing = storageByKey.get(key);
    if (existing) return existing;
    const parent = ensureStorage(path.slice(0, -1));
    const node = makeNode(path[path.length - 1], TYPE_STORAGE);
    parent.children.push(node);
    storageByKey.set(key, node);
    return node;
  };
  for (const storage of doc.storages) ensureStorage(storage.path);
  for (const storage of doc.storages) {
    const node = storageByKey.get(pathKey(storage.path));
    if (node) node.clsid = storage.clsid;
  }
  for (const stream of doc.streams) {
    const parent = ensureStorage(stream.path.slice(0, -1));
    const node = makeNode(stream.path[stream.path.length - 1], TYPE_STREAM);
    node.data = stream.data;
    node.size = stream.data.length;
    parent.children.push(node);
  }

  // 2. 엔트리 id 부여(루트 0, 이후 DFS) + 형제 BST 링크.
  const allNodes: BuildNode[] = [];
  const assignIds = (node: BuildNode): void => {
    node.id = allNodes.length;
    allNodes.push(node);
    const sorted = [...node.children].sort((a, b) => compareDirNames(a.name, b.name));
    for (const child of sorted) assignIds(child);
    node.child = linkSiblings(sorted);
  };
  assignIds(root);

  // 3. 미니/일반 스트림 분류와 미니스트림 조립.
  const streamNodes = allNodes.filter((n) => n.type === TYPE_STREAM);
  const miniNodes = streamNodes.filter((n) => n.size > 0 && n.size < MINI_CUTOFF);
  const regularNodes = streamNodes.filter((n) => n.size >= MINI_CUTOFF);
  let miniSectorCount = 0;
  for (const node of miniNodes) {
    miniSectorCount += Math.ceil(node.size / MINI_SECTOR_SIZE);
  }
  const miniStream = new Uint8Array(miniSectorCount * MINI_SECTOR_SIZE);
  const miniFat = new Uint32Array(miniSectorCount).fill(FREESECT);
  let nextMiniSector = 0;
  for (const node of miniNodes) {
    const sectors = Math.ceil(node.size / MINI_SECTOR_SIZE);
    node.startSect = nextMiniSector;
    miniStream.set(node.data as Uint8Array, nextMiniSector * MINI_SECTOR_SIZE);
    for (let i = 0; i < sectors; i += 1) {
      miniFat[nextMiniSector + i] = i === sectors - 1 ? ENDOFCHAIN : nextMiniSector + i + 1;
    }
    nextMiniSector += sectors;
  }
  root.size = miniSectorCount * MINI_SECTOR_SIZE;

  // 4. 섹터 수 계산 — FAT 크기는 전체 섹터 수와 상호 의존이라 수렴할 때까지 반복.
  const entryCount = Math.ceil(allNodes.length / 4) * 4;
  const dirSectorCount = (entryCount * DIR_ENTRY_SIZE) / SECTOR_SIZE;
  const miniFatSectorCount = Math.ceil(miniSectorCount / 128);
  const miniStreamSectorCount = Math.ceil(miniStream.length / SECTOR_SIZE);
  const regularSectorCounts = regularNodes.map((n) => Math.ceil(n.size / SECTOR_SIZE));
  const regularSectorTotal = regularSectorCounts.reduce((a, b) => a + b, 0);
  const fixedSectors =
    dirSectorCount + miniFatSectorCount + miniStreamSectorCount + regularSectorTotal;
  let fatSectorCount = 1;
  for (;;) {
    const next = Math.ceil((fixedSectors + fatSectorCount) / 128);
    if (next === fatSectorCount) break;
    fatSectorCount = next;
  }
  if (fatSectorCount > 109) throw new Error("CFB: 파일이 너무 큽니다(DIFAT 섹터 미지원)");
  const totalSectors = fatSectorCount + fixedSectors;

  // 5. 섹터 번호 배치.
  const dirStart = fatSectorCount;
  const miniFatStart = miniFatSectorCount > 0 ? dirStart + dirSectorCount : ENDOFCHAIN;
  const miniStreamStart = dirStart + dirSectorCount + miniFatSectorCount;
  root.startSect = miniStreamSectorCount > 0 ? miniStreamStart : ENDOFCHAIN;
  let nextSector = miniStreamStart + miniStreamSectorCount;
  regularNodes.forEach((node, i) => {
    node.startSect = nextSector;
    nextSector += regularSectorCounts[i];
  });

  // 6. FAT 채우기.
  const fat = new Uint32Array(totalSectors).fill(FREESECT);
  const markChain = (start: number, count: number): void => {
    for (let i = 0; i < count; i += 1) {
      fat[start + i] = i === count - 1 ? ENDOFCHAIN : start + i + 1;
    }
  };
  for (let i = 0; i < fatSectorCount; i += 1) fat[i] = FATSECT;
  markChain(dirStart, dirSectorCount);
  if (miniFatSectorCount > 0) markChain(miniFatStart as number, miniFatSectorCount);
  if (miniStreamSectorCount > 0) markChain(miniStreamStart, miniStreamSectorCount);
  regularNodes.forEach((node, i) => markChain(node.startSect, regularSectorCounts[i]));

  // 7. 파일 조립.
  const file = new Uint8Array(SECTOR_SIZE + totalSectors * SECTOR_SIZE);
  const sectorAt = (sector: number): number => SECTOR_SIZE + sector * SECTOR_SIZE;

  // 헤더.
  SIGNATURE.forEach((byte, i) => {
    file[i] = byte;
  });
  writeU16(file, 24, 0x003e);
  writeU16(file, 26, 0x0003);
  writeU16(file, 28, 0xfffe);
  writeU16(file, 30, 9);
  writeU16(file, 32, 6);
  writeU32(file, 44, fatSectorCount);
  writeU32(file, 48, dirStart);
  writeU32(file, 56, MINI_CUTOFF);
  writeU32(file, 60, miniFatSectorCount > 0 ? (miniFatStart as number) : ENDOFCHAIN);
  writeU32(file, 64, miniFatSectorCount);
  writeU32(file, 68, ENDOFCHAIN);
  writeU32(file, 72, 0);
  for (let i = 0; i < 109; i += 1) {
    writeU32(file, 76 + i * 4, i < fatSectorCount ? i : FREESECT);
  }

  // FAT / miniFAT 섹터.
  for (let i = 0; i < totalSectors; i += 1) {
    writeU32(file, sectorAt(0) + i * 4, fat[i]);
  }
  for (let i = fat.length; i < fatSectorCount * 128; i += 1) {
    writeU32(file, sectorAt(0) + i * 4, FREESECT);
  }
  if (miniFatSectorCount > 0) {
    const base = sectorAt(miniFatStart as number);
    for (let i = 0; i < miniFatSectorCount * 128; i += 1) {
      writeU32(file, base + i * 4, i < miniFat.length ? miniFat[i] : FREESECT);
    }
  }

  // 디렉터리 섹터.
  const dirBase = sectorAt(dirStart);
  allNodes.forEach((node) => {
    const offset = dirBase + node.id * DIR_ENTRY_SIZE;
    if (node.name.length > 31) throw new Error(`CFB: 이름이 너무 깁니다: ${node.name}`);
    const nameBytes = utf16leEncode(node.name);
    file.set(nameBytes, offset);
    writeU16(file, offset + 64, nameBytes.length + 2);
    file[offset + 66] = node.type;
    file[offset + 67] = 1; // 전부 black — 판독기는 색이 아니라 정렬 순서만 본다.
    writeU32(file, offset + 68, node.left);
    writeU32(file, offset + 72, node.right);
    writeU32(file, offset + 76, node.child);
    file.set(node.clsid, offset + 80);
    writeU32(file, offset + 116, node.startSect);
    writeU32(file, offset + 120, node.type === TYPE_ROOT ? root.size : node.size);
  });
  for (let id = allNodes.length; id < entryCount; id += 1) {
    const offset = dirBase + id * DIR_ENTRY_SIZE;
    writeU32(file, offset + 68, NOSTREAM);
    writeU32(file, offset + 72, NOSTREAM);
    writeU32(file, offset + 76, NOSTREAM);
  }

  // 미니스트림 + 일반 스트림 본문.
  if (miniStreamSectorCount > 0) {
    file.set(miniStream, sectorAt(miniStreamStart));
  }
  for (const node of regularNodes) {
    file.set(node.data as Uint8Array, sectorAt(node.startSect));
  }
  return file;
}
