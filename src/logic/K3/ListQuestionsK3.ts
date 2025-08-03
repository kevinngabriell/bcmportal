export interface QuestionItem {
  type: "title" | "question";
  label: string;
  keys?: string[]; 
}

export interface QuestionCategory {
  category: string;
  items: QuestionItem[];
}

export const questionList: QuestionCategory[] = [
    {
        category : "APAR",
        items: [
            {
                type: "question",
                label: "Apakah terdapat APAR ?",
                keys: [
                    "Apakah terdapat APAR di lantai ini? ${suffix}",
                    "Apakah terdapat APAR di lantai ini?"
                ]
            },
            {
                type: "question",
                label: "Apakah APAR memenuhi seluruh standar yang tertera ?",
                keys: [
                    "Berikut merupakan standar Pemasangan APAR (Permenaker 4 Tahun 1980 & Memo Logistik No 063/MO/MP/2017) 1. Setiap satu atau kelompok APAR harus ditempatkan pada posisi yang mudah dilihat dengan jel...${suffix}",
                    "Berikut merupakan standar Pemasangan APAR (Permenaker 4 Tahun 1980 & Memo Logistik No 063/MO/MP/2017) 1. Setiap satu atau kelompok APAR harus ditempatkan pada posisi yang mudah dilihat dengan jel...",
                    "Berikut merupakan standar Pemasangan APAR (Permenaker 4 Tahun 1980 & Memo Logistik No 063/MO/MP/2017) 1. Setiap satu atau kelompok APAR harus ditempatkan pada posisi yang mudah dilihat dengan jelas, ${suffix}",
                    "Berikut merupakan standar Pemasangan APAR (Permenaker 4 Tahun 1980 & Memo Logistik No 063/MO/MP/2017) 1. Setiap satu atau kelompok APAR harus ditempatkan pada posisi yang mudah dilihat dengan jelas,"
                ]
            },
            {
                type: "question",
                label: "Dari standar APAR di atas, kriteria mana yang belum terpenuhi ?",
                keys: [
                    "Dari standar APAR di atas, kriteria mana yang belum terpenuhi",
                    "Dari standar APAR di atas, kriteria mana yang belum terpenuhi,"
                ]
            },
        ]
    }, 
    {
        category: "HYDRANT",
        items: [
            {
                type: "question",
                label: "Apakah terdapat HYDRANT ?",
                keys: [
                    "Apakah terdapat HYDRANT di lantai ini? ${suffix}",
                    "Apakah terdapat HYDRANT di lantai ini?"
                ]
            },
        ]
    }
]