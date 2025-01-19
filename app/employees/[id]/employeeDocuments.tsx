"use client";

import { JSX, useCallback, useMemo, useState } from "react";
import { useText } from "@/app/context";
import { useEmployee, useMode } from "@/app/employees/[id]/context";
import { Button, Card, CardBody, CardHeader, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, useDisclosure } from "@nextui-org/react";
import { DeleteIcon, PlusIcon } from "@/app/icons";
import { storage } from "@/app/firebase/config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/app/components/toast";

export default function EmployeeDocuments() {

    const { employee, setEmployee } = useEmployee();
    const { mode } = useMode();
    const text = useText();
    const {isOpen, onOpenChange} = useDisclosure();
    const [newDocument, setNewDocument] = useState<string | null>(null);
    const [newDocumentUploading, setNewDocumentUploading] = useState<boolean>(false);

    const addDocument = useCallback((document: string) => {
        if (employee) {
            if (employee.documents && !employee.documents.includes(document)) {
                setEmployee({
                    ...employee,
                    documents: [...employee.documents, document]
                })
            }
        }
    }, [employee, setEmployee])
    
    const deleteDocument = useCallback((document: string) => {
        if (employee) {
            if (employee.documents && employee.documents.includes(document)) {
                setEmployee({
                    ...employee,
                    documents: employee.documents.filter((doc) => doc !== document)
                })
            }
        }
    }, [employee, setEmployee])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewDocumentUploading(true);
            const filename = `${uuidv4()}_${file.name}`;
            const storageRef = ref(storage, `employees/${employee?.id}/documents/${filename}`);
            uploadBytes(storageRef, file).then((snapshot) => {
                setNewDocument(snapshot.metadata.name);
                setNewDocumentUploading(false);
            }).catch((error) => {
                toast.error(error.message);
                setNewDocumentUploading(false);
            })
        }
    }, [employee, setNewDocument, setNewDocumentUploading])

    async function _getDownloadURL(employeeId: string | undefined, document: string): Promise<string> {
        if (employeeId) {
            const storageRef = ref(storage, `employees/${employeeId}/documents/${document}`);
            return getDownloadURL(storageRef);
        }
        return "#";
    }

    const actions = useCallback((document: string): JSX.Element => {
        return (
            <div className="flex items-center justify-center gap-4">
                <span className="text-lg text-danger cursor-pointer active:opacity-50">
                    <DeleteIcon onClick={() => deleteDocument(document)} />
                </span>
            </div>
        )
    }, [deleteDocument])

    const documentsModal = useMemo(() => {
        return (
            <Modal isOpen={isOpen} onOpenChange={() => { onOpenChange(); setNewDocument(null); }}>
                <ModalContent>
                    <ModalHeader>
                        {text.employeeDocuments.addDocument}
                    </ModalHeader>
                    <ModalBody>
                        <Input type="file" onChange={(e) => handleInputChange(e)} />                         
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={() => { onOpenChange(); setNewDocument(null); }}>
                            {text.employeeDocuments.cancel}
                        </Button>
                        <Button color="primary" isDisabled={newDocument === null || newDocumentUploading} isLoading={newDocumentUploading}
                            onPress={() => {
                                if (newDocument) {
                                    addDocument(newDocument);
                                    setNewDocument(null);
                                    onOpenChange();
                                }
                            }}
                        >
                            {newDocumentUploading ? null : text.employeeDocuments.add}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        )
    }, [isOpen, onOpenChange, addDocument, newDocument, newDocumentUploading, handleInputChange, text])

    const table = useMemo(() => {
        const _documents = Array.isArray(employee?.documents) ? employee.documents : [];
        if (_documents.length === 0) return null;
        const _columns = mode === "view" ? ["document"] : ["document", "actions"];
        const _row: Record<string, string | JSX.Element>[] = [];
        _documents.forEach((document: string) => {
            if (mode === "view") {
                _row.push({ document: document })
            } else {
                _row.push({ document: document, actions: actions(document) })
            }
        })

        const header = (
            <TableHeader>
                {_columns.map((column) => (
                    <TableColumn key={column} align="center">
                        {text.employeeDocuments[column]}
                    </TableColumn>
                ))}
            </TableHeader>
        )

        const body = (
            <TableBody>
                {_row.map((row, index) => (
                    <TableRow key={index}>
                        {Object.keys(row).map((key) => (
                            <TableCell key={key} align="center">
                                {key === "document" ? (
                                    <Button color="default" onPress={() => _getDownloadURL(employee?.id ?? undefined, row[key] as string).then((url) => window.open(url))}>
                                        {row[key]}
                                    </Button>
                                ) : (
                                    row[key]
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        )
        return (
            <Table>
                {header}
                {body}
            </Table>
        )
    }, [employee, text, mode, actions])

    const documentsCard = useMemo(() => (
        employee && mode ? (
            <div className="container mx-auto">
                <Card className="mx-2">
                    <CardHeader className="flex justify-between">
                        <h2 className="text-lg font-medium">{text.employeeDocuments.documents}</h2>
                        {mode === "view" ? null : (
                            <Chip variant="light" className="inline-block" endContent={
                                <Button size="sm" isIconOnly color="default" onPress={() => onOpenChange()}>
                                    <PlusIcon />
                                </Button>
                            }>
                            </Chip>
                        )}
                    </CardHeader>
                    <CardBody>
                        {employee.documents && employee.documents.length > 0 ? (
                            table
                        ) : (
                            <p className="text-default-400">{text.employeeDocuments.noDocuments}</p>
                        )}
                    </CardBody>
                </Card>
            </div>
        ) : null
    ), [employee, mode, text, table, onOpenChange])

    return (
        <>
            {documentsCard}
            {documentsModal}
        </>
    )
}