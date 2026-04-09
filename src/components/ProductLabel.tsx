import { forwardRef, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import logoDsh from "@/assets/logo-dsh.png";
import logoDmedical from "@/assets/logo-dmedical.png";

export interface ProductLabelData {
  produto: string;
  nome_comercial?: string | null;
  fabricante?: string | null;
  lote?: string | null;
  registro_anvisa?: string | null;
  validade?: string | null;
  codigo_barras?: string | null;
  estoque: "dsh" | "dmedical";
}

const ProductLabel = forwardRef<HTMLDivElement, { data: ProductLabelData }>(
  ({ data }, ref) => {
    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
      if (barcodeRef.current && data.codigo_barras) {
        try {
          JsBarcode(barcodeRef.current, data.codigo_barras, {
            format: "CODE128",
            width: 1.5,
            height: 28,
            displayValue: true,
            fontSize: 9,
            font: "Arial",
            margin: 2,
          });
        } catch {
          // invalid barcode
        }
      }
    }, [data.codigo_barras]);

    const logo = data.estoque === "dmedical" ? logoDmedical : logoDsh;
    const empresa = data.estoque === "dmedical" ? "DMedical Life" : "Drumond Soluções Hospitalares";

    const formatVal = (v?: string | null) => {
      if (!v) return "—";
      const [y, m, d] = v.split("-");
      return `${d}/${m}/${y}`;
    };

    return (
      <div ref={ref} style={{
        width: "100mm", height: "50mm", padding: "2mm 3mm",
        fontFamily: "Arial, sans-serif", fontSize: "7pt", color: "#000",
        background: "#fff", boxSizing: "border-box", display: "flex",
        flexDirection: "column", justifyContent: "space-between",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "2mm", marginBottom: "1mm", borderBottom: "0.3mm solid #ccc", paddingBottom: "1mm" }}>
          <img src={logo} alt={empresa} style={{ height: "7mm", objectFit: "contain" }} />
          <span style={{ fontSize: "8pt", fontWeight: 700 }}>{empresa}</span>
        </div>

        {/* Data grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "0.5mm 3mm", flex: 1,
        }}>
          <Field label="Produto" value={data.produto} />
          <Field label="Nome Comercial" value={data.nome_comercial} />
          <Field label="Fabricante" value={data.fabricante} />
          <Field label="Lote" value={data.lote} />
          <Field label="Registro ANVISA" value={data.registro_anvisa} />
          <Field label="Validade" value={formatVal(data.validade)} />
        </div>

        {/* Barcode */}
        {data.codigo_barras && (
          <div style={{ textAlign: "center", marginTop: "1mm" }}>
            <svg ref={barcodeRef} />
          </div>
        )}
      </div>
    );
  }
);

ProductLabel.displayName = "ProductLabel";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span style={{ fontSize: "5.5pt", color: "#666", fontWeight: 600 }}>{label}</span>
      <br />
      <span style={{ fontSize: "7pt", fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );
}

export default ProductLabel;
