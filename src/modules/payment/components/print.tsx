"use client";

export function PrintButton() {
  return (
    <button
      className="button button-primary no-print"
      onClick={() => window.print()}
    >
      พิมพ์ / บันทึก PDF
    </button>
  );
}
