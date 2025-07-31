type RowData = (string | null)[];

function isImageUrl(url: string | null): boolean {
    return !!url && url.startsWith("https") && /\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i.test(url);
}

function renderPreview(data: RowData[]): void {
    const table = document.getElementById("previewTable") as HTMLTableElement;
    table.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");

        row.forEach(cell => {
            const td = document.createElement("td");

            if(isImageUrl(cell)){
                const img = document.createElement("img");
                img.src = cell!;
                td.appendChild(img);
            } else {
                td.textContent = cell ?? "";
            }

            tr.appendChild(td);
        });

        table.appendChild(tr);
    });
}

// renderPreview(previewData);
