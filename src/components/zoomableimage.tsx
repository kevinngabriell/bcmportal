import { useState } from "react";
import { createPortal } from "react-dom";

export function ZoomableImage({ src }: { src: string }) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      {/* Gambar kecil */}
      <img
        src={src}
        alt="thumbnail"
        style={{
          maxWidth: 200,
          marginRight: 8,
          cursor: "zoom-in",
          border: "1px solid #ccc",
          borderRadius: 4,
        }}
        onClick={(e) => {
          e.stopPropagation(); // cegah bubbling ke dialog utama
          setIsZoomed(true);
        }}
      />

      {/* Zoom View */}
      {isZoomed &&
        createPortal(
          <div
            onClick={(e) => {
              e.stopPropagation(); // cegah bubbling
              e.preventDefault();
              setIsZoomed(false);
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            {/* Layer tengah, jangan tutup kalau klik di gambar atau tombol */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ position: "relative" }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomed(false);
                }}
                style={{
                  position: "absolute",
                  top: -40,
                  right: 0,
                  background: "white",
                  padding: "6px 12px",
                  borderRadius: 4,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ❌ Close
              </button>

              <img
                src={src}
                alt="zoomed"
                style={{
                  maxWidth: "90vw",
                  maxHeight: "80vh",
                  borderRadius: 8,
                  boxShadow: "0 0 20px rgba(255,255,255,0.3)",
                }}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}