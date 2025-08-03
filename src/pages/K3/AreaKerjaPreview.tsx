type RowData = (string | null)[];

export function cellToString(cell: string | null | { f: string }): string {
    if (typeof cell === "string") return cell;
    if (typeof cell === "object" && cell !== null && "f" in cell) return cell.f;
    return "";
}

export function isImageUrl(url: string | null): boolean {
    if (!url) return false;
  
    const isValidExtension = /\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i.test(url);
  
    const isRecognizedScheme = url.startsWith("http")
      || url.startsWith("https")
      || url.startsWith("blob:")
      || url.startsWith("data:")
      || url.startsWith("file:")
      || /^[a-zA-Z]:\\/.test(url); // match C:\Users\...
  
    return isRecognizedScheme && isValidExtension;
}

export function renderTablePreview(data: RowData[]): void {
    const table = document.getElementById("previewTable") as HTMLTableElement | null;
    if (!table) return;
    table.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");

        row.forEach(cell => {
            const td = document.createElement("td");

            if(isImageUrl(cell)){
                const img = document.createElement("img");
                img.src = cell!;
                img.style.maxWidth = "150px";
                img.style.height = "auto";
                td.appendChild(img);
            } else {
                td.textContent = cell ?? "";
            }

            tr.appendChild(td);
        });

        table.appendChild(tr);
    });
}