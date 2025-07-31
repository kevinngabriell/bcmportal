type RowData = (string | null)[];

function isImageUrl(url: string | null): boolean {
    return !!url && url.startsWith("https") && /\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i.test(url);
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

