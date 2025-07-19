import * as XLSX from "xlsx";

type ExcelRow = Record<string, any>;

//This variable are used to set GeneratedFile 
export interface GeneratedFile {
  statusGedung: string;
  namaGedung: string;
  fileName: string;
  blob: Blob;
}

//This variable are used to normalize or clean the row
function normalizeHeader(row: ExcelRow): ExcelRow {
  const normalized: ExcelRow = {};
  Object.entries(row).forEach(([key, value]) => {
    const cleanKey = key.replace(/\s+/g, " ").trim();
    normalized[cleanKey] = value;
  });
  return normalized;
}

//This variable are used to group sheets by nama gedung
function groupByNamaGedung(data: ExcelRow[]): Record<string, ExcelRow[]> {
  const grouped: Record<string, ExcelRow[]> = {};
  (data || []).forEach((row) => {
    const normalizedRow = normalizeHeader(row);
    const namaGedung = normalizedRow["Nama Gedung (Contoh : Bekasi)"] || "Tanpa KCU";
    if (!grouped[namaGedung]) grouped[namaGedung] = [];
    grouped[namaGedung].push(normalizedRow);
  });
  return grouped;
}

//This function are used to generate self servey area kerja
export function generateSelfSurveyAreaKerjaK3(excelData: ExcelRow[]): GeneratedFile[] {
  const grouped = groupByNamaGedung(excelData);
  const generatedFiles: GeneratedFile[] = [];

  Object.entries(grouped).forEach(([namaGedung, items]) => {
    const statusGedung = items[0]["Pilih Gedung (KP/Kanwil/KCU/KCP)"] || "Tanpa Status";

    const newSheets = items.map((rowClean) => {
      const sectionData: (string | null)[][] = [];

      //Nama Gedung, Jumlah Lantai, and Status Gedung
      sectionData.push([""]);
      sectionData.push(["Nama Gedung", rowClean["Nama Gedung (Contoh : Bekasi)"] || ""]);
      sectionData.push(["Status Gedung", rowClean["Pilih Gedung (KP/Kanwil/KCU/KCP)"] || ""]);
      sectionData.push(["Jumlah Lantai",rowClean["Jumlah Lantai (Termasuk Basement & Rooftop) yang terdapat area kerja Apabila Jumlah Lantai yang terdapat area kerja di Gedung Bapak/Ibu lebih dari 5 lantai, dapat menghubungi tim K3"] || ""]);
      sectionData.push([""]);
      sectionData.push([""]);

      //Set looping floor
      const lantaiList = ["4", "3", "2", "1", ""]; 

      //Looping data for each floor
      lantaiList.forEach((lantai) => {
        //Set the suffix
        const suffix = lantai ? `${lantai}` : "";

        //Push lantai dan area kerja
        sectionData.push(["Lantai", rowClean[`Lantai ${suffix}`] || ""]);
        sectionData.push(["Area/Unit Kerja", rowClean[`Area / Unit Kerja (Apabila terdapat Unit Kerja Kantor Pusat/Kantor Wilayah/Tenant/Hub atau area yang belum terdapat pada list, dapat ditambahkan pada opsi other)${suffix}`] || ""]);
        
        //APAR Question
        sectionData.push([""]);
        sectionData.push(["----APAR---"]);
        sectionData.push(["Apakah Terdapat APAR ?", rowClean[`Apakah terdapat APAR di lantai ini? ${suffix}`] || ""]);
        sectionData.push(["Apakah APAR memenuhi seluruh standar yang tertera ?",rowClean[`Berikut merupakan standar Pemasangan APAR (Permenaker 4 Tahun 1980 & Memo Logistik No 063/MO/MP/2017) 1. Setiap satu atau kelompok APAR harus ditempatkan pada posisi yang mudah dilihat dengan jelas, ${suffix}`] || ""]);
        sectionData.push(["Dari standar APAR di atas, kriteria mana yang belum terpenuhi ?", rowClean[`Dari standar APAR di atas, kriteria mana yang belum terpenuhi, ${suffix}`] || ""]);
        sectionData.push(["Lampirkan 1 sampel dokumentasi foto APAR dilantai ini", rowClean[`Lampirkan 1 sampel dokumentasi foto APAR dilantai ini yang telah sesuai seluruh standar di atas${suffix}`] || rowClean[`Lampirkan dokumentasi foto APAR yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)${suffix}`]]);

        //Hydrant Question
        sectionData.push([""]);
        sectionData.push(["----HYDRANT---"]);
        sectionData.push(["Apakah Terdapat Hydrant ?", rowClean[`Apakah terdapat HYDRANT di lantai ini? ${suffix}`] || ""]);
        sectionData.push(["Apakah Hydrant memenuhi seluruh standar yang tertera ?", rowClean[`Berikut merupakan standar pemasangan hydrant: 1. Hydrant dapat dilihat dengan jelas 2. Hydrant mudah untuk diakses (Tidak terhalang benda) 3. Hydrant dalam kondisi terawat dengan baik dan siap digunak${suffix}`] || ""]);
        sectionData.push(["Dari standar Hydrant di atas, kriteria mana yang belum terpenuhi ?", rowClean[`Dari standar Hydrant di atas, kriteria mana yang belum terpenuhi ${suffix}`] || ""]);
        sectionData.push(["Lampirkan 1 sampel dokumentasi foto Hydrant dilantai ini", rowClean[`Lampirkan 1 sampel dokumentasi foto Hydrant dilantai ini yang telah sesuai seluruh standar di atas ${suffix}`] || rowClean[`Lampirkan dokumentasi foto Hydrant yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)${suffix}`]]);

        //Warden Box Question
        sectionData.push([""]);
        sectionData.push(["----WARDEN BOX---"]);
        sectionData.push(["Apakah Terdapat Warden Box ?", rowClean[`Apakah terdapat Warden Box di lantai ini?${suffix}`] || ""]);
        //Warden Box question special case
        if(suffix === ''){
          sectionData.push([
            "Apakah Warden Box memenuhi seluruh standar yang tertera ?",
            rowClean[`Berikut merupakan standar pemasangan warden box : 1. Warden Box dipasang ditempat yang mudah untuk dijangkau 2. Warden Box memiliki Hammer (Palu) 3. Isi Warden Box dimonitor sesuai ketentuan BC Apaka` ]
            || ""
          ]);
        } else if (suffix === '1'){
          sectionData.push([
            "Apakah Warden Box memenuhi seluruh standar yang tertera ?",
            rowClean[`Berikut merupakan standar pemasangan warden box : 1. Warden Box dipasang ditempat yang mudah untuk dijangkau 2. Warden Box memiliki Hammer (Palu) 3. Isi Warden Box dimonitor sesuai ketentuan BC Apaka` ]
            || ""
          ]);
        } else if (suffix === '2'){
          sectionData.push([
            "Apakah Warden Box memenuhi seluruh standar yang tertera ?",
            rowClean[`Berikut merupakan standar pemasangan warden box : 1. Warden Box dipasang ditempat yang mudah untuk dijangkau 2. Warden Box memiliki Hammer (Palu) 3. Isi Warden Box dimonitor sesuai ketentuan BC Apakah` ]
            || ""
          ]);
        } else if (suffix === '3'){
          sectionData.push([
            "Apakah Warden Box memenuhi seluruh standar yang tertera ?",
            rowClean[`Berikut merupakan standar pemasangan warden box : 1. Warden Box dipasang ditempat yang mudah untuk dijangkau 2. Warden Box memiliki Hammer (Palu) 3. Isi Warden Box dimonitor sesuai ketentuan BC Apaka1` ]
            || ""
          ]);
        } else if (suffix === '4'){
          sectionData.push([
            "Apakah Warden Box memenuhi seluruh standar yang tertera ?",
            rowClean[`Berikut merupakan standar pemasangan warden box : 1. Warden Box dipasang ditempat yang mudah untuk dijangkau 2. Warden Box memiliki Hammer (Palu) 3. Isi Warden Box dimonitor sesuai ketentuan BC Apaka2` ]
            || ""
          ]);
        }
        sectionData.push(["Dari standar Warden Box di atas, kriteria mana yang belum terpenuhi ?", rowClean[`Dari standar Warden Box di atas, kriteria mana yang belum terpenuhi${suffix}`] || ""]);
        sectionData.push(["Lampirkan 1 sampel dokumentasi foto Warden Box dilantai ini", rowClean[`Lampirkan dokumentasi foto Warden Box yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)${suffix}`] || rowClean[`Lampirkan 1 sampel dokumentasi foto Warden Box dilantai ini yang telah sesuai seluruh standar di atas${suffix}`] ]);

        //Sprinkler/Smoke Detector/Heat Detector Question
        sectionData.push([""]);
        sectionData.push(["----SPRINKLER/SMOKE DETECTOR/HEAT DETECTOR---"]);
        sectionData.push(["Apakah Terdapat Sprinkler/Smoke Detector/Heat Detector ?", rowClean[`Apakah terdapat Sprinkler/Smoke Detector/Heat Detector di area/unit kerja?${suffix}`] || "" ]);
        sectionData.push(["Apakah Sprinkler/Smoke Detector/Heat Detector memenuhi seluruh standar yang tertera ?", rowClean[`Berikut merupakan standar Sprinkler / Smoke Detector / Heat Detector: 1. Sprinkler / Smoke Detector / Heat Detector tidak terhalang peralatan/aksesoris plafon 2. Sprinkler / Smoke Detector / Heat Dete${suffix}`] || "" ]);
        sectionData.push(["Dari standar Sprinkler/Smoke Detector/Heat Detector di atas, kriteria mana yang belum terpenuhi ?", rowClean[`Dari standar Sprinkler / Smoke Detector / Heat Detector di atas, kriteria mana yang belum terpenuhi${suffix}` ] || "" ]);
        sectionData.push(["Lampirkan 1 sampel dokumentasi foto Sprinkler/Smoke Detector/Heat Detector dilantai ini", rowClean[`Lampirkan dokumentasi foto Sprinkler/Smoke Detector/Heat Detector di lantai ini yang belum memenuhi standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpe${suffix}`] || rowClean[`Lampirkan 1 sampel dokumentasi foto Sprinkler/Smoke Detector/Heat Detector di lantai ini yang memenuhi standar di atas${suffix}`]]);

        //Tangga Darurat Question
        sectionData.push([""]);
        sectionData.push(["----TANGGA DARURAT---"]);
        sectionData.push(["Apakah Terdapat Tangga Darurat ?", rowClean[`Apakah terdapat Tangga darurat* di area/unit kerja? *)Tangga darurat/penyelamatan adalah tangga yang terletak di dalam bangunan yang harus terpisah dari ruang-ruang lain dengan dinding tahan api ${suffix}`] || rowClean[`Apakah terdapat Tangga darurat* di area/unit kerja? *)Tangga darurat/penyelamatan adalah tangga yang terletak di dalam bangunan yang harus terpisah dari ruang-ruang lain dengan dinding tahan api${suffix}`] ]);
        sectionData.push(["Apakah Tangga Darurat memenuhi seluruh standar yang tertera ?", rowClean[`Berikut merupakan standar Tangga Darurat : 1. Tangga Darurat memiliki emergency lamp 2. Tangga Darurat tidak terdapat barang-barang yang menghalangi 3. Terdapat rambu petunjuk di/menuju tangga darurat${suffix}`] || "" ]);
        sectionData.push(["Dari standar Tangga Darurat di atas, kriteria mana yang belum terpenuhi ?", rowClean[`Dari standar Tangga Darurat di atas, kriteria mana yang belum terpenuhi${suffix}`] || "" ]);
        sectionData.push(["Lampirkan 1 sampel dokumentasi foto Tangga Darurat dilantai ini", rowClean[`Lampirkan dokumentasi foto Tangga Darurat yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)${suffix}`] || rowClean[`Lampirkan 1 sampel dokumentasi foto Tangga Darurat dilantai ini yang telah sesuai seluruh standar di atas ${suffix}`]]);
        sectionData.push(["Jika tidak terdapat tangga darurat, apakah terdapat tangga operasional atau tangga lain yang bisa digunakan untuk evakuasi dalam kondisi darurat bencana4", rowClean[`Jika tidak terdapat tangga darurat, apakah terdapat tangga operasional atau tangga lain yang bisa digunakan untuk evakuasi dalam kondisi darurat bencana${suffix}`] || "" ]);

        //Ruang Area terbataras Question
        sectionData.push([""]);
        sectionData.push(["----Ruang Area Terbatas---"]);
        sectionData.push(["Apakah Terdapat Ruang Area Terbatas ?",rowClean[`Apakah di lantai ini terdapat Ruang Area Terbatas (R. Panel Distribusi/Hub) di area/unit kerja?${suffix}`] || ""]);
        sectionData.push(["Apakah Ruang Area Terbatas memenuhi seluruh standar yang tertera ?",rowClean[`Berikut merupakan standar Ruang Area Terbatas (Panel Distribusi/Hub) : 1. Terdapat APAR sesuai dengan ketentuan yang berlaku 2. Ruang area terbatas tidak terdapat barang-barang tidak terpakai 3. Terpa${suffix}`] || ""]);
        sectionData.push(["Dari standar Ruang Area Terbatas (Panel Distribusi/Hub) di atas, kriteria mana yang belum terpenuhi ?",rowClean[`Dari standar Ruang Area Terbatas (Panel Distribusi/Hub) di atas, kriteria mana yang belum terpenuhi${suffix}`] || ""]);
        sectionData.push(["Lampirkan 1 sampel dokumentasi foto Ruang Area Terbatas dilantai ini",rowClean[`Lampirkan dokumentasi foto Ruang Area Terbatas yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)${suffix}`] || rowClean[`Lampirkan 1 sampel dokumentasi foto Ruang Area Terbatas dilantai ini yang telah sesuai seluruh standar di atas${suffix}`]]);

        //Area Berlindung Question
        sectionData.push([""]);
        sectionData.push(["----Area Berlindung Gempa---"]);
        sectionData.push(["Apakah Terdapat Area Berlindung Gempa ?",rowClean[`Apakah terdapat Area / Tempat Berlindung (kolong meja/safety point) di area/unit kerja yang tidak terhalang benda dan dapat digunakan menjadi tempat berlindung pada saat gempa${suffix}`] || ""]);
        sectionData.push(["Lampiran Area/Tempat Berlindung",rowClean[`Lampirkan dokumentasi foto Area/Tempat Berlindung yang terhalang benda dan tidak dapat digunakan menjadi tempat berlindung pada saat gempa${suffix}`] || rowClean[`Lampirkan sampel dokumentasi foto Tempat Berlindung dilantai ini yang tidak terhalang benda dan dapat digunakan menjadi tempat berlindung pada saat gempa${suffix}`]]);

        //Assessment Declaration
        sectionData.push([""]);
        sectionData.push(["Apakah Telah dilakukan assessment ?",rowClean[`Dengan ini kami menyatakan bahwa seluruh item di lantai ini (area kerja) telah dilakukan assessment sesuai dengan standar dan ketentuan yang berlaku (kecuali sejumlah item yang telah dinyatakan belum ${suffix}`] || ""]);
        sectionData.push([""]);
      });

      return sectionData;
    });

    const combined = newSheets.flatMap((sheet) => [...sheet, [""]]);

    const ws = XLSX.utils.aoa_to_sheet(combined);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Form");

    const fileName = `FormSelfSurveyAreaKerjaK3_${statusGedung}_${namaGedung}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    generatedFiles.push({
      namaGedung, fileName, blob, statusGedung
    });
  });

  return generatedFiles;
}

//This function are used to generate slef survey peralatan
export function generateSelfSurveyPeralatanK3(excelData: ExcelRow[]) : GeneratedFile[]{
  // Group Excel By Nama Gedung
  const grouped = groupByNamaGedung(excelData);
  const generatedFiles: GeneratedFile[] = [];

  //Check for all question
  Object.entries(grouped).forEach(([namaGedung, items]) => {
    const statusGedung = items[0]["Pilih Gedung (KP/Kanwil/KCU/KCP)"] || "Tanpa Status";

    const newSheets = items.map((rowClean) => {
      const sectionData: (string | null)[][] = [];

      //Question for Nama Gedung
      sectionData.push([""]);
      sectionData.push(["Nama Gedung", rowClean["Nama Gedung (Contoh : Bekasi)"] || ""]);
      sectionData.push(["Status Gedung", rowClean["Pilih Gedung (KP/Kanwil/KCU/KCP)"] || ""]);

      //Poster PK3 Question
      sectionData.push([""]);
      sectionData.push(["----POSTER PK3---"]);
      sectionData.push(["Apakah terpasang Poster UU 1 Tahun 1970 (ukuran A3) ?", rowClean["Apakah terpasang Poster UU 1 Tahun 1970 (ukuran A3)?"] || ""]);
      sectionData.push(["Lantai Poster UU 1 Tahun 1970 terpasang", rowClean["Lantai Poster UU 1 Tahun 1970 terpasang"] || ""]);
      sectionData.push(["Area / Unit Kerja dimana Poster UU 1 Tahun 1970 terpasang ?", rowClean["Area / Unit Kerja dimana Poster UU 1 Tahun 1970 terpasang"]]);
      sectionData.push(["Lampirkan dokumentasi foto Poster UU 1 tahun 1970 yang telah terpasang di Gedung ini", rowClean["Lampirkan dokumentasi foto Poster UU 1 tahun 1970 yang telah terpasang di Gedung ini"]]);

      //Kawasan Area Merokok Question
      sectionData.push([""]);
      sectionData.push(["----KAWASAN AREA MEROKOK---"]);
      sectionData.push(["Apakah terpasang Rambu Kawasan dilarang merokok ?", rowClean["Apakah terpasang Rambu Kawasan dilarang merokok?* *Di area publik untuk menandakan bahwa gedung BCA adalah kawasan bebas rokok"] || ""]);
      sectionData.push(["Lantai Rambu Kawasan dilarang merokok terpasang", rowClean["Lantai Rambu Kawasan dilarang merokok terpasang"] || ""]);
      sectionData.push(["Area / Unit Kerja dimana rambu kawasan dilarang merokok terpasang ?", rowClean["Area / Unit Kerja dimana rambu kawasan dilarang merokok terpasang"] || ""]);
      sectionData.push(["Lampirkan dokumentasi Rambu dilarang Merokok yang telah terpasang di Gedung ini", rowClean["Lampirkan dokumentasi Rambu dilarang Merokok yang telah terpasang di Gedung ini"] || ""]);

      //AED Question
      sectionData.push([""]);
      sectionData.push(["----AED---"]);
      sectionData.push(["Apakah terdapat AED ?", rowClean["Apakah terdapat AED"] || ""]);
      sectionData.push(["Lantai dimana AED berada ?", rowClean["Lantai dimana AED berada"] || ""]);
      sectionData.push(["Area / Unit Kerja dimana AED berada ?", rowClean["Area / Unit Kerja dimana AED berada"] || ""]);
      sectionData.push(["Berikut merupakan standar AED : 1. Baterai dan Pad AED tidak expired 2. AED dimonitor secara berkala 3. AED dalam kondisi standby dan siap digunakan apabila diperlukan Apakah AED memenuhi seluruh sta", rowClean["Berikut merupakan standar AED : 1. Baterai dan Pad AED tidak expired 2. AED dimonitor secara berkala 3. AED dalam kondisi standby dan siap digunakan apabila diperlukan Apakah AED memenuhi seluruh sta"] || ""]);
      sectionData.push(["Dari standar AED di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar AED di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto AED yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto AED yang berada di gedung ini"] || ""]);

      //P3K Question
      sectionData.push([""]);
      sectionData.push(["----P3K---"]);
      sectionData.push(["Apakah terdapat Kotak P3K ?", rowClean["Apakah terdapat Kotak P3K?"] || ""]);
      sectionData.push(["Apakah Kotak P3K berada di PIC yang seharusnya ?", rowClean["Apakah Kotak P3K berada di PIC yang seharusnya (Mengacu pada memo 092, 096, dan 097 MO MRK 2023) PIC Kotak P3K dapat dilihat pada gambar dibawah"] || ""]);
      sectionData.push(["Lantai & Unit Kerja dimana kotak P3K berada ?", rowClean["Lantai & Unit Kerja dimana kotak P3K berada"] || ""]);
      sectionData.push(["Apakah Kotak P3K memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Kotak P3K: 1. Isi obat di dalam kotak P3K sesuai dan tidak expired 2. Kotak P3K dimonitor secara berkala Apakah Kotak P3K memenuhi seluruh standar yang tertera?"] || ""]);
      sectionData.push(["Dari standar Kotak P3K di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Kotak P3K di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Kotak P3K yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Kotak P3K yang berada di gedung ini"] || ""]);

      //Tabung Oksigen Question
      sectionData.push([""]);
      sectionData.push(["----Tabung Oksigen---"]);
      sectionData.push(["Apakah terdapat Tabung Oksigen ?", rowClean["Apakah terdapat Tabung Oksigen (Penanggungjawab Tabung Oksigen adalah unit kerja APK)"] || ""]);
      sectionData.push(["Lantai dimana tabung oksigen berada ?", rowClean["Lantai dimana tabung oksigen berada"] || ""]);
      sectionData.push(["Area / Unit Kerja dimana tabung oksigen berada ?", rowClean["Area / Unit Kerja dimana tabung oksigen berada"] || ""]);
      sectionData.push(["Apakah Tabung Oksigen memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Tabung Oksigen : 1. Isi tabung oksigen di refill minimal setahun sekali 2. Tabung Oksigen dalam kondisi yang siap digunakan (Regulator terpasang pada tabung dan selang berada"] || ""]);
      sectionData.push(["Dari standar Tabung Oksigen di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Tabung Oksigen di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Tabung Oksigen yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Tabung Oksigen yang berada di gedung ini"] || ""]);

      //Ruang Menyusui Question
      sectionData.push([""]);
      sectionData.push(["----Ruang Menyusui---"]);
      sectionData.push(["Apakah terdapat Ruang Menyusui/Ruang Laktasi ?", rowClean["Apakah terdapat Ruang Menyusui/Ruang Laktasi"] || ""]);
      sectionData.push(["Lantai dimana Ruang Menyusui berada ?", rowClean["Lantai dimana Ruang Menyusui berada"] || ""]);
      sectionData.push(["Apakah Ruang Menyusui memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Menyusui : 1. Terpasang rambu/signage informasi nama ruangan 2. Perlengkapan di ruang menyusui/ruang laktasi tertata dengan baik (Kursi, Wastafel, Kulkas, dll) 3. Ruang"] || ""]);
      sectionData.push(["Dari standar Ruang Menyusui di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Menyusui di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Ruang Menyusui/Ruang Laktasi di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Menyusui/Ruang Laktasi di gedung ini"] || ""]);

      //Ruang Mesin Lift Question
      sectionData.push([""]);
      sectionData.push(["----Ruang Mesin Lift---"]);
      sectionData.push(["Apakah terdapat Ruang Mesin Lift ?", rowClean["Apakah terdapat Ruang Mesin Lift"] || ""]);
      sectionData.push(["Lantai dimana Ruang Mesin Lift berada ?", rowClean["Lantai dimana Ruang Mesin Lift berada"] || ""]);
      sectionData.push(["Apakah Ruang Mesin Lift memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Mesin Lift : 1. Terdapat rambu restricted area di pintu ruang mesin lift 2. Tidak terdapat barang-barang yang tidak terpakai di area ruang mesin lift 3. Terdapat APAR s"] || ""]);
      sectionData.push(["Dari standar Ruang Mesin Lift di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Mesin Lift di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Ruang Mesin Lift di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Mesin Lift di gedung ini"] || ""]);
      
      //Ruang Pompa Question
      sectionData.push([""]);
      sectionData.push(["----Ruang Pompa---"]);
      sectionData.push(["Apakah terdapat Ruang Pompa ?", rowClean["Apakah terdapat Ruang Pompa"] || ""]);
      sectionData.push(["Lantai dimana Ruang Pompa berada ?", rowClean["Lantai dimana Ruang Pompa berada"] || ""]);
      sectionData.push(["Apakah Ruang Pompa memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Pompa : 1. Terdapat rambu restricted area pada Pintu Ruang Pompa 2. Tidak terdapat barang-barang tidak terpakai di area ruang pompa 3. Terdapat APAR yang sesuai dengan"] || ""]);
      sectionData.push(["Dari standar Ruang Pompa di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Pompa di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Ruang Pompa di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Pompa di gedung ini"] || ""]);

      //Ruang Genset Question
      sectionData.push([""]);
      sectionData.push(["----Ruang Genset---"]);
      sectionData.push(["Apakah terdapat Ruang Genset ?", rowClean["Apakah terdapat Ruang Genset"] || ""]);
      sectionData.push(["Lantai dimana Ruang Genset berada ?", rowClean["Lantai dimana Ruang Genset berada"] || ""]);
      sectionData.push(["Apakah Ruang genset memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Genset : 1. Terdapat rambu restricted area, dilarang merokok, dan danger high voltage pada Pintu Ruang Genset 2. Tidak terdapat barang-barang tidak terpakai di area rua"] || ""]);
      sectionData.push(["Dari standar Ruang Genset di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Genset di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Ruang Genset di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Genset di gedung ini"] || ""]);
      
      //Ruang Trafo Question
      sectionData.push([""]);
      sectionData.push(["----Ruang Trafo---"]);
      sectionData.push(["Apakah terdapat Ruang Trafo ?", rowClean["Apakah terdapat Ruang Trafo"] || ""]);
      sectionData.push(["Lantai dimana Ruang Trafo berada ?", rowClean["Lantai dimana Ruang Trafo berada"] || ""]);
      sectionData.push(["Apakah Ruang Trafo memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Trafo : 1. Terdapat rambu restricted area, dilarang merokok, dan danger high voltage pada pintu ruang trafo 2. Tidak terdapat barang-barang tidak terpakai di area ruang"] || ""]);
      sectionData.push(["Dari standar Ruang Trafo di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Trafo di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Ruang Trafo di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Trafo di gedung ini"] || ""]);

      //Tangki Timbun Question
      sectionData.push([""]);
      sectionData.push(["----Tangki Timbun---"]);
      sectionData.push(["Apakah terdapat Tangki Timbun ?", rowClean["Apakah terdapat Tangki Timbun (berisi solar, dapat berada di bawah tanah maupun tidak)"] || ""]);
      sectionData.push(["Lantai dimana Tangki Timbun berada ?", rowClean["Lantai dimana Tangki Timbun berada"] || ""]);
      sectionData.push(["Apakah Tangki Timbun memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Tangki Timbun : 1. Terdapat rambu dilarang merokok pada area tangki timbun 2. Tidak terdapat barang-barang tidak terpakai di area tangki timbun (barang-barang tidak terpakai/"] || ""]);
      sectionData.push(["Dari standar Ruang Tangki Timbun di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Tangki Timbun di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Tangki Timbun di gedung ini", rowClean["Lampirkan dokumentasi foto Tangki Timbun di gedung ini"] || ""]);

      //Main Control Fire Alarm Question
      sectionData.push([""]);
      sectionData.push(["----MCFA---"]);
      sectionData.push(["Apakah terdapat MCFA (Main Control Fire Alarm) ?", rowClean["Apakah terdapat MCFA (Main Control Fire Alarm)"] || ""]);
      sectionData.push(["Lantai dimana MCFA berada ?", rowClean["Lantai dimana MCFA berada"] || ""]);
      sectionData.push(["Apakah Main Control Fire Alaram memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar MCFA : 1. MCFA berfungsi dengan baik (Dapat menangkap sinyal dari detector ataupun error akibat kerusakan detector) 2. Terdapat teknisi atau tim pengelola gedung / security y"] || ""]);
      sectionData.push(["Dari standar MCFA di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar MCFA di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto MCFA yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto MCFA yang berada di gedung ini"] || ""]);
      
      //Mesin Paging Question
      sectionData.push([""]);
      sectionData.push(["----Mesin Paging---"]);
      sectionData.push(["Apakah terdapat Mesin Paging ?", rowClean["Apakah terdapat Mesin Paging"] || ""]);
      sectionData.push(["Lantai dimana Mesin Paging berada ?", rowClean["Lantai dimana Mesin Paging berada"] || ""]);
      sectionData.push(["Apakah mesin Paging memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Mesin Paging : 1. Mesin Paging berfungsi dengan baik (Suara terdengar ke seluruh lantai) 2. Memiliki operator yang mengoperasikan mesin paging dan mendapatkan pelatihan Apak"] || ""]);
      sectionData.push(["Dari standar Mesin Paging di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Mesin Paging di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Mesin Paging yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Mesin Paging yang berada di gedung ini"] || ""]);

      //Hydrant Outdoor Question
      sectionData.push([""]);
      sectionData.push(["----Hydrant Outdoor---"]);
      sectionData.push(["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung) ?", rowClean["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung)"] || ""]);
      sectionData.push(["Apakah Hydrant Outdoor memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Hydrant Outdoor 1. Hydrant Outdoor dalam kondisi terawat dengan baik dan siap digunakan apabila diperlukan 2. Hydrant rutin dimonitor Apakah Hydrant Outdoor memenuhi seluruh"] || ""]);
      sectionData.push(["Dari standar Hydrant Outdoor di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Hydrant Outdoor di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Hydrant Outdoor yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Hydrant Outdoor yang berada di gedung ini"] || ""]);
      
      //Assembly Point Question
      sectionData.push([""]);
      sectionData.push(["----Assembly Point---"]);
      sectionData.push(["Apakah terdapat Titik Kumpul (Assembly Point) ?", rowClean["Apakah terdapat Titik Kumpul (Assembly Point)"] || ""]);
      sectionData.push(["Apakah Assembly Point memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Assembly Point : 1. Terpasang rambu assembly point yang dapat terlihat dengan jelas 2. Assembly point mudah diakses Apakah Assembly Point memenuhi seluruh standar yang terte"] || ""]);
      sectionData.push(["Dari standar Assembly Point di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Assembly Point di atas, kriteria mana yang belum terpenuhi"] || ""]);
      sectionData.push(["Lampirkan dokumentasi foto Assembly point yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Assembly point yang berada di gedung ini"] || ""]);

      //Assessment Declaration
      sectionData.push([""]);
      sectionData.push([""]);
      sectionData.push(["Dengan ini kami menyatakan bahwa seluruh item ini (Peralatan K3 & Utility) telah dilakukan assessment sesuai dengan standar dan ketentuan yang berlaku (kecuali sejumlah item yang telah dinyatakan bel", rowClean["Dengan ini kami menyatakan bahwa seluruh item ini (Peralatan K3 & Utility) telah dilakukan assessment sesuai dengan standar dan ketentuan yang berlaku (kecuali sejumlah item yang telah dinyatakan bel"] || ""]);

      return sectionData;
    });

    const combined = newSheets.flatMap((sheet) => [...sheet, [""]]);

    const ws = XLSX.utils.aoa_to_sheet(combined);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Form");

    const fileName = `FormSelfSurveyPeralatanK3_${statusGedung}_${namaGedung}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    generatedFiles.push({
      namaGedung, fileName, blob, statusGedung
    });
  });

  return generatedFiles;
}