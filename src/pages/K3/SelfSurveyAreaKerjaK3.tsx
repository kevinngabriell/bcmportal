import { List, message, Upload, type UploadProps } from "antd";
import Layout from "../../components/layout";
import { Button, CloseButton, Container, Dialog, IconButton, Portal, Tabs, Text } from "@chakra-ui/react";
import { FolderOpenOutlined, InboxOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { generateSelfSurveyAreaKerjaK3, type GeneratedFile } from "../../logic/K3/K3Logic";
import type { ExcelRow } from "../../variable/variable";
import { useState } from "react";
import { cellToString, isImageUrl, renderTablePreview } from "./AreaKerjaPreview";

function SelfSurveyAreaKerjaK3(){
    //Set upload varaible and generated file
    const { Dragger } = Upload;
    const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);

    //Upload Process
    const props: UploadProps = {
        name: 'file',
        multiple: false,
        accept: ".xlsx",
        customRequest: async ({ file, onSuccess }) => {
            try {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(sheet) as ExcelRow[];

                    const files = generateSelfSurveyAreaKerjaK3(jsonData);
                    setGeneratedFiles(files);

                    const firstSheetRaw = files?.[0]?.previewDataSesuai;

                    if (firstSheetRaw) {
                    const previewSafe = firstSheetRaw.map((row) =>
                        row.map((cell) =>
                        typeof cell === "object" && cell !== null && "f" in cell ? `=${cell.f}` : cell
                        )
                    );
                    renderTablePreview(previewSafe);
                    }
                    
                    console.log(files?.[0]?.jsonData);
                
                    onSuccess?.("ok");
                };
                reader.readAsArrayBuffer(file as File);
            } catch (err) {
                console.error(err);
                message.error(`${(file as File).name} failed to process.`);
            }
        },
        onDrop(e) {
            console.log('Dropped files', e.dataTransfer.files);
        },
    };

    //Download Process
    const handleDownload = (file: GeneratedFile) => {
        const url = URL.createObjectURL(file.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return(
        <Layout>
            <Text fontSize="1.5rem" color="black" fontWeight="bold">Self Survey Area Kerja K3</Text>
            <Container maxW="100%" marginBottom="20" marginTop="6">
                <Dragger style={{ width: '100%' }} {...props}>
                    <p className="ant-upload-drag-icon">
                    <InboxOutlined/>
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">
                    Only Support for a single upload. Strictly prohibited from uploading company data or other
                    banned files.
                    </p>
                </Dragger>
            </Container>
            {/* <div id="previewTable" style={{ marginTop: "20px", backgroundColor: "#fff", padding: "1rem" }} /> */}
            {generatedFiles.length > 0 && (
            <>
            <Text fontWeight="bold" fontSize="lg" mt={6} mb={2}>Generated Self Survey Area Kerja Files</Text>
                <List
                    bordered
                    dataSource={generatedFiles}
                    // style={{ backgroundColor: "white" }}
                    renderItem={(file) => (
                        <List.Item
                            actions={[
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                       <IconButton aria-label="Open Details"p={"3"}><FolderOpenOutlined/> Open</IconButton>
                                    </Dialog.Trigger>
                                    <Portal>
                                        <Dialog.Backdrop/>
                                        <Dialog.Positioner>
                                            <Dialog.Content minW="900px">
                                                <Dialog.Header display={"flex"} flexDirection={"column"}>
                                                    <Dialog.Title color={"black"}>{file.statusGedung} {file.namaGedung}</Dialog.Title>
                                                    <Dialog.Description>
                                                        <Text fontSize={"0.7rem"}>Wilayah : {file.wilayah}</Text>
                                                        <Text fontSize={"0.7rem"}>Jumlah Lantai : {file.jumlahLantai} Lantai</Text>
                                                        <Text fontSize={"0.7rem"}>Tanggal Pemeriksaan : {file.tanggalPemeriksaan}</Text>
                                                        <Text fontSize={"0.7rem"}>Nama Pemeriksa : {file.namaPemeriksa}</Text>
                                                        <Text fontSize={"0.7rem"}>Nama Pendamping Pemeriksa : {file.namaPendampingPemeriksa}</Text>
                                                    </Dialog.Description>
                                                </Dialog.Header>
                                                <Dialog.Body>
                                                    <Tabs.Root defaultValue="sesuai">
                                                        <Tabs.List bg={"white"}>
                                                            <Tabs.Trigger value="sesuai" bg={"white"} outline={"none"}>
                                                                Data Sesuai
                                                            </Tabs.Trigger>
                                                            <Tabs.Trigger value="tidaksesuai" bg={"white"}>
                                                                Data Tidak Sesuai
                                                            </Tabs.Trigger>
                                                            <Tabs.Trigger value="tidakadaitem" bg={"white"}>
                                                                Tidak Ada Item
                                                            </Tabs.Trigger>
                                                        </Tabs.List>
                                                        <Tabs.Content value="sesuai">
                                                            <div style={{maxHeight: "300px", overflowY: "auto", overflowX: "hidden",  color: "black"}}>
                                                                
                                                                {file.jsonData?.sesuai.map((row, i) => {
                                                                const isHeader = row.value === null;

                                                                const isImage = isImageUrl(row.value ?? "");
                                                                return (
                                                                    <div key={i} style={{display: "flex", alignItems: "flex-start", marginBottom: "12px", fontWeight: isHeader ? "bold" : "normal", marginTop: isHeader && i !== 0 ? 30 : 12,}}>
                                                                        {isHeader ? (
                                                                            <div style={{ width: "100%" }}>{row.field}</div>
                                                                        ) : (
                                                                            <>
                                                                            <div style={{ width: "40%", fontWeight: "bold", paddingRight: 10 }}>
                                                                                {row.field}
                                                                            </div>
                                                                            <div style={{ width: "60%" }}>
                                                                                {isImage ? (
                                                                                    <img src={row.value ?? ""} alt="Preview" style={{ maxWidth: 400 }}/>
                                                                                ) : (
                                                                                <input type="text" value={row.value ?? ""} readOnly style={{ width: "100%", padding: "4px 8px", backgroundColor: "#f5f5f5", border: "1px solid #ccc", borderRadius: 4, }}/>
                                                                                )}
                                                                            </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                );
                                                                })}
                                                            </div>
                                                        </Tabs.Content>
                                                        <Tabs.Content value="tidaksesuai">
                                                        <div style={{ maxHeight: "300px", overflowY: "auto", overflowX: "hidden", color: "black" }}>
                                                            {file.previewDataTidakSesuai?.map((row, i) => (
                                                                <div key={i}>
                                                                    {row.map((cell, j) => {
                                                                    const cellStr = cellToString(cell); // fungsi konversi ke string
                                                                    if (isImageUrl(cellStr)) {
                                                                        return <img key={j} src={cellStr} style={{maxWidth: 400}} />
                                                                    } else {
                                                                        return <span key={j} style={{ marginRight: 8 }}>{cellStr}</span>;
                                                                    }
                                                                    })}
                                                                </div>
                                                                ))}
                                                            </div>
                                                        </Tabs.Content>
                                                        <Tabs.Content value="tidakadaitem">
                                                        <div style={{ maxHeight: "300px", overflowY: "auto", overflowX: "hidden", color:'black' }}>
                                                            {file.previewDataTidakAdaItem?.map((row, i) => (
                                                                <div key={i}>
                                                                    {row.map((cell, j) => {
                                                                    const cellStr = cellToString(cell); // fungsi konversi ke string
                                                                    if (isImageUrl(cellStr)) {
                                                                        return <img key={j} src={cellStr} style={{maxWidth: 400}} />
                                                                    } else {
                                                                        return <span key={j} style={{ marginRight: 8 }}>{cellStr}</span>;
                                                                    }
                                                                    })}
                                                                </div>
                                                                ))}
                                                            </div>
                                                        </Tabs.Content>
                                                    </Tabs.Root>
                                                    {/* <div id="previewTable" style={{ marginTop: "20px", backgroundColor: "#fff", padding: "1rem" }} /> */}
                                                </Dialog.Body>
                                                <Dialog.Footer>
                                                    <Button onClick={() => handleDownload(file)} color={"black"}>Download as Excel</Button>
                                                </Dialog.Footer>
                                                <Dialog.CloseTrigger asChild>
                                                    <CloseButton size="sm" />
                                                </Dialog.CloseTrigger>
                                            </Dialog.Content>
                                        </Dialog.Positioner>
                                    </Portal>
                                </Dialog.Root>
                            ]}
                        >
                        {file.fileName}
                        </List.Item>
                    )}
                />
            </>
            )}
        </Layout>
    );
}

export default SelfSurveyAreaKerjaK3;