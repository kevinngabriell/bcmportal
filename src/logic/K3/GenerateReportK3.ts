import ExcelJS from "exceljs";

export async function generateK3Report(
  data: {
    sesuai: any[],
    tidakSesuai: any[],
    tidakAdaItem: any[]
  },
  tanggalSurvei: string,
  namaStatusGedung: string,
  jenisLaporan: string
) {
  const workbook = new ExcelJS.Workbook();

  function addSheetWithData(sheetName: string, rows: any[]) {
    const sheet = workbook.addWorksheet(sheetName);

    // HEADER
    sheet.mergeCells("A1:G1");
    sheet.getCell("A1").value = `Hasil Survei ${namaStatusGedung} - ${sheetName}`;
    sheet.getCell("A1").font = { bold: true, size: 14 };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    sheet.mergeCells("A2:G2");
    sheet.getCell("A2").value = `Tanggal Survei: ${tanggalSurvei}`;

    // TABLE HEADER
    const header = ["No", "Lokasi", "Hasil Survei", "Dokumentasi Survei", "Tindak Lanjut", "PIC", ""];
    sheet.addRow(header);
    sheet.getRow(3).font = { bold: true };

    let rowNumber = 1;
    let currentGroup: any[] = [];
    let currentCategory = "";

    let lokasiSaatIni = "";
    let areaKerjaSaatIni = "";

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Update lokasi & area kerja saat ketemu row yang fix
      if (row.field === "Lantai" && row.value) {
        lokasiSaatIni = row.value;
      }
      if (row.field === "Area/Unit Kerja" && row.value) {
        areaKerjaSaatIni = row.value;
      }

      // Deteksi header kategori (judul)
      if (row.value === null) {
        currentCategory = row.field;

        if (currentGroup.length > 0) {
          const dokumentasi = findValue(currentGroup, "lampirkan");
          const tindaklanjut = findValue(currentGroup, "tindak lanjut");
          const PIC = findValue(currentGroup, "pic");
          const hasil = currentCategory;
          const lokasiGabung = `${lokasiSaatIni} - ${areaKerjaSaatIni}`;

          sheet.addRow([
            rowNumber++,
            lokasiGabung,
            hasil,
            dokumentasi,
            tindaklanjut,
            PIC,
            ""
          ]);
          sheet.getRow(sheet.lastRow!.number).height = 40;
          currentGroup = [];
        }

        // Ganti currentCategory
       currentCategory = row.field;
      } else {
        currentGroup.push(row);
      }
    }

    // Group terakhir
    if (currentGroup.length > 0) {
      const dokumentasi = findValue(currentGroup, "lampirkan");
      const tindaklanjut = findValue(currentGroup, "tindak lanjut");
      const PIC = findValue(currentGroup, "pic");
      const hasil = currentCategory;
      const lokasiGabung = `${lokasiSaatIni} - ${areaKerjaSaatIni}`;

      sheet.addRow([
        rowNumber++,
        lokasiGabung,
        hasil,
        dokumentasi,
        tindaklanjut,
        PIC,
        ""
      ]);
      sheet.getRow(sheet.lastRow!.number).height = 40;
    }
  }

  // Helper untuk cari data berdasarkan keyword di field (lowercase)
  function findValue(group: any[], keyword: string): string {
    const found = group.find(r => r.field.toLowerCase().includes(keyword.toLowerCase()));
    return found?.value ?? "";
  }

  // Tambahkan sheet
  addSheetWithData("Sesuai", data.sesuai);
  addSheetWithData("Tidak Sesuai", data.tidakSesuai);
  addSheetWithData("Tidak Ada Item", data.tidakAdaItem);

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Laporan${jenisLaporan}_K3_${namaStatusGedung}.xlsx`;
  a.click();
}
