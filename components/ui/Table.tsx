import { ReactNode } from "react";

export interface TableColumn<T> {
  key: keyof T & string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  /** Peso flex de la columna (default 1). */
  width?: number;
  /**
   * Ancho mínimo en px antes de que la columna ceda a scroll horizontal en
   * vez de recortar el contenido (hallazgo de auditoría, AIT-58 loop1: sin
   * esto, en móvil teléfono/email/origen/comercial quedaban truncados a
   * unos pocos píxeles).
   */
  minWidth?: number;
  /** Tipografía monoespaciada (importes, IDs, fechas). */
  mono?: boolean;
  /** Texto secundario. */
  muted?: boolean;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Filas más compactas. */
  dense?: boolean;
}

const ALIGN_CLASSES: Record<"left" | "right" | "center", string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  dense = false,
}: TableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface font-sans">
      {/* Scroll horizontal (no recorte) cuando la suma de min-width de las
          columnas no cabe en el viewport — ver TableColumn.minWidth. */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-text">
          <thead>
            <tr className="border-b border-border bg-neutral-50">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  style={{ minWidth: c.minWidth, flex: c.width ?? 1 }}
                  className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted ${ALIGN_CLASSES[c.align ?? "left"]}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  className={`${i < rows.length - 1 ? "border-b border-neutral-100" : ""} ${
                    onRowClick
                      ? "cursor-pointer transition-colors hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none"
                      : ""
                  }`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      style={{ minWidth: c.minWidth }}
                      className={`px-4 ${dense ? "py-2" : "py-3"} ${ALIGN_CLASSES[c.align ?? "left"]} ${
                        c.mono ? "font-mono text-[13px]" : ""
                      } ${c.muted ? "text-text-secondary" : ""}`}
                    >
                      {c.render
                        ? c.render(row[c.key], row)
                        : String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
