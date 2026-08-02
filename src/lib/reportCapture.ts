/**
 * Rasterises the monthly-report form and packages it as a PNG or a one-page
 * PDF — all client-side, no dependencies (the same reasoning as the old RTF
 * exporter: this app must work offline and stay small).
 *
 * How the DOM becomes pixels: the node is cloned with every element's
 * computed style inlined, serialised to XHTML, wrapped in an SVG
 * <foreignObject>, loaded as a data-URL image, and drawn onto a canvas.
 * Inlining computed styles is what lets the clone render inside the SVG's
 * isolated document, where the app's stylesheets don't exist. Web fonts
 * don't load in that document either — the capture layout pins system fonts
 * so the output doesn't depend on the user's font setting.
 */

function inlineComputedStyles(source: Element, target: Element): void {
  if (target instanceof HTMLElement || target instanceof SVGElement) {
    const computed = window.getComputedStyle(source);
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      target.style.setProperty(prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop));
    }
  }
  for (let i = 0; i < source.children.length; i++) {
    inlineComputedStyles(source.children[i], target.children[i]);
  }
}

export function captureElementToCanvas(
  element: HTMLElement,
  scale: number
): Promise<HTMLCanvasElement> {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const clone = element.cloneNode(true) as HTMLElement;
  inlineComputedStyles(element, clone);
  clone.style.margin = "0";

  const xhtml = new XMLSerializer().serializeToString(clone);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject width="100%" height="100%">${xhtml}</foreignObject></svg>`;

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas 2d context unavailable"));
        return;
      }
      // The form assumes a white sheet; without this the PNG is transparent
      // and the JPEG inside the PDF turns black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(image, 0, 0);
      resolve(canvas);
    };
    image.onerror = () => reject(new Error("failed to rasterise report"));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed"))),
      "image/png"
    );
  });
}

/* ---------------------------------------------------------------- PDF --- */

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_MARGIN_PT = 24;

function jpegBytesFromCanvas(canvas: HTMLCanvasElement): Uint8Array {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * A minimal hand-written PDF: one A4 page whose only content is the report
 * image, scaled to fit inside the page margins. Fitting (never tiling)
 * guarantees the "one page like the official form" rule no matter how long
 * the report grew.
 */
export function buildSinglePageImagePdf(canvas: HTMLCanvasElement): Blob {
  const jpeg = jpegBytesFromCanvas(canvas);
  const encoder = new TextEncoder();

  const availableWidth = A4_WIDTH_PT - PAGE_MARGIN_PT * 2;
  const availableHeight = A4_HEIGHT_PT - PAGE_MARGIN_PT * 2;
  const fit = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
  const drawWidth = canvas.width * fit;
  const drawHeight = canvas.height * fit;
  const drawX = (A4_WIDTH_PT - drawWidth) / 2;
  // PDF's origin is bottom-left; anchor the image to the top margin.
  const drawY = A4_HEIGHT_PT - PAGE_MARGIN_PT - drawHeight;

  const contentStream = `q ${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${drawX.toFixed(
    2
  )} ${drawY.toFixed(2)} cm /Im0 Do Q`;

  const objects: (string | Uint8Array)[][] = [
    ["1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n"],
    ["2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n"],
    [
      `3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${A4_WIDTH_PT} ${A4_HEIGHT_PT}]` +
        "/Resources<</XObject<</Im0 5 0 R>>>>/Contents 4 0 R>>\nendobj\n",
    ],
    [`4 0 obj\n<</Length ${contentStream.length}>>\nstream\n${contentStream}\nendstream\nendobj\n`],
    [
      `5 0 obj\n<</Type/XObject/Subtype/Image/Width ${canvas.width}/Height ${canvas.height}` +
        `/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${jpeg.length}>>\nstream\n`,
      jpeg,
      "\nendstream\nendobj\n",
    ],
  ];

  const parts: Uint8Array[] = [encoder.encode("%PDF-1.4\n")];
  let offset = parts[0].length;
  const objectOffsets: number[] = [];
  for (const object of objects) {
    objectOffsets.push(offset);
    for (const piece of object) {
      const bytes = typeof piece === "string" ? encoder.encode(piece) : piece;
      parts.push(bytes);
      offset += bytes.length;
    }
  }

  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const objectOffset of objectOffsets) {
    xref += `${String(objectOffset).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(encoder.encode(xref));

  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}
