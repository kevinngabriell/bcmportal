import { List, message, Upload, type UploadProps } from "antd";
import { generateSelfSurveyPeralatanK3, type GeneratedFile } from "../../logic/K3/K3Logic";
import { useState } from "react";
import * as XLSX from "xlsx";
import type { ExcelRow } from "../../variable/variable";
import Layout from "../../components/layout";
import { Button, CloseButton, Container, Dialog, IconButton, Portal, Tabs, Text } from "@chakra-ui/react";
import { FolderOpenOutlined, InboxOutlined } from "@ant-design/icons";
import { cellToString, isImageUrl } from "./AreaKerjaPreview";

function SelfSurveyPeralatanK3(){
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

                    const files = generateSelfSurveyPeralatanK3(jsonData);
                    setGeneratedFiles(files);
                    
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

    return (
        <Layout>
            <Text fontSize="1.5rem" color="black" fontWeight="bold">Self Survey Peralatan K3</Text>
            <Container maxW="100%" marginBottom="20" marginTop="6">
                <Dragger style={{ width: '100%' }} {...props}>
                    <p className="ant-upload-drag-icon">
                    <InboxOutlined/>
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">
                    Support for a single or bulk upload. Strictly prohibited from uploading company data or other
                    banned files.
                    </p>
                </Dragger>
            </Container>

            {generatedFiles.length > 0 && (
            <>
            <Text fontWeight="bold" fontSize="lg" mt={6} mb={2}>Generated Self Survey Peralatan K3 Files</Text>
                <List
                    bordered
                    dataSource={generatedFiles}
                    style={{ backgroundColor: "white" }}
                    renderItem={(file) => (
                        <List.Item
                            actions={[
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                       <IconButton aria-label="Open Details" color={"black"} p={"3"}><FolderOpenOutlined/> Open</IconButton>
                                    </Dialog.Trigger>
                                    <Portal>
                                        <Dialog.Backdrop/>
                                        <Dialog.Positioner>
                                            <Dialog.Content minW="900px">
                                                <Dialog.Header>
                                                    <Dialog.Title>{file.statusGedung} {file.namaGedung}</Dialog.Title>
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
                                                            <div style={{ maxHeight: "400px", overflowY: "auto", overflowX: "hidden" }}>
                                                                {file.previewDataSesuai?.map((row, i) => (
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
                                                        <Tabs.Content value="tidaksesuai">
                                                        <div style={{ maxHeight: "400px", overflowY: "auto", overflowX: "hidden" }}>
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
                                                        <div style={{ maxHeight: "400px", overflowY: "auto", overflowX: "hidden" }}>
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

export default SelfSurveyPeralatanK3;