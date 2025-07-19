import { Button, List, message, Upload, type UploadProps } from "antd";
import { generateSelfSurveyPeralatanK3, type GeneratedFile } from "../../logic/K3Logic";
import { useState } from "react";
import * as XLSX from "xlsx";
import type { ExcelRow } from "../../variable/variable";
import Layout from "../../components/layout";
import { Container, Text } from "@chakra-ui/react";
import { DownloadOutlined, InboxOutlined } from "@ant-design/icons";

function SelfSurveyPeralatanK3(){
    const { Dragger } = Upload;
    const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);

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
                        <Text fontWeight="bold" fontSize="lg" mt={6} mb={2}>Generated Self Survey Files</Text>
                        <List
                            bordered
                            dataSource={generatedFiles}
                            style={{ backgroundColor: "white" }}
                            renderItem={(file) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            type="link"
                                            icon={<DownloadOutlined />}
                                            onClick={() => handleDownload(file)}
                                        >
                                            Download
                                        </Button>
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