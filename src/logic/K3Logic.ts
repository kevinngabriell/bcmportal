import * as XLSX from "xlsx";

type ExcelRow = Record<string, any>;

export interface GeneratedFile {
  kcu: string;
  fileName: string;
  blob: Blob;
}

function normalizeHeader(row: ExcelRow): ExcelRow {
  const normalized: ExcelRow = {};
  Object.entries(row).forEach(([key, value]) => {
    const cleanKey = key.replace(/\s+/g, " ").trim();
    normalized[cleanKey] = value;
  });
  return normalized;
}

function groupByKCU(data: ExcelRow[]): Record<string, ExcelRow[]> {
  const grouped: Record<string, ExcelRow[]> = {};
  (data || []).forEach((row) => {
    const normalizedRow = normalizeHeader(row);
    const kcu = normalizedRow["Nama Gedung (Contoh : Bekasi)"] || "Tanpa KCU";
    if (!grouped[kcu]) grouped[kcu] = [];
    grouped[kcu].push(normalizedRow);
  });
  return grouped;
}

export function generateSelfSurveyAreaKerjaK3(excelData: ExcelRow[]): GeneratedFile[] {
  const grouped = groupByKCU(excelData);
  const generatedFiles: GeneratedFile[] = [];

  Object.entries(grouped).forEach(([kcu, items]) => {
    const newSheets = items.map((rowClean) => {
      const sectionData: (string | null)[][] = [];

      sectionData.push([""]);
      sectionData.push(["Nama Gedung", rowClean["Nama Gedung (Contoh : Bekasi)"] || ""]);
      sectionData.push([
        "Jumlah Lantai",
        rowClean["Jumlah Lantai (Termasuk Basement & Rooftop) yang terdapat area kerja Apabila Jumlah Lantai yang terdapat area kerja di Gedung Bapak/Ibu lebih dari 5 lantai, dapat menghubungi tim K3"] || ""
      ]);
      sectionData.push([""]);

      const lantaiList = ["4", "3", "2", "1", ""]; // terakhir kosong = basement/rooftop

      lantaiList.forEach((lantai) => {
        const suffix = lantai ? ` ${lantai}` : "";

        sectionData.push(["Lantai", rowClean[`Lantai${suffix}`] || ""]);
        sectionData.push([
          "Area/Unit Kerja",
          rowClean[
            `Area / Unit Kerja (Apabila terdapat Unit Kerja Kantor Pusat/Kantor Wilayah/Tenant/Hub atau area yang belum terdapat pada list, dapat ditambahkan pada opsi other)${suffix}`
          ] || ""
        ]);
        sectionData.push([
          "Apakah Terdapat APAR ?",
          rowClean[`Apakah terdapat APAR di lantai ini?${suffix}`] || ""
        ]);
        sectionData.push([
          "Apakah Terdapat Hydrant ?",
          rowClean[`Apakah terdapat HYDRANT di lantai ini?${suffix}`] || ""
        ]);
        sectionData.push([
          "Apakah Terdapat Warden Box ?",
          rowClean[`Apakah terdapat Warden Box di lantai ini?${suffix}`] || ""
        ]);
        sectionData.push([
          "Apakah Terdapat Sprinkler/Smoke Detector/Heat Detector ?",
          rowClean[
            `Apakah terdapat Sprinkler/Smoke Detector/Heat Detector di area/unit kerja?${suffix}`
          ] || ""
        ]);
        sectionData.push([
          "Apakah Terdapat Tangga Darurat ?",
          rowClean[
            `Apakah terdapat Tangga darurat* di area/unit kerja?  *)Tangga darurat/penyelamatan adalah tangga yang terletak di dalam bangunan yang harus terpisah dari ruang-ruang lain dengan dinding tahan api${suffix}`
          ] || ""
        ]);
        sectionData.push([
          "Apakah Terdapat Ruang Area Terbatas ?",
          rowClean[
            `Apakah di lantai ini terdapat Ruang Area Terbatas (R. Panel Distribusi/Hub) di area/unit kerja?${suffix}`
          ] || ""
        ]);
        sectionData.push([
          "Apakah Terdapat Area Berlindung Gempa ?",
          rowClean[
            `Apakah terdapat Area / Tempat Berlindung (kolong meja/safety point) di area/unit kerja yang tidak terhalang benda dan dapat digunakan menjadi tempat berlindung pada saat gempa${suffix}`
          ] || ""
        ]);
        sectionData.push([
          "Apakah Telah dilakukan assessment ?",
          rowClean[
            `Dengan ini kami menyatakan bahwa seluruh item di lantai ini (area kerja) telah dilakukan assessment sesuai dengan standar dan ketentuan yang berlaku (kecuali sejumlah item yang telah dinyatakan belum${suffix}`
          ] || ""
        ]);
        sectionData.push([""]);
      });

      return sectionData;
    });

    const combined = newSheets.flatMap((sheet) => [...sheet, [""]]);

    const ws = XLSX.utils.aoa_to_sheet(combined);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Form");

    const fileName = `Form_KCU_${kcu}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    generatedFiles.push({ kcu, fileName, blob });
  });

  return generatedFiles;
}

export function generateSelfSurveyPeralatanK3(excelData: ExcelRow[]) : GeneratedFile[]{
  const grouped = groupByKCU(excelData);
  const generatedFiles: GeneratedFile[] = [];

  Object.entries(grouped).forEach(([kcu, items]) => {
    const newSheets = items.map((rowClean) => {
      const sectionData: (string | null)[][] = [];

      sectionData.push([""]);
      sectionData.push(["Nama Gedung", rowClean["Nama Gedung (Contoh : Bekasi)"] || ""]);

      sectionData.push([""]);
      sectionData.push(["----POSTER PK3---"]);
      sectionData.push(["Apakah terpasang Poster UU 1 Tahun 1970 (ukuran A3)?", rowClean["Apakah terpasang Poster UU 1 Tahun 1970 (ukuran A3)?"] || ""]);
      sectionData.push(["Lantai Poster UU 1 Tahun 1970 terpasang", rowClean["Lantai Poster UU 1 Tahun 1970 terpasang"] || ""]);
      sectionData.push(["Area / Unit Kerja dimana Poster UU 1 Tahun 1970 terpasang", rowClean["Area / Unit Kerja dimana Poster UU 1 Tahun 1970 terpasang"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Poster UU 1 tahun 1970 yang telah terpasang di Gedung ini", rowClean["Lampirkan dokumentasi foto Poster UU 1 tahun 1970 yang telah terpasang di Gedung ini"] || ""]);

      sectionData.push([""]);
      sectionData.push(["----KAWASAN AREA MEROKOK---"]);
      sectionData.push(["Apakah terpasang Rambu Kawasan dilarang merokok?", rowClean["Apakah terpasang Rambu Kawasan dilarang merokok?*  *Di area publik untuk menandakan bahwa gedung BCA adalah kawasan bebas rokok"] || ""]);
      sectionData.push(["Lantai Rambu Kawasan dilarang merokok terpasang", rowClean["Lantai Rambu Kawasan dilarang merokok terpasang"] || ""]);

      sectionData.push([""]);
      sectionData.push(["----AED---"]);
      sectionData.push(["Apakah terdapat AED ?", rowClean["Apakah terdapat AED"] || ""]);
      sectionData.push(["Lantai dimana AED berada ?", rowClean["Lantai dimana AED berada"] || ""]);
      sectionData.push(["Area / Unit Kerja dimana AED berada", rowClean["Area / Unit Kerja dimana AED berada"] || ""]);
      //skip 1
      sectionData.push(["Dari standar AED di atas, kriteria mana yang belum terpenuhi", rowClean["Dari standar AED di atas, kriteria mana yang belum terpenuhi"] || ""]);

      sectionData.push([""]);
      sectionData.push(["----P3K---"]);
      sectionData.push(["Apakah terdapat Kotak P3K?", rowClean["Apakah terdapat Kotak P3K?"] || ""]);
      sectionData.push(["Apakah Kotak P3K berada di PIC yang seharusnya ?", rowClean["Apakah Kotak P3K berada di PIC yang seharusnya (Mengacu pada memo 092, 096, dan 097 MO MRK 2023). PIC Kotak P3K dapat dilihat pada gambar dibawah"] || ""]);
      sectionData.push(["Lantai & Unit Kerja dimana kotak P3K berada", rowClean["Lantai & Unit Kerja dimana kotak P3K berada"] || ""]);
      //skip 1
      sectionData.push(["Dari standar Kotak P3K di atas, kriteria mana yang belum terpenuhi", rowClean["Dari standar Kotak P3K di atas, kriteria mana yang belum terpenuhi"] || ""]);

      sectionData.push([""]);
      sectionData.push(["----Tabung Oksigen---"]);
      sectionData.push(["Apakah terdapat Tabung Oksigen ?", rowClean["Apakah terdapat Tabung Oksigen (Penanggungjawab Tabung Oksigen adalah unit kerja APK)"] || ""]);
      sectionData.push(["Lantai dimana tabung oksigen berada ?", rowClean["Lantai dimana tabung oksigen berada"] || ""]);
      sectionData.push(["Area / Unit Kerja dimana tabung oksigen berada ?", rowClean["Area / Unit Kerja dimana tabung oksigen berada"] || ""]);
      //skip 1
      sectionData.push(["Dari standar Tabung Oksigen di atas, kriteria mana yang belum terpenuhi", rowClean["Dari standar Tabung Oksigen di atas, kriteria mana yang belum terpenuhi"] || ""]);
      
      sectionData.push([""]);
      sectionData.push(["----Ruang Menyusui---"]);
      sectionData.push(["Apakah terdapat Ruang Menyusui/Ruang Laktasi ?", rowClean["Apakah terdapat Ruang Menyusui/Ruang Laktasi"] || ""]);
      sectionData.push(["Lantai dimana Ruang Menyusui berada ?", rowClean["Lantai dimana Ruang Menyusui berada"] || ""]);
      //skip 1
      sectionData.push(["Dari standar Ruang Menyusui di atas, kriteria mana yang belum terpenuhi", rowClean["Dari standar Ruang Menyusui di atas, kriteria mana yang belum terpenuhi"] || ""]);

      sectionData.push([""]);
      sectionData.push(["----Ruang Mesin Lift---"]);
      sectionData.push(["Apakah terdapat Ruang Mesin Lift ?", rowClean["Apakah terdapat Ruang Mesin Lift"] || ""]);
      sectionData.push(["Lantai dimana Ruang Mesin Lift berada ?", rowClean["Lantai dimana Ruang Mesin Lift berada"] || ""]);
      //skip 1
      sectionData.push(["Dari standar Ruang Mesin Lift di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Mesin Lift di atas, kriteria mana yang belum terpenuhi"] || ""]);
      
      sectionData.push([""]);
      sectionData.push(["----Ruang Pompa---"]);
      sectionData.push(["Apakah terdapat Ruang Pompa ?", rowClean["Apakah terdapat Ruang Pompa"] || ""]);
      sectionData.push(["Lantai dimana Ruang Pompa berada ?", rowClean["Lantai dimana Ruang Pompa berada"] || ""]);
      //Skip 1
      sectionData.push(["Dari standar Ruang Pompa di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Pompa di atas, kriteria mana yang belum terpenuhi"] || ""]);

      sectionData.push([""]);
      sectionData.push(["----Ruang Genset---"]);
      sectionData.push(["Apakah terdapat Ruang Genset ?", rowClean["Apakah terdapat Ruang Genset"] || ""]);
      sectionData.push(["Lantai dimana Ruang Genset berada ?", rowClean["Lantai dimana Ruang Genset berada"] || ""]);
      //skip 1
      sectionData.push(["Dari standar Ruang Genset di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Genset di atas, kriteria mana yang belum terpenuhi"] || ""]);
      
      
      sectionData.push([""]);
      sectionData.push(["----Ruang Trafo---"]);
      sectionData.push(["Apakah terdapat Ruang Trafo ?", rowClean["Apakah terdapat Ruang Trafo"] || ""]);
      sectionData.push(["Lantai dimana Ruang Trafo berada ?", rowClean["Lantai dimana Ruang Trafo berada"] || ""]);
      //skip 1
      sectionData.push(["Dari standar Ruang Trafo di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Trafo di atas, kriteria mana yang belum terpenuhi"] || ""]);
      
      sectionData.push([""]);
      sectionData.push(["----Tangki Timbun---"]);
      sectionData.push(["Apakah terdapat Tangki Timbun ?", rowClean["Apakah terdapat Tangki Timbun (berisi solar, dapat berada di bawah tanah maupun tidak)"] || ""]);
      sectionData.push(["Lantai dimana Tangki Timbun berada ?", rowClean["Lantai dimana Tangki Timbun berada"] || ""]);
      //skip 1
      sectionData.push(["Dari standar Ruang Tangki Timbun di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Tangki Timbun di atas, kriteria mana yang belum terpenuhi"] || ""]);

      sectionData.push([""]);
      sectionData.push(["----MCFA---"]);
      sectionData.push(["Apakah terdapat MCFA (Main Control Fire Alarm) ?", rowClean["Apakah terdapat MCFA (Main Control Fire Alarm)"] || ""]);
      sectionData.push(["Lantai dimana MCFA berada ?", rowClean["Lantai dimana MCFA berada"] || ""]);
      //skip 1
      sectionData.push(["Dari standar MCFA di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar MCFA di atas, kriteria mana yang belum terpenuhi"] || ""]);
      
      sectionData.push([""]);
      sectionData.push(["----Mesin Paging---"]);
      sectionData.push(["Apakah terdapat Mesin Paging ?", rowClean["Apakah terdapat Mesin Paging"] || ""]);
      sectionData.push(["Lantai dimana Mesin Paging berada ?", rowClean["Lantai dimana Mesin Paging berada"] || ""]);
      //skip 1
      sectionData.push(["Dari standar Mesin Paging di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Mesin Paging di atas, kriteria mana yang belum terpenuhi"] || ""]);

      sectionData.push([""]);
      sectionData.push(["----Hydrant Outdoor---"]);
      sectionData.push(["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung) ?", rowClean["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung)"] || ""]);
      //skip 1
      sectionData.push(["Dari standar Hydrant Outdoor di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Hydrant Outdoor di atas, kriteria mana yang belum terpenuhi"] || ""]);
      
      sectionData.push([""]);
      sectionData.push(["----Assembly Point---"]);
      sectionData.push(["Apakah terdapat Titik Kumpul (Assembly Point) ?", rowClean["Apakah terdapat Titik Kumpul (Assembly Point)"] || ""]);
      //skip 1
      sectionData.push(["Dari standar Assembly Point di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Assembly Point di atas, kriteria mana yang belum terpenuhi"] || ""]);
      
      sectionData.push(["Dengan ini kami menyatakan bahwa seluruh item ini (Peralatan K3 & Utility) telah dilakukan assessment sesuai dengan standar dan ketentuan yang berlaku (kecuali sejumlah item yang telah dinyatakan bel", rowClean["Dengan ini kami menyatakan bahwa seluruh item ini (Peralatan K3 & Utility) telah dilakukan assessment sesuai dengan standar dan ketentuan yang berlaku (kecuali sejumlah item yang telah dinyatakan bel"] || ""]);


      return sectionData;
    });

    const combined = newSheets.flatMap((sheet) => [...sheet, [""]]);

    const ws = XLSX.utils.aoa_to_sheet(combined);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Form");

    const fileName = `Form_KCU_${kcu}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    generatedFiles.push({ kcu, fileName, blob });
  });

  return generatedFiles;
}