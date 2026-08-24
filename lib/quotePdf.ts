// Generación del PDF de presupuesto (AIT-53, Post-MVP F1). Se genera en el
// cliente con jsPDF a partir de datos ya calculados/persistidos en servidor
// (convex/quotes.ts) — nunca se recalculan aquí subtotal/impuestos/total,
// solo se formatean para imprimirlos.
//
// "Imagen del negocio" (criterio de aceptación): si la tienda tiene un
// logo subido (AIT-61, convex/schema.ts:stores.logoStorageId), se
// incrusta en la cabecera; si no, se dibuja el membrete de marca de
// siempre (el nombre de la tienda en el color primario del design
// system).
import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "./format";

const COLOR_PRIMARY: [number, number, number] = [37, 99, 235]; // --color-primary
const COLOR_TEXT: [number, number, number] = [15, 23, 42]; // --color-text
const COLOR_TEXT_MUTED: [number, number, number] = [100, 116, 139]; // --color-text-muted
const COLOR_BORDER: [number, number, number] = [226, 232, 240]; // --color-border

const QUOTE_STATUS_LABEL: Record<"sent" | "accepted" | "rejected", string> = {
  sent: "Enviado",
  accepted: "Aceptado",
  rejected: "Rechazado",
};

export type QuotePdfData = {
  storeName: string;
  // AIT-61: URL del logo de la tienda (convex/stores.ts::getStoreInfo /
  // convex/opportunities.ts::getSummary), o null si no hay logo subido —
  // en ese caso se dibuja el membrete de texto de siempre.
  logoUrl: string | null;
  customerName: string;
  customerPhone: string;
  ownerName: string | null;
  status: "sent" | "accepted" | "rejected";
  sentAt: number;
  // AIT-54: cada versión de un presupuesto puede generar su propio PDF, no
  // solo la vigente — el número de versión se imprime en la cabecera para
  // que no haya ambigüedad sobre cuál de varios PDF descargados es cuál.
  version: number;
  lines: { productName: string; quantity: number; unitPrice: number }[];
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
};

// AIT-61: convierte el blob descargado del logo a data URL — formato que
// tanto `doc.getImageProperties` como `doc.addImage` aceptan directamente.
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el logo."));
    reader.readAsDataURL(blob);
  });
}

export async function buildQuotePdf(data: QuotePdfData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 24;

  // Ningún texto libre que entra en este PDF tiene límite de longitud en
  // servidor — nombre de tienda (convex/stores.ts:validateStoreName),
  // nombre de cliente y teléfono (convex/customers.ts), nombre de comercial
  // (convex/users.ts) y nombre de producto (convex/products.ts) solo
  // exigen no estar vacíos. Este helper es el único punto por el que pasa
  // cualquiera de esos valores antes de dibujarse: mide el wrap con
  // `splitTextToSize` usando la fuente/tamaño ya activos en `doc`, y si
  // aun así excede `maxLines` trunca la última línea con "…" carácter a
  // carácter hasta que quepa. Así ningún valor real puede desbordar su
  // columna, invadir la columna de al lado, ni (para las filas de
  // productos, que si acumulan altura) solapar la fila siguiente —
  // hallazgo "Mayor" de la ronda de auditoría 1 (nombre de producto largo)
  // y de la ronda 2 (mismo problema en tienda/cliente/comercial, que la
  // primera corrección no cubría).
  function wrapText(text: string, maxWidth: number, maxLines: number): string[] {
    const wrapped = doc.splitTextToSize(text, maxWidth) as string[];
    if (wrapped.length <= maxLines) return wrapped;
    const kept = wrapped.slice(0, maxLines);
    let lastLine = kept[maxLines - 1];
    while (lastLine.length > 0 && doc.getTextWidth(`${lastLine}…`) > maxWidth) {
      lastLine = lastLine.slice(0, -1).trimEnd();
    }
    kept[maxLines - 1] = `${lastLine}…`;
    return kept;
  }

  // --- Cabecera: logo (si hay) o nombre de tienda (membrete) + etiqueta "Presupuesto" ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const presupuestoLabel = `Presupuesto · v${data.version}`;
  const presupuestoWidth = doc.getTextWidth(presupuestoLabel);
  doc.setTextColor(...COLOR_TEXT_MUTED);
  doc.text(presupuestoLabel, pageWidth - marginX, y, { align: "right" });

  // Mismo hueco tanto para el membrete de texto como para el logo: nunca
  // invaden la etiqueta "Presupuesto · vN" de la derecha.
  const storeNameMaxWidth = pageWidth - marginX * 2 - presupuestoWidth - 10;

  // AIT-61: caja de logo con coordenadas fijas. `logoTop`/`logoMaxHeight`
  // están elegidos para que, si no hay logo (o falla su carga), el
  // camino de fallback deje la línea separadora exactamente donde
  // estaba antes de esta tarea (y = 24 texto, y += 6 → 30) — cero
  // regresión visual para las tiendas sin logo. Si hay logo, la línea se
  // dibuja siempre `logoLineGap` (4mm, muy por encima del grosor de
  // trazo por defecto de jsPDF) por debajo del borde inferior REAL del
  // logo ya dibujado — nunca coincide con él, así que nunca lo puede
  // atravesar, sea cual sea la altura real que acabe teniendo el logo
  // dentro de ese límite.
  const logoTop = 16;
  const logoMaxHeight = 14;
  const logoMaxWidth = storeNameMaxWidth;
  const logoLineGap = 4;

  let lineY = y + 6; // 24 + 6 = 30, camino sin logo (sin cambios respecto al PDF anterior a AIT-61)
  let logoDrawn = false;
  if (data.logoUrl !== null) {
    try {
      const response = await fetch(data.logoUrl);
      if (!response.ok) throw new Error("No se pudo descargar el logo.");
      const dataUrl = await blobToDataUrl(await response.blob());
      const { width: naturalWidth, height: naturalHeight } = doc.getImageProperties(dataUrl);
      const scale = Math.min(logoMaxWidth / naturalWidth, logoMaxHeight / naturalHeight);
      const drawWidth = naturalWidth * scale;
      const drawHeight = naturalHeight * scale;
      doc.addImage(dataUrl, marginX, logoTop, drawWidth, drawHeight);
      lineY = logoTop + drawHeight + logoLineGap;
      logoDrawn = true;
    } catch {
      // Cae al membrete de texto de siempre — no bloquea la descarga del
      // PDF por un logo que no carga o no se puede incrustar.
    }
  }

  if (!logoDrawn) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    // Una sola línea: es un membrete de marca, no un párrafo — un nombre
    // de tienda desmesurado se trunca en vez de partirse en varias
    // líneas, para no tener que recalcular la altura de todo lo que va
    // debajo por culpa de la cabecera.
    const [storeNameLine] = wrapText(data.storeName, storeNameMaxWidth, 1);
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text(storeNameLine, marginX, y);
  }

  doc.setDrawColor(...COLOR_BORDER);
  doc.line(marginX, lineY, pageWidth - marginX, lineY);

  y = lineY + 10;
  const headerBlockTop = y;
  // Columnas de igual ancho con un hueco en medio: cada texto libre se
  // envuelve/trunca a `headerColWidth`, así que ninguna de las dos
  // columnas puede crecer lo bastante para invadir la otra aunque ambas
  // tengan el valor más largo posible.
  const headerMidGap = 10;
  const headerColWidth = (pageWidth - marginX * 2 - headerMidGap) / 2;
  const headerLineGap = 4.4;

  // --- Columna izquierda: Cliente ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLOR_TEXT);
  doc.text("Cliente", marginX, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const customerNameLines = wrapText(data.customerName, headerColWidth, 2);
  customerNameLines.forEach((textLine, i) => {
    doc.text(textLine, marginX, y + i * headerLineGap);
  });
  y += (customerNameLines.length - 1) * headerLineGap + 5;

  doc.setTextColor(...COLOR_TEXT_MUTED);
  const [customerPhoneLine] = wrapText(data.customerPhone, headerColWidth, 1);
  doc.text(customerPhoneLine, marginX, y);
  const leftBottomY = y;

  // --- Columna derecha: Fecha / Estado / Comercial ---
  // Cursor propio (infoY, no `y`): el número de filas es variable
  // (Comercial es opcional, y su nombre puede envolver a 2 líneas) y puede
  // acabar más abajo que la columna izquierda — la tabla de productos no
  // arranca hasta que las DOS columnas han terminado, o su cabecera pisa
  // la última fila de la que sea más alta.
  const infoX = pageWidth - marginX;
  let infoY = headerBlockTop;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_TEXT);
  doc.text("Fecha", infoX, infoY, { align: "right" });
  infoY += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_TEXT_MUTED);
  // Fecha y Estado no son texto libre (fecha formateada / enum fijo) — no
  // necesitan pasar por wrapText.
  doc.text(formatDate(data.sentAt), infoX, infoY, { align: "right" });
  infoY += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_TEXT);
  doc.text("Estado", infoX, infoY, { align: "right" });
  infoY += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR_TEXT_MUTED);
  doc.text(QUOTE_STATUS_LABEL[data.status], infoX, infoY, { align: "right" });
  if (data.ownerName) {
    infoY += 5.5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_TEXT);
    doc.text("Comercial", infoX, infoY, { align: "right" });
    infoY += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_TEXT_MUTED);
    const ownerNameLines = wrapText(data.ownerName, headerColWidth, 2);
    ownerNameLines.forEach((textLine, i) => {
      doc.text(textLine, infoX, infoY + i * headerLineGap, { align: "right" });
    });
    infoY += (ownerNameLines.length - 1) * headerLineGap;
  }
  const rightBottomY = infoY;

  y = Math.max(leftBottomY, rightBottomY) + 14;

  const colProduct = marginX;
  const colQty = pageWidth - marginX - 70;
  const colPrice = pageWidth - marginX - 40;
  const colTotal = pageWidth - marginX;
  const lineHeight = 8;
  const bottomMargin = 30;

  function drawTableHeader() {
    doc.setFillColor(...COLOR_PRIMARY);
    doc.rect(marginX, y, pageWidth - marginX * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text("PRODUCTO", colProduct + 3, y + 5.5);
    doc.text("CANT.", colQty, y + 5.5, { align: "right" });
    doc.text("PRECIO", colPrice, y + 5.5, { align: "right" });
    doc.text("IMPORTE", colTotal, y + 5.5, { align: "right" });
    y += 8;
  }

  drawTableHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Tope de 3 líneas (con "…" en la última) para que un nombre de producto
  // absurdamente largo no pueda inflar una sola fila más allá de una
  // página entera — un producto real de esta app no necesita más que eso
  // para ser identificable.
  const productColWidth = colQty - colProduct - 8;
  const maxProductNameLines = 3;

  for (const line of data.lines) {
    const nameLines = wrapText(line.productName, productColWidth, maxProductNameLines);
    const rowHeight = lineHeight + (nameLines.length - 1) * headerLineGap;

    if (y + rowHeight > doc.internal.pageSize.getHeight() - bottomMargin) {
      doc.addPage();
      y = 24;
      drawTableHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }
    doc.setDrawColor(...COLOR_BORDER);
    doc.line(marginX, y + rowHeight, pageWidth - marginX, y + rowHeight);
    doc.setTextColor(...COLOR_TEXT);
    nameLines.forEach((textLine, i) => {
      doc.text(textLine, colProduct + 3, y + 5.5 + i * headerLineGap);
    });
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.text(String(line.quantity), colQty, y + 5.5, { align: "right" });
    doc.text(formatCurrency(line.unitPrice), colPrice, y + 5.5, { align: "right" });
    doc.setTextColor(...COLOR_TEXT);
    doc.text(formatCurrency(line.quantity * line.unitPrice), colTotal, y + 5.5, {
      align: "right",
    });
    y += rowHeight;
  }

  y += 8;
  if (y + 30 > doc.internal.pageSize.getHeight() - bottomMargin) {
    doc.addPage();
    y = 24;
  }

  const taxPercent = Number((data.taxRate * 100).toFixed(4));
  const totalsRows: [string, string][] = [
    ["Subtotal", formatCurrency(data.subtotal)],
    [`IVA (${String(taxPercent).replace(".", ",")}%)`, formatCurrency(data.tax)],
  ];
  doc.setFontSize(10);
  for (const [label, value] of totalsRows) {
    doc.setTextColor(...COLOR_TEXT_MUTED);
    doc.text(label, colPrice, y, { align: "right" });
    doc.setTextColor(...COLOR_TEXT);
    doc.text(value, colTotal, y, { align: "right" });
    y += 6;
  }
  doc.setDrawColor(...COLOR_BORDER);
  doc.line(colPrice - 30, y, colTotal, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLOR_TEXT);
  doc.text("Total", colPrice, y, { align: "right" });
  doc.text(formatCurrency(data.total), colTotal, y, { align: "right" });

  return doc;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function downloadQuotePdf(data: QuotePdfData): Promise<void> {
  const doc = await buildQuotePdf(data);
  doc.save(`presupuesto-${slugify(data.customerName)}-v${data.version}.pdf`);
}
