import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as XLSX from "xlsx";

type ExcelRow = Record<string, any>;
type ExcelCell = string | null | { f: string };

export interface JsonRow {
  field: string;
  value: string | null;
}

//This variable are used to set GeneratedFile 
export interface GeneratedFile {
  statusGedung: string;
  namaGedung: string;
  fileName: string;
  tanggalPemeriksaan: string;
  wilayah: string;
  namaPemeriksa: string;
  namaPendampingPemeriksa: string;
  jumlahLantai: string;
  blob: Blob;

  previewDataSesuai?: ExcelCell[][];
  previewDataTidakSesuai?: ExcelCell[][];
  previewDataTidakAdaItem?: ExcelCell[][];

  jsonData?: {
    section: JsonRow[];
    sesuai: JsonRow[];
    tidakSesuai: JsonRow[];
    tidakAdaItem: JsonRow[];
  };
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

function aoaToJson(data: (string | null)[][]): { field: string, value: string | null }[] {
  return data
    .filter(row => row.length >= 2 && row[0]) // skip row kosong
    .map(row => ({
      field: String(row[0]),
      value: row[1] ?? null
    }));
}

function cellToString(cell: string | null | { f: string }): string | null {
  if (cell === null) return null;
  if (typeof cell === "string") return cell;
  if (typeof cell === "object" && "f" in cell) return `=${cell.f}`;
  return null;
}

function cleanExcelData(data: ExcelCell[][]): (string | null)[][] {
  return data.map(row =>
    row.map(cell => cellToString(cell))
  );
}

//This function are used to generate self servey area kerja
export function generateSelfSurveyAreaKerjaK3(excelData: ExcelRow[]): GeneratedFile[] {
  const grouped = groupByNamaGedung(excelData);
  const generatedFiles: GeneratedFile[] = [];

  Object.entries(grouped).forEach(([namaGedung, items]) => {
    const statusGedung = items[0]["Pilih Gedung (KP/Kanwil/KCU/KCP)"] || "Tanpa Status";
    const tanggalPemeriksaan = items[0]["Tanggal Pemeriksaan"];
    const wilayah = items[0]["Wilayah"];
    const namaPemeriksa = items[0]["Nama Pemeriksa (Jabatan) Notes : Untuk pengisian form diharapkan diisi oleh Kabag APK"];
    const namaPendampingPemeriksa = items[0]["Nama Pendamping Pemeriksa (Kepala Pengelola Gedung/BM) Notes: Apabila tidak memiliki Kepala Pengelola Gedung/BM dapat diisi dengan tanda \"-\""];
    const jumlahLantai = items[0]["Jumlah Lantai (Termasuk Basement & Rooftop) yang terdapat area kerja Apabila Jumlah Lantai yang terdapat area kerja di Gedung Bapak/Ibu lebih dari 5 lantai, dapat menghubungi tim K3"];

    const newSheets = items.map((rowClean) => {
      type ExcelCell = string | null | {f: string};

      const sectionData: ExcelCell[][] = [];
      const sesuaiData: ExcelCell[][] = [];
      const tidakSesuaiData: ExcelCell[][] = [];
      const tidakAdaItemData: ExcelCell[][] = [];

      const namaGedung = rowClean["Nama Gedung (Contoh : Bekasi)"];
      
      //Nama Gedung, Jumlah Lantai, and Status Gedung
      sectionData.push([""]);
      sectionData.push(["Nama Gedung", namaGedung]);
      sectionData.push(["Status Gedung", statusGedung]);
      sectionData.push(["Jumlah Lantai",jumlahLantai]);
      sectionData.push([""]);
      sectionData.push([""]);

      //Set looping floor
      const lantaiList = ["", "2", "3", "4", "5"]; 
      
      //Looping data for each floor
      lantaiList.forEach((index) => {
        //Set the suffix
        const suffix = index ? `${index}` : " ";

        const lantai = rowClean[`Lantai ${suffix}`] || rowClean[`Lantai`];
        const areaKerja = rowClean[`Area / Unit Kerja (Apabila terdapat Unit Kerja Kantor Pusat/Kantor Wilayah/Tenant/Hub atau area yang belum terdapat pada list, dapat ditambahkan pada opsi other)${suffix}`] || rowClean[`Area / Unit Kerja (Apabila terdapat Unit Kerja Kantor Pusat/Kantor Wilayah/Tenant/Hub atau area yang belum terdapat pada list, dapat ditambahkan pada opsi other)`];

        if (lantai && areaKerja) {
          sectionData.push(["Lantai", lantai]);
          sectionData.push(["Area/Unit Kerja", areaKerja]);

          sesuaiData.push(["Lantai", lantai]);
          sesuaiData.push(["Area/Unit Kerja", areaKerja]);

          tidakSesuaiData.push(["Lantai", lantai]);
          tidakSesuaiData.push(["Area/Unit Kerja", areaKerja]);

          tidakAdaItemData.push(["Lantai", lantai]);
          tidakAdaItemData.push(["Area/Unit Kerja", areaKerja]);
        }

        ///List pertanyaan
        const judulAPAR = "APAR";
        const adaAPAR = rowClean[`Apakah terdapat APAR di lantai ini? ${suffix}`] || rowClean[`Apakah terdapat APAR di lantai ini?`];
        const APARsesuai = rowClean[`Berikut merupakan standar Pemasangan APAR (Permenaker 4 Tahun 1980 & Memo Logistik No 063/MO/MP/2017) 1. Setiap satu atau kelompok APAR harus ditempatkan pada posisi yang mudah dilihat dengan jel...${suffix}`] || rowClean[`Berikut merupakan standar Pemasangan APAR (Permenaker 4 Tahun 1980 & Memo Logistik No 063/MO/MP/2017) 1. Setiap satu atau kelompok APAR harus ditempatkan pada posisi yang mudah dilihat dengan jel...`];
        const standarAPAR = rowClean[`Dari standar APAR di atas, kriteria mana yang belum terpenuhi${suffix}`] || rowClean[`Dari standar APAR di atas, kriteria mana yang belum terpenuhi,`];
        const lampiranAPAR = rowClean[`Lampirkan 1 sampel dokumentasi foto APAR dilantai ini yang telah sesuai seluruh standar di atas${suffix}`] || rowClean[`Lampirkan dokumentasi foto APAR yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)${suffix}`];

        const judulHydrant = "Hydrant";
        const adaHydrant = rowClean[`Apakah terdapat HYDRANT di lantai ini? ${suffix}`] || rowClean[`Apakah terdapat HYDRANT di lantai ini?`];
        const HydrantSesuai = rowClean[`Berikut merupakan standar pemasangan hydrant: 1. Hydrant dapat dilihat dengan jelas 2. Hydrant mudah untuk diakses (Tidak terhalang benda) 3. Hydrant dalam kondisi terawat dengan baik dan siap dig...${suffix}`] || rowClean[`Berikut merupakan standar pemasangan hydrant: 1. Hydrant dapat dilihat dengan jelas 2. Hydrant mudah untuk diakses (Tidak terhalang benda) 3. Hydrant dalam kondisi terawat dengan baik dan siap dig...`];
        const standarHydrant = rowClean[`Dari standar Hydrant di atas, kriteria mana yang belum terpenuhi ${suffix}`] || rowClean[`Dari standar Hydrant di atas, kriteria mana yang belum terpenuhi`];
        const lampiranHydrant = rowClean[`Lampirkan 1 sampel dokumentasi foto Hydrant dilantai ini yang telah sesuai seluruh standar di atas ${suffix}`] || 
              rowClean[`Lampirkan 1 sampel dokumentasi foto Hydrant dilantai ini yang telah sesuai seluruh standar di atas`] || 
              rowClean[`Lampirkan dokumentasi foto Hydrant yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)${suffix}`]  || 
              rowClean[`Lampirkan dokumentasi foto Hydrant yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)`];
        
        const judulWardenBox = "Warden Box";
        const adaWardenBox = rowClean[`Apakah terdapat Warden Box di lantai ini?${suffix}`] || rowClean[`Apakah terdapat Warden Box di lantai ini?`];
        const standarWardenBox = rowClean[`Dari standar Warden Box di atas, kriteria mana yang belum terpenuhi${suffix}`];
        const lampiranWardenBox= rowClean[`Lampirkan dokumentasi foto Warden Box yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)${suffix}`] || rowClean[`Lampirkan 1 sampel dokumentasi foto Warden Box dilantai ini yang telah sesuai seluruh standar di atas${suffix}`];
        let WardenBoxSesuai;
        if(suffix === "0" || suffix === "2"){
          WardenBoxSesuai = rowClean[`Berikut merupakan standar pemasangan warden box : 1. Warden Box dipasang ditempat yang mudah untuk dijangkau 2. Warden Box memiliki Hammer (Palu) 3. Isi Warden Box dimonitor sesuai ketentuan BC A...`];
        } else if (suffix === "3"){
          WardenBoxSesuai = rowClean[`Berikut merupakan standar pemasangan warden box : 1. Warden Box dipasang ditempat yang mudah untuk dijangkau 2. Warden Box memiliki Hammer (Palu) 3. Isi Warden Box dimonitor sesuai ketentuan BC Ap...`];
        } else if (suffix === "4"){
          WardenBoxSesuai = rowClean[`Berikut merupakan standar pemasangan warden box : 1. Warden Box dipasang ditempat yang mudah untuk dijangkau 2. Warden Box memiliki Hammer (Palu) 3. Isi Warden Box dimonitor sesuai ketentuan BC A...2`];
        } else if (suffix === "5"){
          WardenBoxSesuai = rowClean[`Berikut merupakan standar pemasangan warden box : 1. Warden Box dipasang ditempat yang mudah untuk dijangkau 2. Warden Box memiliki Hammer (Palu) 3. Isi Warden Box dimonitor sesuai ketentuan BC A...3`];
        }

        const judulSprinkler = "SPRINKLER/SMOKE DETECTOR/HEAT DETECTOR";
        const adaSprinkler = rowClean[`Apakah terdapat Sprinkler/Smoke Detector/Heat Detector di area/unit kerja?${suffix}`] || rowClean[`Apakah terdapat Sprinkler/Smoke Detector/Heat Detector di area/unit kerja?`];
        const SprinklerSesuai = rowClean[`Berikut merupakan standar Sprinkler / Smoke Detector / Heat Detector: 1. Sprinkler / Smoke Detector / Heat Detector tidak terhalang peralatan/aksesoris plafon 2. Sprinkler / Smoke Detector / Heat ...${suffix}`];
        const standarSprinkler = rowClean[`Dari standar Sprinkler / Smoke Detector / Heat Detector di atas, kriteria mana yang belum terpenuhi${suffix}` ];
        const lampiranSprinkler = rowClean[`Lampirkan dokumentasi foto Sprinkler/Smoke Detector/Heat Detector di lantai ini yang belum memenuhi standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum t...${suffix}`] || rowClean[`Lampirkan 1 sampel dokumentasi foto Sprinkler/Smoke Detector/Heat Detector di lantai ini yang memenuhi standar di atas${suffix}`];

        const judulTangga = "Tangga Darurat";
        const adaTangga = rowClean[`Apakah terdapat Tangga darurat* di area/unit kerja? *)Tangga darurat/penyelamatan adalah tangga yang terletak di dalam bangunan yang harus terpisah dari ruang-ruang lain dengan dinding tahan api ${suffix}`] || rowClean[`Apakah terdapat Tangga darurat* di area/unit kerja? *)Tangga darurat/penyelamatan adalah tangga yang terletak di dalam bangunan yang harus terpisah dari ruang-ruang lain dengan dinding tahan api${suffix}`];
        const TanggaSesuai = rowClean[`Berikut merupakan standar Tangga Darurat : 1. Tangga Darurat memiliki emergency lamp 2. Tangga Darurat tidak terdapat barang-barang yang menghalangi 3. Terdapat rambu petunjuk di/menuju tangga dar...${suffix}`];
        const standarTangga = rowClean[`Dari standar Tangga Darurat di atas, kriteria mana yang belum terpenuhi${suffix}`];
        const lampiranTangga = rowClean[`Lampirkan dokumentasi foto Tangga Darurat yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)${suffix}`] || rowClean[`Lampirkan 1 sampel dokumentasi foto Tangga Darurat dilantai ini yang telah sesuai seluruh standar di atas ${suffix}`] || rowClean[`Lampirkan 1 sampel dokumentasi foto Tangga Darurat dilantai ini yang telah sesuai seluruh standar di atas`];
        const tanggaOperasional = rowClean[`Jika tidak terdapat tangga darurat, apakah terdapat tangga operasional atau tangga lain yang bisa digunakan untuk evakuasi dalam kondisi darurat bencana${suffix}`];

        const judulRAT = "Ruang Area Terbatas";
        const adaRAT = rowClean[`Apakah di lantai ini terdapat Ruang Area Terbatas (R. Panel Distribusi/Hub) di area/unit kerja?${suffix}`];
        const RATsesuai = rowClean[`Berikut merupakan standar Ruang Area Terbatas (Panel Distribusi/Hub) : 1. Terdapat APAR sesuai dengan ketentuan yang berlaku 2. Ruang area terbatas tidak terdapat barang-barang tidak terpakai 3. T...${suffix}`] ;
        const standarRAT = rowClean[`Dari standar Ruang Area Terbatas (Panel Distribusi/Hub) di atas, kriteria mana yang belum terpenuhi${suffix}`];
        const lampiranRAT = rowClean[`Lampirkan dokumentasi foto Ruang Area Terbatas yang belum sesuai standar di atas (Jumlah foto dapat lebih dari 1 dan sesuai dengan checklist standar yang belum terpenuhi)${suffix}`] || rowClean[`Lampirkan 1 sampel dokumentasi foto Ruang Area Terbatas dilantai ini yang telah sesuai seluruh standar di atas${suffix}`];
        
        const judulAreaBerlindung = "Area Berlindung Gempa";
        const adaAreaBerlindung = rowClean[`Apakah terdapat Area / Tempat Berlindung (kolong meja/safety point) di area/unit kerja yang tidak terhalang benda dan dapat digunakan menjadi tempat berlindung pada saat gempa${suffix}`];
        const lampiranAreaBerlindung = rowClean[`Lampirkan dokumentasi foto Area/Tempat Berlindung yang terhalang benda dan tidak dapat digunakan menjadi tempat berlindung pada saat gempa${suffix}`] || rowClean[`Lampirkan sampel dokumentasi foto Tempat Berlindung dilantai ini yang tidak terhalang benda dan dapat digunakan menjadi tempat berlindung pada saat gempa${suffix}`];
        
        const checkAssessment = rowClean[`Dengan ini kami menyatakan bahwa seluruh item di lantai ini (area kerja) telah dilakukan assessment sesuai dengan standar dan ketentuan yang berlaku (kecuali sejumlah item yang telah dinyatakan belum ${suffix}`];

        //Ada APAR ?
        if(adaAPAR === "Ya"){
          if(APARsesuai === "Ya"){
            sesuaiData.push([judulAPAR, null]);
            sesuaiData.push(["Apakah Terdapat APAR ?", adaAPAR]);
            sesuaiData.push(["Apakah APAR memenuhi seluruh standar yang tertera ?", APARsesuai]);
            sesuaiData.push(["Lampirkan 1 sampel dokumentasi foto APAR di lantai ini", lampiranAPAR]);
          } else if (APARsesuai === "Tidak"){
            tidakSesuaiData.push([judulAPAR, null]);
            tidakSesuaiData.push(["Apakah Terdapat APAR ?", adaAPAR]);
            tidakSesuaiData.push(["Apakah APAR memenuhi seluruh standar yang tertera ?",APARsesuai]);
            tidakSesuaiData.push(["Dari standar APAR di atas, kriteria mana yang belum terpenuhi ?", standarAPAR]);
            tidakSesuaiData.push(["Lampirkan 1 sampel dokumentasi foto APAR di lantai ini", lampiranAPAR]);
          }
        } else if (adaAPAR === "Tidak") {
          tidakAdaItemData.push([judulAPAR, null]);
          tidakAdaItemData.push(["Apakah Terdapat APAR ?", adaAPAR]);
        }

        ///Ada Hydrant
        if(adaHydrant === "Ya"){
          if(HydrantSesuai === "Ya"){
            sesuaiData.push([judulHydrant]);
            sesuaiData.push(["Apakah Terdapat Hydrant ?", adaHydrant]);
            sesuaiData.push(["Apakah Hydrant memenuhi seluruh standar yang tertera ?", HydrantSesuai]);
            sesuaiData.push(["Lampirkan 1 sampel dokumentasi foto Hydrant dilantai ini", lampiranHydrant ]);
          } else if (HydrantSesuai === "Tidak"){
            tidakSesuaiData.push([judulHydrant]);
            tidakSesuaiData.push(["Apakah Terdapat Hydrant ?", adaHydrant]);
            tidakSesuaiData.push(["Apakah Hydrant memenuhi seluruh standar yang tertera ?", HydrantSesuai]);
            tidakSesuaiData.push(["Dari standar Hydrant di atas, kriteria mana yang belum terpenuhi ?", standarHydrant]);
            tidakSesuaiData.push(["Lampirkan 1 sampel dokumentasi foto Hydrant dilantai ini", lampiranHydrant ]);
          }
        } else if (adaHydrant === "Tidak"){
          tidakAdaItemData.push([judulHydrant]);
          tidakAdaItemData.push(["Apakah Terdapat Hydrant ?", adaHydrant]);
        }

        //Ada WardenBox
        if(adaWardenBox === "Ya"){
          if(WardenBoxSesuai === "Ya"){
            sesuaiData.push([judulWardenBox]);
            sesuaiData.push(["Apakah Terdapat Warden Box ?", adaWardenBox]);
            sesuaiData.push(["Apakah Warden Box memenuhi seluruh standar yang tertera ?", WardenBoxSesuai]);
            sesuaiData.push(["Lampirkan 1 sampel dokumentasi foto Warden Box dilantai ini", lampiranWardenBox ]);
          } else if (WardenBoxSesuai === "Tidak"){
            tidakSesuaiData.push([judulWardenBox]);
            tidakSesuaiData.push(["Apakah Terdapat Warden Box ?", adaWardenBox]);
            tidakSesuaiData.push(["Apakah Warden Box memenuhi seluruh standar yang tertera ?", WardenBoxSesuai]);
            tidakSesuaiData.push(["Dari standar Warden Box di atas, kriteria mana yang belum terpenuhi ?", standarWardenBox]);
            tidakSesuaiData.push(["Lampirkan 1 sampel dokumentasi foto Warden Box dilantai ini", lampiranWardenBox]);
          }
        } else if (adaWardenBox === "Tidak"){
          tidakAdaItemData.push([judulWardenBox]);
          tidakAdaItemData.push(["Apakah Terdapat Warden Box ?", adaWardenBox]);
        }

        //Ada Sprinkler
        if(adaSprinkler === "Ya " || adaSprinkler === "Ya"){
          if(SprinklerSesuai === "Ya"){
            sesuaiData.push([judulSprinkler]);
            sesuaiData.push(["Apakah Terdapat Sprinkler/Smoke Detector/Heat Detector ?", adaSprinkler ]);
            sesuaiData.push(["Apakah Sprinkler/Smoke Detector/Heat Detector memenuhi seluruh standar yang tertera ?", SprinklerSesuai ]);
            sesuaiData.push(["Lampirkan 1 sampel dokumentasi foto Sprinkler/Smoke Detector/Heat Detector dilantai ini", lampiranSprinkler]);
          } else if (SprinklerSesuai === "Tidak"){
            tidakSesuaiData.push([judulSprinkler]);
            tidakSesuaiData.push(["----SPRINKLER/SMOKE DETECTOR/HEAT DETECTOR---"]);
            tidakSesuaiData.push(["Apakah Terdapat Sprinkler/Smoke Detector/Heat Detector ?", adaSprinkler ]);
            tidakSesuaiData.push(["Apakah Sprinkler/Smoke Detector/Heat Detector memenuhi seluruh standar yang tertera ?", SprinklerSesuai ]);
            tidakSesuaiData.push(["Dari standar Sprinkler/Smoke Detector/Heat Detector di atas, kriteria mana yang belum terpenuhi ?", standarSprinkler ]);
            tidakSesuaiData.push(["Lampirkan 1 sampel dokumentasi foto Sprinkler/Smoke Detector/Heat Detector dilantai ini", lampiranSprinkler]);
          }
        } else if (adaSprinkler === "Tidak"){
          tidakAdaItemData.push([judulSprinkler]);
          tidakAdaItemData.push(["----SPRINKLER/SMOKE DETECTOR/HEAT DETECTOR---"]);
          tidakAdaItemData.push(["Apakah Terdapat Sprinkler/Smoke Detector/Heat Detector ?", adaSprinkler ]);
        }

        ///Ada Tangga Darurat
        if(adaTangga === "Ya" || adaTangga === "Ya "){
          if(TanggaSesuai === "Ya"){
            sesuaiData.push([judulTangga]);
            sesuaiData.push(["Apakah Terdapat Tangga Darurat ?", adaTangga ]);
            sesuaiData.push(["Apakah Tangga Darurat memenuhi seluruh standar yang tertera ?", TanggaSesuai]);
            sesuaiData.push(["Lampirkan 1 sampel dokumentasi foto Tangga Darurat dilantai ini", lampiranTangga]);
          } else if (TanggaSesuai === "Tidak"){
            tidakSesuaiData.push([judulTangga]);
            tidakSesuaiData.push(["Apakah Terdapat Tangga Darurat ?", adaTangga ]);
            tidakSesuaiData.push(["Apakah Tangga Darurat memenuhi seluruh standar yang tertera ?", TanggaSesuai]);
            tidakSesuaiData.push(["Dari standar Tangga Darurat di atas, kriteria mana yang belum terpenuhi ?", standarTangga ]);
            tidakSesuaiData.push(["Lampirkan 1 sampel dokumentasi foto Tangga Darurat dilantai ini", lampiranTangga]);
          }
        } else if (adaTangga === "Tidak"){
          tidakAdaItemData.push([""]);
          tidakAdaItemData.push(["----TANGGA DARURAT---"]);
          tidakAdaItemData.push(["Apakah Terdapat Tangga Darurat ?", adaTangga ]);
          tidakAdaItemData.push(["Apakah Tangga Operasional yang bisa digunakan untuk evakuasi dalam kondisi darurat ?", tanggaOperasional ]);
        }

        //Ada RAT
        if(adaRAT === "Ya" || adaRAT === "Ya "){
          if(RATsesuai === "Ya"){
            sesuaiData.push([judulRAT]);
            sesuaiData.push(["Apakah Terdapat Ruang Area Terbatas ?", adaRAT]);
            sesuaiData.push(["Apakah Ruang Area Terbatas memenuhi seluruh standar yang tertera ?", RATsesuai]);
            sesuaiData.push(["Lampirkan 1 sampel dokumentasi foto Ruang Area Terbatas dilantai ini",lampiranRAT]);
          } else if (RATsesuai === "Tidak"){
            tidakSesuaiData.push([judulRAT]);
            tidakSesuaiData.push(["Apakah Terdapat Ruang Area Terbatas ?", adaRAT]);
            tidakSesuaiData.push(["Apakah Ruang Area Terbatas memenuhi seluruh standar yang tertera ?", RATsesuai]);
            tidakSesuaiData.push(["Dari standar Ruang Area Terbatas (Panel Distribusi/Hub) di atas, kriteria mana yang belum terpenuhi ?", standarRAT]);
            tidakSesuaiData.push(["Lampirkan 1 sampel dokumentasi foto Ruang Area Terbatas dilantai ini",lampiranRAT]);
          }
        } else if (adaRAT === "Tidak"){
          tidakAdaItemData.push([judulRAT]);
          tidakAdaItemData.push(["Apakah Terdapat Ruang Area Terbatas ?", adaRAT]);
        }

        ///Ada Area Berlindung
        if(adaAreaBerlindung === "Tidak"){
          tidakAdaItemData.push([judulAreaBerlindung, null]);
          tidakAdaItemData.push(["Apakah Terdapat Area Berlindung Gempa ?", adaAreaBerlindung]);
        } else if(adaAreaBerlindung === "Ya") {
          sesuaiData.push([judulAreaBerlindung, null]);
          sesuaiData.push(["----Area Berlindung Gempa---"]);
          sesuaiData.push(["Apakah Terdapat Area Berlindung Gempa ?", adaAreaBerlindung]);
          sesuaiData.push(["Lampiran Area/Tempat Berlindung",lampiranAreaBerlindung]);
        }

        //Check Assessment
        if(checkAssessment){
          sectionData.push([""]);
          sectionData.push(["Apakah Telah dilakukan assessment ?",checkAssessment]);
          sectionData.push([""]);
        }

        sesuaiData.push([""]);
        tidakSesuaiData.push([""]);
        tidakAdaItemData.push([""]);
      });

      return {
        sectionData,
        sesuaiData,
        tidakSesuaiData,
        tidakAdaItemData,
      };
    });

    const semuaSectionData = newSheets.flatMap(sheet => [...sheet.sectionData, [""]]);
    const semuaSesuaiData = newSheets.flatMap(sheet => sheet.sesuaiData);
    const semuaTidakSesuaiData = newSheets.flatMap(sheet => sheet.tidakSesuaiData);
    const semuaTidakAdaItemData = newSheets.flatMap(sheet => sheet.tidakAdaItemData);

    const wb = XLSX.utils.book_new();

    if (semuaSectionData.length > 20) {
      const ws = XLSX.utils.aoa_to_sheet(semuaSectionData);
      XLSX.utils.book_append_sheet(wb, ws, "Form");
    }

    if (semuaSesuaiData.length > 20) {
      const wsSesuai = XLSX.utils.aoa_to_sheet(semuaSesuaiData);
      XLSX.utils.book_append_sheet(wb, wsSesuai, "Sesuai");
    }

    if(semuaTidakSesuaiData.length > 20){
      const wsTidakSesuai = XLSX.utils.aoa_to_sheet(semuaTidakSesuaiData);
      XLSX.utils.book_append_sheet(wb, wsTidakSesuai, "Tidak Sesuai");
    }
    
    if (semuaTidakAdaItemData.length > 20) {
      const wsTidakAdaItem = XLSX.utils.aoa_to_sheet(semuaTidakAdaItemData);
      XLSX.utils.book_append_sheet(wb, wsTidakAdaItem, "Tidak Ada Item");
    }

    const fileName = `FormSelfSurveyAreaKerjaK3_${statusGedung}_${namaGedung}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    const cleanedSectionData = cleanExcelData(semuaSectionData);
    const cleanedSesuaiData = cleanExcelData(semuaSesuaiData);
    const cleanedTidakSesuaiData = cleanExcelData(semuaTidakSesuaiData);
    const cleanedTidakAdaItemData = cleanExcelData(semuaTidakAdaItemData);

    const jsonSection = aoaToJson(cleanedSectionData);
    const jsonSesuai = aoaToJson(cleanedSesuaiData);
    const jsonTidakSesuai = aoaToJson(cleanedTidakSesuaiData);
    const jsonTidakAdaItem = aoaToJson(cleanedTidakAdaItemData);

    generatedFiles.push({
      namaGedung,
      fileName,
      blob,
      statusGedung,
      previewDataSesuai: semuaSesuaiData,
      previewDataTidakAdaItem: semuaTidakAdaItemData,
      previewDataTidakSesuai: semuaTidakSesuaiData,
      tanggalPemeriksaan: tanggalPemeriksaan,
      wilayah: wilayah,
      namaPemeriksa: namaPemeriksa,
      namaPendampingPemeriksa: namaPendampingPemeriksa,
      jumlahLantai: jumlahLantai,
      jsonData: {
        section: jsonSection,
        sesuai: jsonSesuai,
        tidakSesuai: jsonTidakSesuai,
        tidakAdaItem: jsonTidakAdaItem
      }
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
      const sesuaiData: (string | null)[][] = [];
      const tidakSesuaiData: (string | null)[][] = [];
      const tidakAdaItemData: (string | null)[][] = [];

      const namaGedung = rowClean["Nama Gedung (Contoh : Bekasi)"];

      //Question for Nama Gedung
      sectionData.push([""]);
      sectionData.push(["Nama Gedung", namaGedung]);
      sectionData.push(["Status Gedung", statusGedung]);

      const judulPosterPK3 = "Poster PK3";
      const AdaPosterPK3 = rowClean["Apakah terpasang Poster UU 1 Tahun 1970 (ukuran A3)?"];
      const LantaiPosterPK3 = rowClean["Lantai Poster UU 1 Tahun 1970 terpasang"];
      const AreaPosterPK3 = rowClean["Area / Unit Kerja dimana Poster UU 1 Tahun 1970 terpasang"];
      const LampiranPK3 = rowClean["Lampirkan dokumentasi foto Poster UU 1 tahun 1970 yang telah terpasang di Gedung ini"];

      if(AdaPosterPK3 === "Tidak"){
        tidakAdaItemData.push([judulPosterPK3]);
        tidakAdaItemData.push(["Apakah terpasang Poster UU 1 Tahun 1970 (ukuran A3) ?", AdaPosterPK3]);
      } else if (AdaPosterPK3 === "Ya") {
        sesuaiData.push([judulPosterPK3]);
        sesuaiData.push(["Apakah terpasang Poster UU 1 Tahun 1970 (ukuran A3) ?", AdaPosterPK3]);
        sesuaiData.push(["Lantai Poster UU 1 Tahun 1970 terpasang", LantaiPosterPK3]);
        sesuaiData.push(["Area / Unit Kerja dimana Poster UU 1 Tahun 1970 terpasang ?", AreaPosterPK3]);
        sesuaiData.push(["Lampirkan dokumentasi foto Poster UU 1 tahun 1970 yang telah terpasang di Gedung ini", LampiranPK3]);
      }

      const judulKawasanMerokok = "Kawasan Area Merokok";
      const AdaKawasanMerokok = rowClean["Apakah terpasang Rambu Kawasan dilarang merokok?* *Di area publik untuk menandakan bahwa gedung BCA adalah kawasan bebas rokok"];
      const LantaiKawasanMerokok = rowClean["Lantai Rambu Kawasan dilarang merokok terpasang"];
      const AreaKawasanMerokok = rowClean["Area / Unit Kerja dimana rambu kawasan dilarang merokok terpasang"];
      const LampiranKawasanMerokok = rowClean["Lampirkan dokumentasi Rambu dilarang Merokok yang telah terpasang di Gedung ini"];

      if(AdaKawasanMerokok === "Tidak"){
        //Kawasan Area Merokok Question
        tidakAdaItemData.push([judulKawasanMerokok]);
        tidakAdaItemData.push(["Apakah terpasang Rambu Kawasan dilarang merokok ?", AdaKawasanMerokok]);
      } else if (AdaKawasanMerokok === "Ya"){
        sesuaiData.push([judulKawasanMerokok]);
        sesuaiData.push(["Apakah terpasang Rambu Kawasan dilarang merokok ?", AdaKawasanMerokok]);
        sesuaiData.push(["Lantai Rambu Kawasan dilarang merokok terpasang", LantaiKawasanMerokok]);
        sesuaiData.push(["Area / Unit Kerja dimana rambu kawasan dilarang merokok terpasang ?", AreaKawasanMerokok]);
        sesuaiData.push(["Lampirkan dokumentasi Rambu dilarang Merokok yang telah terpasang di Gedung ini", LampiranKawasanMerokok]);
      }

      const judulAED = "AED";
      const AdaAED = rowClean["Apakah terdapat AED"];
      const LantaiAED = rowClean["Lantai dimana AED berada"];
      const AreaAED = rowClean["Area / Unit Kerja dimana AED berada"];
      const StandarAED = rowClean["Berikut merupakan standar AED : 1. Baterai dan Pad AED tidak expired 2. AED dimonitor secara berkala 3. AED dalam kondisi standby dan siap digunakan apabila diperlukan Apakah AED memenuhi seluruh..."];
      const KriteriaAED = rowClean["Dari standar AED di atas, kriteria mana yang belum terpenuhi"];
      const LampiranAED = rowClean["Lampirkan dokumentasi foto AED yang berada di gedung ini"];

      if(AdaAED === "Tidak"){
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----AED---"]);
        tidakAdaItemData.push(["Apakah terdapat AED ?", AdaAED]);
      } else if (AdaAED === "Ya"){

        if(StandarAED === "Tidak"){
          //AED Question
          tidakSesuaiData.push([judulAED]);
          tidakSesuaiData.push(["Apakah terdapat AED ?", AdaAED]);
          tidakSesuaiData.push(["Lantai dimana AED berada ?", LantaiAED]);
          tidakSesuaiData.push(["Area / Unit Kerja dimana AED berada ?", AreaAED]);
          tidakSesuaiData.push(["Apakah AED memenuhi seluruh standar yang tertera ?", StandarAED]);
          tidakSesuaiData.push(["Dari standar AED di atas, kriteria mana yang belum terpenuhi ?", KriteriaAED]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto AED yang berada di gedung ini", LampiranAED]);
        } else if (StandarAED === "Ya"){
          //AED Question
          sesuaiData.push([judulAED]);
          sesuaiData.push(["Apakah terdapat AED ?", AdaAED]);
          sesuaiData.push(["Lantai dimana AED berada ?", LantaiAED]);
          sesuaiData.push(["Area / Unit Kerja dimana AED berada ?", AreaAED]);
          sesuaiData.push(["Apakah AED memenuhi seluruh standar yang tertera ?", StandarAED]);
          sesuaiData.push(["Lampirkan dokumentasi foto AED yang berada di gedung ini", LampiranAED]);
        }
      }

      const judulP3K = "P3K";
      const AdaP3K = rowClean["Apakah terdapat Kotak P3K?"];
      const PICP3K = rowClean["Apakah Kotak P3K berada di PIC yang seharusnya (Mengacu pada memo 092, 096, dan 097 MO MRK 2023) PIC Kotak P3K dapat dilihat pada gambar dibawah"];
      const unitKerjaP3K = rowClean["Lantai & Unit Kerja dimana kotak P3K berada"];
      const P3KSesuai = rowClean["Berikut merupakan standar Kotak P3K: 1. Isi obat di dalam kotak P3K sesuai dan tidak expired 2. Kotak P3K dimonitor secara berkala Apakah Kotak P3K memenuhi seluruh standar yang tertera?"];
      const StandarP3K = rowClean["Dari standar Kotak P3K di atas, kriteria mana yang belum terpenuhi"];
      const LampiranP3K = rowClean["Lampirkan dokumentasi foto Kotak P3K yang berada di gedung ini"];

      if(AdaP3K === "Tidak"){
        //P3K Question
        tidakAdaItemData.push([judulP3K]);
        tidakAdaItemData.push(["Apakah terdapat Kotak P3K ?", AdaP3K]);
      } else if (AdaP3K === "Ya"){

        if(P3KSesuai === "Tidak"){
          //P3K Question
          tidakSesuaiData.push([judulP3K]);
          tidakSesuaiData.push(["Apakah terdapat Kotak P3K ?", AdaP3K]);
          tidakSesuaiData.push(["Apakah Kotak P3K berada di PIC yang seharusnya ?", PICP3K]);
          tidakSesuaiData.push(["Lantai & Unit Kerja dimana kotak P3K berada ?", unitKerjaP3K]);
          tidakSesuaiData.push(["Apakah Kotak P3K memenuhi seluruh standar yang tertera ?", P3KSesuai]);
          tidakSesuaiData.push(["Dari standar Kotak P3K di atas, kriteria mana yang belum terpenuhi ?", StandarP3K]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Kotak P3K yang berada di gedung ini", LampiranP3K]);
        } else if (P3KSesuai === "Ya"){
          //P3K Question
          sesuaiData.push([judulP3K]);
          sesuaiData.push(["Apakah terdapat Kotak P3K ?", AdaP3K]);
          sesuaiData.push(["Apakah Kotak P3K berada di PIC yang seharusnya ?", PICP3K]);
          sesuaiData.push(["Lantai & Unit Kerja dimana kotak P3K berada ?", unitKerjaP3K]);
          sesuaiData.push(["Apakah Kotak P3K memenuhi seluruh standar yang tertera ?", P3KSesuai]);
          sesuaiData.push(["Lampirkan dokumentasi foto Kotak P3K yang berada di gedung ini", LampiranP3K]);
        }
      }

      const AdaOksigen = rowClean["Apakah terdapat Tabung Oksigen (Penanggungjawab Tabung Oksigen adalah unit kerja APK)"];

      if(AdaOksigen === "Tidak"){
        //Tabung Oksigen Question
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----Tabung Oksigen---"]);
        tidakAdaItemData.push(["Apakah terdapat Tabung Oksigen ?", rowClean["Apakah terdapat Tabung Oksigen (Penanggungjawab Tabung Oksigen adalah unit kerja APK)"] || ""]);
        tidakAdaItemData.push(["Lantai dimana tabung oksigen berada ?", rowClean["Lantai dimana tabung oksigen berada"] || ""]);
        tidakAdaItemData.push(["Area / Unit Kerja dimana tabung oksigen berada ?", rowClean["Area / Unit Kerja dimana tabung oksigen berada"] || ""]);
        tidakAdaItemData.push(["Apakah Tabung Oksigen memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Tabung Oksigen : 1. Isi tabung oksigen di refill minimal setahun sekali 2. Tabung Oksigen dalam kondisi yang siap digunakan (Regulator terpasang pada tabung dan selang be..."] || ""]);
        tidakAdaItemData.push(["Dari standar Tabung Oksigen di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Tabung Oksigen di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto Tabung Oksigen yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Tabung Oksigen yang berada di gedung ini"] || ""]);
      } else if (AdaOksigen === "Ya "){
        const OksigenSesuai = rowClean["Berikut merupakan standar Tabung Oksigen : 1. Isi tabung oksigen di refill minimal setahun sekali 2. Tabung Oksigen dalam kondisi yang siap digunakan (Regulator terpasang pada tabung dan selang be..."] ;

        if(OksigenSesuai === "Tidak"){
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----Tabung Oksigen---"]);
          tidakSesuaiData.push(["Apakah terdapat Tabung Oksigen ?", rowClean["Apakah terdapat Tabung Oksigen (Penanggungjawab Tabung Oksigen adalah unit kerja APK)"] || ""]);
          tidakSesuaiData.push(["Lantai dimana tabung oksigen berada ?", rowClean["Lantai dimana tabung oksigen berada"] || ""]);
          tidakSesuaiData.push(["Area / Unit Kerja dimana tabung oksigen berada ?", rowClean["Area / Unit Kerja dimana tabung oksigen berada"] || ""]);
          tidakSesuaiData.push(["Apakah Tabung Oksigen memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Tabung Oksigen : 1. Isi tabung oksigen di refill minimal setahun sekali 2. Tabung Oksigen dalam kondisi yang siap digunakan (Regulator terpasang pada tabung dan selang be..."] || ""]);
          tidakSesuaiData.push(["Dari standar Tabung Oksigen di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Tabung Oksigen di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Tabung Oksigen yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Tabung Oksigen yang berada di gedung ini"] || ""]);
        } else if (OksigenSesuai === "Ya"){
          sesuaiData.push([""]);
          sesuaiData.push(["----Tabung Oksigen---"]);
          sesuaiData.push(["Apakah terdapat Tabung Oksigen ?", rowClean["Apakah terdapat Tabung Oksigen (Penanggungjawab Tabung Oksigen adalah unit kerja APK)"] || ""]);
          sesuaiData.push(["Lantai dimana tabung oksigen berada ?", rowClean["Lantai dimana tabung oksigen berada"] || ""]);
          sesuaiData.push(["Area / Unit Kerja dimana tabung oksigen berada ?", rowClean["Area / Unit Kerja dimana tabung oksigen berada"] || ""]);
          sesuaiData.push(["Apakah Tabung Oksigen memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Tabung Oksigen : 1. Isi tabung oksigen di refill minimal setahun sekali 2. Tabung Oksigen dalam kondisi yang siap digunakan (Regulator terpasang pada tabung dan selang be..."] || ""]);
          sesuaiData.push(["Dari standar Tabung Oksigen di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Tabung Oksigen di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto Tabung Oksigen yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Tabung Oksigen yang berada di gedung ini"] || ""]);
        }
      }

      const AdaMenyusui = rowClean["Apakah terdapat Ruang Menyusui/Ruang Laktasi"];

      if(AdaMenyusui === "Tidak"){
        //Ruang Menyusui Question
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----Ruang Menyusui---"]);
        tidakAdaItemData.push(["Apakah terdapat Ruang Menyusui/Ruang Laktasi ?", rowClean["Apakah terdapat Ruang Menyusui/Ruang Laktasi"] || ""]);
        tidakAdaItemData.push(["Lantai dimana Ruang Menyusui berada ?", rowClean["Lantai dimana Ruang Menyusui berada"] || ""]);
        tidakAdaItemData.push(["Apakah Ruang Menyusui memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Menyusui : 1. Terpasang rambu/signage informasi nama ruangan 2. Perlengkapan di ruang menyusui/ruang laktasi tertata dengan baik (Kursi, Wastafel, Kulkas, dll) 3. R..."] || ""]);
        tidakAdaItemData.push(["Dari standar Ruang Menyusui di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Menyusui di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto Ruang Menyusui/Ruang Laktasi di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Menyusui/Ruang Laktasi di gedung ini"] || ""]);
      } else if (AdaMenyusui === "Ya"){
        const MenyusuiSesuai = rowClean["Berikut merupakan standar Ruang Menyusui : 1. Terpasang rambu/signage informasi nama ruangan 2. Perlengkapan di ruang menyusui/ruang laktasi tertata dengan baik (Kursi, Wastafel, Kulkas, dll) 3. R..."];

        if(MenyusuiSesuai === "Tidak"){
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----Ruang Menyusui---"]);
          tidakSesuaiData.push(["Apakah terdapat Ruang Menyusui/Ruang Laktasi ?", rowClean["Apakah terdapat Ruang Menyusui/Ruang Laktasi"] || ""]);
          tidakSesuaiData.push(["Lantai dimana Ruang Menyusui berada ?", rowClean["Lantai dimana Ruang Menyusui berada"] || ""]);
          tidakSesuaiData.push(["Apakah Ruang Menyusui memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Menyusui : 1. Terpasang rambu/signage informasi nama ruangan 2. Perlengkapan di ruang menyusui/ruang laktasi tertata dengan baik (Kursi, Wastafel, Kulkas, dll) 3. R..."] || ""]);
          tidakSesuaiData.push(["Dari standar Ruang Menyusui di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Menyusui di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Ruang Menyusui/Ruang Laktasi di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Menyusui/Ruang Laktasi di gedung ini"] || ""]);
        } else if (MenyusuiSesuai === "Ya"){
          sesuaiData.push([""]);
          sesuaiData.push(["----Ruang Menyusui---"]);
          sesuaiData.push(["Apakah terdapat Ruang Menyusui/Ruang Laktasi ?", rowClean["Apakah terdapat Ruang Menyusui/Ruang Laktasi"] || ""]);
          sesuaiData.push(["Lantai dimana Ruang Menyusui berada ?", rowClean["Lantai dimana Ruang Menyusui berada"] || ""]);
          sesuaiData.push(["Apakah Ruang Menyusui memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Menyusui : 1. Terpasang rambu/signage informasi nama ruangan 2. Perlengkapan di ruang menyusui/ruang laktasi tertata dengan baik (Kursi, Wastafel, Kulkas, dll) 3. R..."] || ""]);
          sesuaiData.push(["Dari standar Ruang Menyusui di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Menyusui di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto Ruang Menyusui/Ruang Laktasi di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Menyusui/Ruang Laktasi di gedung ini"] || ""]);
        }
      }

      const AdaRuangMesin = rowClean["Apakah terdapat Ruang Mesin Lift"];

      if(AdaRuangMesin === "Tidak"){
        //Ruang Mesin Lift Question
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----Ruang Mesin Lift---"]);
        tidakAdaItemData.push(["Apakah terdapat Ruang Mesin Lift ?", rowClean["Apakah terdapat Ruang Mesin Lift"] || ""]);
        tidakAdaItemData.push(["Lantai dimana Ruang Mesin Lift berada ?", rowClean["Lantai dimana Ruang Mesin Lift berada"] || ""]);
        tidakAdaItemData.push(["Apakah Ruang Mesin Lift memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Mesin Lift : 1. Terdapat rambu restricted area di pintu ruang mesin lift 2. Tidak terdapat barang-barang yang tidak terpakai di area ruang mesin lift 3. Terdapat AP..."] || ""]);
        tidakAdaItemData.push(["Dari standar Ruang Mesin Lift di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Mesin Lift di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto Ruang Mesin Lift di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Mesin Lift di gedung ini"] || ""]);
      } else if (AdaRuangMesin === "Ya"){
        const RuangMesinSesuai = rowClean["Berikut merupakan standar Ruang Mesin Lift : 1. Terdapat rambu restricted area di pintu ruang mesin lift 2. Tidak terdapat barang-barang yang tidak terpakai di area ruang mesin lift 3. Terdapat AP..."];

        if(RuangMesinSesuai === "Tidak"){
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----Ruang Mesin Lift---"]);
          tidakSesuaiData.push(["Apakah terdapat Ruang Mesin Lift ?", rowClean["Apakah terdapat Ruang Mesin Lift"] || ""]);
          tidakSesuaiData.push(["Lantai dimana Ruang Mesin Lift berada ?", rowClean["Lantai dimana Ruang Mesin Lift berada"] || ""]);
          tidakSesuaiData.push(["Apakah Ruang Mesin Lift memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Mesin Lift : 1. Terdapat rambu restricted area di pintu ruang mesin lift 2. Tidak terdapat barang-barang yang tidak terpakai di area ruang mesin lift 3. Terdapat AP..."] || ""]);
          tidakSesuaiData.push(["Dari standar Ruang Mesin Lift di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Mesin Lift di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Ruang Mesin Lift di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Mesin Lift di gedung ini"] || ""]);
        } else if (RuangMesinSesuai === "Ya"){
          sesuaiData.push([""]);
          sesuaiData.push(["----Ruang Mesin Lift---"]);
          sesuaiData.push(["Apakah terdapat Ruang Mesin Lift ?", rowClean["Apakah terdapat Ruang Mesin Lift"] || ""]);
          sesuaiData.push(["Lantai dimana Ruang Mesin Lift berada ?", rowClean["Lantai dimana Ruang Mesin Lift berada"] || ""]);
          sesuaiData.push(["Apakah Ruang Mesin Lift memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Mesin Lift : 1. Terdapat rambu restricted area di pintu ruang mesin lift 2. Tidak terdapat barang-barang yang tidak terpakai di area ruang mesin lift 3. Terdapat AP..."] || ""]);
          sesuaiData.push(["Dari standar Ruang Mesin Lift di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Mesin Lift di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto Ruang Mesin Lift di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Mesin Lift di gedung ini"] || ""]);
        }
      }

      const AdaRuangPompa = rowClean["Apakah terdapat Ruang Pompa"];

      if(AdaRuangPompa === "Tidak"){
        //Ruang Pompa Question
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----Ruang Pompa---"]);
        tidakAdaItemData.push(["Apakah terdapat Ruang Pompa ?", rowClean["Apakah terdapat Ruang Pompa"] || ""]);
        tidakAdaItemData.push(["Lantai dimana Ruang Pompa berada ?", rowClean["Lantai dimana Ruang Pompa berada"] || ""]);
        tidakAdaItemData.push(["Apakah Ruang Pompa memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Pompa : 1. Terdapat rambu restricted area pada Pintu Ruang Pompa 2. Tidak terdapat barang-barang tidak terpakai di area ruang pompa 3. Terdapat APAR yang sesuai den..."] || ""]);
        tidakAdaItemData.push(["Dari standar Ruang Pompa di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Pompa di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto Ruang Pompa di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Pompa di gedung ini"] || ""]);
      } else if (AdaRuangPompa === "Ya"){
        const RuangPompaSesuai = rowClean["Berikut merupakan standar Ruang Pompa : 1. Terdapat rambu restricted area pada Pintu Ruang Pompa 2. Tidak terdapat barang-barang tidak terpakai di area ruang pompa 3. Terdapat APAR yang sesuai den..."];

        if(RuangPompaSesuai === "Tidak") {
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----Ruang Pompa---"]);
          tidakSesuaiData.push(["Apakah terdapat Ruang Pompa ?", rowClean["Apakah terdapat Ruang Pompa"] || ""]);
          tidakSesuaiData.push(["Lantai dimana Ruang Pompa berada ?", rowClean["Lantai dimana Ruang Pompa berada"] || ""]);
          tidakSesuaiData.push(["Apakah Ruang Pompa memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Pompa : 1. Terdapat rambu restricted area pada Pintu Ruang Pompa 2. Tidak terdapat barang-barang tidak terpakai di area ruang pompa 3. Terdapat APAR yang sesuai den..."] || ""]);
          tidakSesuaiData.push(["Dari standar Ruang Pompa di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Pompa di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Ruang Pompa di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Pompa di gedung ini"] || ""]);
        } else if (RuangPompaSesuai === "Ya"){
          //Ruang Pompa Question
          sesuaiData.push([""]);
          sesuaiData.push(["----Ruang Pompa---"]);
          sesuaiData.push(["Apakah terdapat Ruang Pompa ?", rowClean["Apakah terdapat Ruang Pompa"] || ""]);
          sesuaiData.push(["Lantai dimana Ruang Pompa berada ?", rowClean["Lantai dimana Ruang Pompa berada"] || ""]);
          sesuaiData.push(["Apakah Ruang Pompa memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Pompa : 1. Terdapat rambu restricted area pada Pintu Ruang Pompa 2. Tidak terdapat barang-barang tidak terpakai di area ruang pompa 3. Terdapat APAR yang sesuai den..."] || ""]);
          sesuaiData.push(["Dari standar Ruang Pompa di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Pompa di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto Ruang Pompa di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Pompa di gedung ini"] || ""]);
        }
      }

      const AdaRuangGenset = rowClean["Apakah terdapat Ruang Genset"];

      if(AdaRuangGenset === "Tidak"){
        //Ruang Genset Question
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----Ruang Genset---"]);
        tidakAdaItemData.push(["Apakah terdapat Ruang Genset ?", rowClean["Apakah terdapat Ruang Genset"] || ""]);
        tidakAdaItemData.push(["Lantai dimana Ruang Genset berada ?", rowClean["Lantai dimana Ruang Genset berada"] || ""]);
        tidakAdaItemData.push(["Apakah Ruang genset memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Genset : 1. Terdapat rambu restricted area, dilarang merokok, dan danger high voltage pada Pintu Ruang Genset 2. Tidak terdapat barang-barang tidak terpakai di area..."] || ""]);
        tidakAdaItemData.push(["Dari standar Ruang Genset di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Genset di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto Ruang Genset di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Genset di gedung ini"] || ""]);
      } else if (AdaRuangGenset === "Ya"){
        const RuangGensetSesuai = rowClean["Berikut merupakan standar Ruang Genset : 1. Terdapat rambu restricted area, dilarang merokok, dan danger high voltage pada Pintu Ruang Genset 2. Tidak terdapat barang-barang tidak terpakai di area..."];

        if(RuangGensetSesuai === "Tidak"){
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----Ruang Genset---"]);
          tidakSesuaiData.push(["Apakah terdapat Ruang Genset ?", rowClean["Apakah terdapat Ruang Genset"] || ""]);
          tidakSesuaiData.push(["Lantai dimana Ruang Genset berada ?", rowClean["Lantai dimana Ruang Genset berada"] || ""]);
          tidakSesuaiData.push(["Apakah Ruang genset memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Genset : 1. Terdapat rambu restricted area, dilarang merokok, dan danger high voltage pada Pintu Ruang Genset 2. Tidak terdapat barang-barang tidak terpakai di area..."] || ""]);
          tidakSesuaiData.push(["Dari standar Ruang Genset di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Genset di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Ruang Genset di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Genset di gedung ini"] || ""]);
        } else if (RuangGensetSesuai === "Ya"){
          sesuaiData.push([""]);
          sesuaiData.push(["----Ruang Genset---"]);
          sesuaiData.push(["Apakah terdapat Ruang Genset ?", rowClean["Apakah terdapat Ruang Genset"] || ""]);
          sesuaiData.push(["Lantai dimana Ruang Genset berada ?", rowClean["Lantai dimana Ruang Genset berada"] || ""]);
          sesuaiData.push(["Apakah Ruang genset memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Genset : 1. Terdapat rambu restricted area, dilarang merokok, dan danger high voltage pada Pintu Ruang Genset 2. Tidak terdapat barang-barang tidak terpakai di area..."] || ""]);
          sesuaiData.push(["Dari standar Ruang Genset di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Genset di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto Ruang Genset di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Genset di gedung ini"] || ""]);
        }
      }
      
      const AdaRuangTrafo = rowClean["Apakah terdapat Ruang Trafo"];

      if(AdaRuangTrafo === "Tidak"){
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----Ruang Trafo---"]);
        tidakAdaItemData.push(["Apakah terdapat Ruang Trafo ?", rowClean["Apakah terdapat Ruang Trafo"] || ""]);
        tidakAdaItemData.push(["Lantai dimana Ruang Trafo berada ?", rowClean["Lantai dimana Ruang Trafo berada"] || ""]);
        tidakAdaItemData.push(["Apakah Ruang Trafo memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Trafo : 1. Terdapat rambu restricted area, dilarang merokok, dan danger high voltage pada pintu ruang trafo 2. Tidak terdapat barang-barang tidak terpakai di area r..."] || ""]);
        tidakAdaItemData.push(["Dari standar Ruang Trafo di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Trafo di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto Ruang Trafo di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Trafo di gedung ini"] || ""]);
      } else if (AdaRuangTrafo === "Ya"){
        const RuangTrafoSesuai = rowClean["Berikut merupakan standar Ruang Trafo : 1. Terdapat rambu restricted area, dilarang merokok, dan danger high voltage pada pintu ruang trafo 2. Tidak terdapat barang-barang tidak terpakai di area r..."]; 

        if(RuangTrafoSesuai === "Tidak"){
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----Ruang Trafo---"]);
          tidakSesuaiData.push(["Apakah terdapat Ruang Trafo ?", rowClean["Apakah terdapat Ruang Trafo"] || ""]);
          tidakSesuaiData.push(["Lantai dimana Ruang Trafo berada ?", rowClean["Lantai dimana Ruang Trafo berada"] || ""]);
          tidakSesuaiData.push(["Apakah Ruang Trafo memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Trafo : 1. Terdapat rambu restricted area, dilarang merokok, dan danger high voltage pada pintu ruang trafo 2. Tidak terdapat barang-barang tidak terpakai di area r..."] || ""]);
          tidakSesuaiData.push(["Dari standar Ruang Trafo di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Trafo di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Ruang Trafo di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Trafo di gedung ini"] || ""]);
        } else if (RuangTrafoSesuai === "Ya"){
          sesuaiData.push([""]);
          sesuaiData.push(["----Ruang Trafo---"]);
          sesuaiData.push(["Apakah terdapat Ruang Trafo ?", rowClean["Apakah terdapat Ruang Trafo"] || ""]);
          sesuaiData.push(["Lantai dimana Ruang Trafo berada ?", rowClean["Lantai dimana Ruang Trafo berada"] || ""]);
          sesuaiData.push(["Apakah Ruang Trafo memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Ruang Trafo : 1. Terdapat rambu restricted area, dilarang merokok, dan danger high voltage pada pintu ruang trafo 2. Tidak terdapat barang-barang tidak terpakai di area r..."] || ""]);
          sesuaiData.push(["Dari standar Ruang Trafo di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Trafo di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto Ruang Trafo di gedung ini", rowClean["Lampirkan dokumentasi foto Ruang Trafo di gedung ini"] || ""]);
        }
      }

      const AdaTangkiTimbun = rowClean["Apakah terdapat Tangki Timbun (berisi solar, dapat berada di bawah tanah maupun tidak)"];

      if(AdaTangkiTimbun === "Tidak"){

        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----Tangki Timbun---"]);
        tidakAdaItemData.push(["Apakah terdapat Tangki Timbun ?", rowClean["Apakah terdapat Tangki Timbun (berisi solar, dapat berada di bawah tanah maupun tidak)"] || ""]);
        tidakAdaItemData.push(["Lantai dimana Tangki Timbun berada ?", rowClean["Lantai dimana Tangki Timbun berada"] || ""]);
        tidakAdaItemData.push(["Apakah Tangki Timbun memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Tangki Timbun : 1. Terdapat rambu dilarang merokok pada area tangki timbun 2. Tidak terdapat barang-barang tidak terpakai di area tangki timbun (barang-barang tidak terpa..."] || ""]);
        tidakAdaItemData.push(["Dari standar Ruang Tangki Timbun di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Tangki Timbun di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto Tangki Timbun di gedung ini", rowClean["Lampirkan dokumentasi foto Tangki Timbun di gedung ini"] || ""]);
      } else if (AdaTangkiTimbun === "Ya"){

        const TangkiTimbunSesuai = rowClean["Berikut merupakan standar Tangki Timbun : 1. Terdapat rambu dilarang merokok pada area tangki timbun 2. Tidak terdapat barang-barang tidak terpakai di area tangki timbun (barang-barang tidak terpa..."];

        if(TangkiTimbunSesuai === "Tidak"){
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----Tangki Timbun---"]);
          tidakSesuaiData.push(["Apakah terdapat Tangki Timbun ?", rowClean["Apakah terdapat Tangki Timbun (berisi solar, dapat berada di bawah tanah maupun tidak)"] || ""]);
          tidakSesuaiData.push(["Lantai dimana Tangki Timbun berada ?", rowClean["Lantai dimana Tangki Timbun berada"] || ""]);
          tidakSesuaiData.push(["Apakah Tangki Timbun memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Tangki Timbun : 1. Terdapat rambu dilarang merokok pada area tangki timbun 2. Tidak terdapat barang-barang tidak terpakai di area tangki timbun (barang-barang tidak terpa..."] || ""]);
          tidakSesuaiData.push(["Dari standar Ruang Tangki Timbun di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Tangki Timbun di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Tangki Timbun di gedung ini", rowClean["Lampirkan dokumentasi foto Tangki Timbun di gedung ini"] || ""]);

        } else if (TangkiTimbunSesuai === "Ya"){
          sesuaiData.push([""]);
          sesuaiData.push(["----Tangki Timbun---"]);
          sesuaiData.push(["Apakah terdapat Tangki Timbun ?", rowClean["Apakah terdapat Tangki Timbun (berisi solar, dapat berada di bawah tanah maupun tidak)"] || ""]);
          sesuaiData.push(["Lantai dimana Tangki Timbun berada ?", rowClean["Lantai dimana Tangki Timbun berada"] || ""]);
          sesuaiData.push(["Apakah Tangki Timbun memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Tangki Timbun : 1. Terdapat rambu dilarang merokok pada area tangki timbun 2. Tidak terdapat barang-barang tidak terpakai di area tangki timbun (barang-barang tidak terpa..."] || ""]);
          sesuaiData.push(["Dari standar Ruang Tangki Timbun di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Ruang Tangki Timbun di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto Tangki Timbun di gedung ini", rowClean["Lampirkan dokumentasi foto Tangki Timbun di gedung ini"] || ""]);
          }
        
      }

      const AdaMCFA = rowClean["Apakah terdapat MCFA (Main Control Fire Alarm)"];

      if(AdaMCFA === "Tidak"){
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----MCFA---"]);
        tidakAdaItemData.push(["Apakah terdapat MCFA (Main Control Fire Alarm) ?", rowClean["Apakah terdapat MCFA (Main Control Fire Alarm)"] || ""]);
        tidakAdaItemData.push(["Lantai dimana MCFA berada ?", rowClean["Lantai dimana MCFA berada"] || ""]);
        tidakAdaItemData.push(["Apakah Main Control Fire Alaram memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar MCFA : 1. MCFA berfungsi dengan baik (Dapat menangkap sinyal dari detector ataupun error akibat kerusakan detector) 2. Terdapat teknisi atau tim pengelola gedung / securi..."] || ""]);
        tidakAdaItemData.push(["Dari standar MCFA di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar MCFA di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto MCFA yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto MCFA yang berada di gedung ini"] || ""]);
      } else if (AdaMCFA === "Ya"){
        const MCFASesuai = rowClean["Berikut merupakan standar MCFA : 1. MCFA berfungsi dengan baik (Dapat menangkap sinyal dari detector ataupun error akibat kerusakan detector) 2. Terdapat teknisi atau tim pengelola gedung / securi..."];

        if(MCFASesuai === "Tidak"){
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----MCFA---"]);
          tidakSesuaiData.push(["Apakah terdapat MCFA (Main Control Fire Alarm) ?", rowClean["Apakah terdapat MCFA (Main Control Fire Alarm)"] || ""]);
          tidakSesuaiData.push(["Lantai dimana MCFA berada ?", rowClean["Lantai dimana MCFA berada"] || ""]);
          tidakSesuaiData.push(["Apakah Main Control Fire Alaram memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar MCFA : 1. MCFA berfungsi dengan baik (Dapat menangkap sinyal dari detector ataupun error akibat kerusakan detector) 2. Terdapat teknisi atau tim pengelola gedung / securi..."] || ""]);
          tidakSesuaiData.push(["Dari standar MCFA di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar MCFA di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto MCFA yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto MCFA yang berada di gedung ini"] || ""]);
        } else if (MCFASesuai === "Ya"){
          sesuaiData.push([""]);
          sesuaiData.push(["----MCFA---"]);
          sesuaiData.push(["Apakah terdapat MCFA (Main Control Fire Alarm) ?", rowClean["Apakah terdapat MCFA (Main Control Fire Alarm)"] || ""]);
          sesuaiData.push(["Lantai dimana MCFA berada ?", rowClean["Lantai dimana MCFA berada"] || ""]);
          sesuaiData.push(["Apakah Main Control Fire Alaram memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar MCFA : 1. MCFA berfungsi dengan baik (Dapat menangkap sinyal dari detector ataupun error akibat kerusakan detector) 2. Terdapat teknisi atau tim pengelola gedung / securi..."] || ""]);
          sesuaiData.push(["Dari standar MCFA di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar MCFA di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto MCFA yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto MCFA yang berada di gedung ini"] || ""]);
        }
      }

      const AdaMesinPaging = rowClean["Apakah terdapat Mesin Paging"];

      if(AdaMesinPaging === "Tidak"){
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----Mesin Paging---"]);
        tidakAdaItemData.push(["Apakah terdapat Mesin Paging ?", rowClean["Apakah terdapat Mesin Paging"] || ""]);
        tidakAdaItemData.push(["Lantai dimana Mesin Paging berada ?", rowClean["Lantai dimana Mesin Paging berada"] || ""]);
        tidakAdaItemData.push(["Apakah mesin Paging memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Mesin Paging : 1. Mesin Paging berfungsi dengan baik (Suara terdengar ke seluruh lantai) 2. Memiliki operator yang mengoperasikan mesin paging dan mendapatkan pelatihan ..."] || ""]);
        tidakAdaItemData.push(["Dari standar Mesin Paging di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Mesin Paging di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto Mesin Paging yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Mesin Paging yang berada di gedung ini"] || ""]);
      } else if (AdaMesinPaging === "Ya"){
        const MesinPagingSesuai = rowClean["Berikut merupakan standar Mesin Paging : 1. Mesin Paging berfungsi dengan baik (Suara terdengar ke seluruh lantai) 2. Memiliki operator yang mengoperasikan mesin paging dan mendapatkan pelatihan ..."];

        if(MesinPagingSesuai === "Tidak"){
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----Mesin Paging---"]);
          tidakSesuaiData.push(["Apakah terdapat Mesin Paging ?", rowClean["Apakah terdapat Mesin Paging"] || ""]);
          tidakSesuaiData.push(["Lantai dimana Mesin Paging berada ?", rowClean["Lantai dimana Mesin Paging berada"] || ""]);
          tidakSesuaiData.push(["Apakah mesin Paging memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Mesin Paging : 1. Mesin Paging berfungsi dengan baik (Suara terdengar ke seluruh lantai) 2. Memiliki operator yang mengoperasikan mesin paging dan mendapatkan pelatihan ..."] || ""]);
          tidakSesuaiData.push(["Dari standar Mesin Paging di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Mesin Paging di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Mesin Paging yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Mesin Paging yang berada di gedung ini"] || ""]);
        } else if (MesinPagingSesuai === "Ya"){
          sesuaiData.push([""]);
          sesuaiData.push(["----Mesin Paging---"]);
          sesuaiData.push(["Apakah terdapat Mesin Paging ?", rowClean["Apakah terdapat Mesin Paging"] || ""]);
          sesuaiData.push(["Lantai dimana Mesin Paging berada ?", rowClean["Lantai dimana Mesin Paging berada"] || ""]);
          sesuaiData.push(["Apakah mesin Paging memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Mesin Paging : 1. Mesin Paging berfungsi dengan baik (Suara terdengar ke seluruh lantai) 2. Memiliki operator yang mengoperasikan mesin paging dan mendapatkan pelatihan ..."] || ""]);
          sesuaiData.push(["Dari standar Mesin Paging di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Mesin Paging di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto Mesin Paging yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Mesin Paging yang berada di gedung ini"] || ""]);
        }
      }

      const adaHydrant = rowClean["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung)"];

      if(adaHydrant === "Tidak"){
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----Hydrant Outdoor---"]);
        tidakAdaItemData.push(["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung) ?", rowClean["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung)"] || ""]);
        tidakAdaItemData.push(["Apakah Hydrant Outdoor memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Hydrant Outdoor 1. Hydrant Outdoor dalam kondisi terawat dengan baik dan siap digunakan apabila diperlukan 2. Hydrant rutin dimonitor Apakah Hydrant Outdoor memenuhi sel..."] || ""]);
        tidakAdaItemData.push(["Dari standar Hydrant Outdoor di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Hydrant Outdoor di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto Hydrant Outdoor yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Hydrant Outdoor yang berada di gedung ini"] || ""]);
      } else if (adaHydrant === "Ya"){
        const HydrantSesuai = rowClean["Berikut merupakan standar Hydrant Outdoor 1. Hydrant Outdoor dalam kondisi terawat dengan baik dan siap digunakan apabila diperlukan 2. Hydrant rutin dimonitor Apakah Hydrant Outdoor memenuhi sel..."];

        if(HydrantSesuai === "Tidak"){
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----Hydrant Outdoor---"]);
          tidakSesuaiData.push(["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung) ?", rowClean["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung)"] || ""]);
          tidakSesuaiData.push(["Apakah Hydrant Outdoor memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Hydrant Outdoor 1. Hydrant Outdoor dalam kondisi terawat dengan baik dan siap digunakan apabila diperlukan 2. Hydrant rutin dimonitor Apakah Hydrant Outdoor memenuhi sel..."] || ""]);
          tidakSesuaiData.push(["Dari standar Hydrant Outdoor di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Hydrant Outdoor di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Hydrant Outdoor yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Hydrant Outdoor yang berada di gedung ini"] || ""]);
        } else if (HydrantSesuai === "Ya"){
          sesuaiData.push([""]);
          sesuaiData.push(["----Hydrant Outdoor---"]);
          sesuaiData.push(["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung) ?", rowClean["Apakah terdapat Hydrant Outdoor (Hydrant yang terletak diluar gedung)"] || ""]);
          sesuaiData.push(["Apakah Hydrant Outdoor memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Hydrant Outdoor 1. Hydrant Outdoor dalam kondisi terawat dengan baik dan siap digunakan apabila diperlukan 2. Hydrant rutin dimonitor Apakah Hydrant Outdoor memenuhi sel..."] || ""]);
          sesuaiData.push(["Dari standar Hydrant Outdoor di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Hydrant Outdoor di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto Hydrant Outdoor yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Hydrant Outdoor yang berada di gedung ini"] || ""]);
        }
      }

      const AdaAssemblyPoint = rowClean["Apakah terdapat Titik Kumpul (Assembly Point)"] ; 

      if(AdaAssemblyPoint === "Tidak"){ 
        //Assembly Point Question
        tidakAdaItemData.push([""]);
        tidakAdaItemData.push(["----Assembly Point---"]);
        tidakAdaItemData.push(["Apakah terdapat Titik Kumpul (Assembly Point) ?", rowClean["Apakah terdapat Titik Kumpul (Assembly Point)"] || ""]);
        tidakAdaItemData.push(["Apakah Assembly Point memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Assembly Point : 1. Terpasang rambu assembly point yang dapat terlihat dengan jelas 2. Assembly point mudah diakses Apakah Assembly Point memenuhi seluruh standar yang t..."] || ""]);
        tidakAdaItemData.push(["Dari standar Assembly Point di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Assembly Point di atas, kriteria mana yang belum terpenuhi"] || ""]);
        tidakAdaItemData.push(["Lampirkan dokumentasi foto Assembly point yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Assembly point yang berada di gedung ini"] || ""]);
      } else if (AdaAssemblyPoint === "Ya"){
        const AssemblyPointSesuai = rowClean["Berikut merupakan standar Assembly Point : 1. Terpasang rambu assembly point yang dapat terlihat dengan jelas 2. Assembly point mudah diakses Apakah Assembly Point memenuhi seluruh standar yang t..."];

        if(AssemblyPointSesuai === "Tidak"){
          //Assembly Point Question
          tidakSesuaiData.push([""]);
          tidakSesuaiData.push(["----Assembly Point---"]);
          tidakSesuaiData.push(["Apakah terdapat Titik Kumpul (Assembly Point) ?", rowClean["Apakah terdapat Titik Kumpul (Assembly Point)"] || ""]);
          tidakSesuaiData.push(["Apakah Assembly Point memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Assembly Point : 1. Terpasang rambu assembly point yang dapat terlihat dengan jelas 2. Assembly point mudah diakses Apakah Assembly Point memenuhi seluruh standar yang t..."] || ""]);
          tidakSesuaiData.push(["Dari standar Assembly Point di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Assembly Point di atas, kriteria mana yang belum terpenuhi"] || ""]);
          tidakSesuaiData.push(["Lampirkan dokumentasi foto Assembly point yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Assembly point yang berada di gedung ini"] || ""]);
        } else if (AssemblyPointSesuai === "Ya"){
          //Assembly Point Question
          sesuaiData.push([""]);
          sesuaiData.push(["----Assembly Point---"]);
          sesuaiData.push(["Apakah terdapat Titik Kumpul (Assembly Point) ?", rowClean["Apakah terdapat Titik Kumpul (Assembly Point)"] || ""]);
          sesuaiData.push(["Apakah Assembly Point memenuhi seluruh standar yang tertera ?", rowClean["Berikut merupakan standar Assembly Point : 1. Terpasang rambu assembly point yang dapat terlihat dengan jelas 2. Assembly point mudah diakses Apakah Assembly Point memenuhi seluruh standar yang t..."] || ""]);
          sesuaiData.push(["Dari standar Assembly Point di atas, kriteria mana yang belum terpenuhi ?", rowClean["Dari standar Assembly Point di atas, kriteria mana yang belum terpenuhi"] || ""]);
          sesuaiData.push(["Lampirkan dokumentasi foto Assembly point yang berada di gedung ini", rowClean["Lampirkan dokumentasi foto Assembly point yang berada di gedung ini"] || ""]);
        }
      }

      //Assessment Declaration
      sectionData.push([""]);
      sectionData.push([""]);
      sectionData.push(["Dengan ini kami menyatakan bahwa seluruh item ini (Peralatan K3 & Utility) telah dilakukan assessment sesuai dengan standar dan ketentuan yang berlaku (kecuali sejumlah item yang telah dinyatakan bel", rowClean["Dengan ini kami menyatakan bahwa seluruh item ini (Peralatan K3 & Utility) telah dilakukan assessment sesuai dengan standar dan ketentuan yang berlaku (kecuali sejumlah item yang telah dinyatakan..."] || ""]);

      sesuaiData.push([""]);
      sesuaiData.push([""]);

      tidakSesuaiData.push([""]);
      tidakSesuaiData.push([""]);

      tidakAdaItemData.push([""]);
      tidakAdaItemData.push([""]);

      return {
        sectionData,
        sesuaiData,
        tidakSesuaiData,
        tidakAdaItemData,
      };
    });

    const semuaSectionData = newSheets.flatMap(sheet => [...sheet.sectionData, [""]]);
    const semuaSesuaiData = newSheets.flatMap(sheet => sheet.sesuaiData);
    const semuaTidakSesuaiData = newSheets.flatMap(sheet => sheet.tidakSesuaiData);
    const semuaTidakAdaItemData = newSheets.flatMap(sheet => sheet.tidakAdaItemData);

    const wb = XLSX.utils.book_new();

    const ws = XLSX.utils.aoa_to_sheet(semuaSectionData);
    XLSX.utils.book_append_sheet(wb, ws, "Form");

    const wsSesuai = XLSX.utils.aoa_to_sheet(semuaSesuaiData);
    XLSX.utils.book_append_sheet(wb, wsSesuai, "Sesuai");
    
    const wsTidakSesuai = XLSX.utils.aoa_to_sheet(semuaTidakSesuaiData);
    XLSX.utils.book_append_sheet(wb, wsTidakSesuai, "Tidak Sesuai");
 
    const wsTidakAdaItem = XLSX.utils.aoa_to_sheet(semuaTidakAdaItemData);
    XLSX.utils.book_append_sheet(wb, wsTidakAdaItem, "Tidak Ada Item");


    const fileName = `FormSelfSurveyPeralatanK3_${statusGedung}_${namaGedung}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    generatedFiles.push({
      namaGedung,
      fileName,
      blob,
      statusGedung,
      previewDataSesuai: semuaSesuaiData,
      previewDataTidakAdaItem: semuaTidakAdaItemData,
      previewDataTidakSesuai: semuaTidakSesuaiData,
      tanggalPemeriksaan: "",
      wilayah: "",
      namaPemeriksa: "",
      namaPendampingPemeriksa: "",
      jumlahLantai: ""
    });
  });

  return generatedFiles;
}

export async function generateSelfSurveyPDF(
  fileName: string,
  sectionMap: Record<string, (string | null)[][]>
){
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for(const sectionName of ["Sesuai", "Tidak Sesuai", "Tidak Ada Item"]) {
    const rows = sectionMap[sectionName];
    if(!rows || rows.length === 0) continue;

    const page = pdfDoc.addPage();
    const {height} = page.getSize();
    let y = height - 50;

    page.drawText(`${sectionName}`, {
      x: 50,
      y,
      size: 18,
      font,
      color: rgb(0, 0.5, 0.8),
    });
    y -= 30;

    for(const row of rows) {
      if(y < 100){
        y = height - 50;
        pdfDoc.addPage();
      }

      if(row.length === 1 && row[0]?.includes("https")){
        try{
          const url = row[0]!;
          const res = await fetch(url);
          const imgBuffer = await res.arrayBuffer();

          let image;
          if (url.endsWith(".jpg") || url.endsWith(".jpeg")) {
            image = await pdfDoc.embedJpg(imgBuffer);
          } else {
            image = await pdfDoc.embedPng(imgBuffer);
          }

          const imgDims = image.scale(0.25);
          page.drawImage(image, {
            x: 50,
            y: y - imgDims.height,
            width: imgDims.width,
            height: imgDims.height,
          });
          y -= imgDims.height + 10;
        } catch (err){
          page.drawText("[Gagal membuat gambar]", {x : 50, y, size: 10, font});
          y -= 14;
        }
        continue;
      }

      const line = row.filter(Boolean).join(": ");
      page.drawText(line, { x: 50, y, size: 10, font });
      y -= 14;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}