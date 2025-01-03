"use client";

import { useText } from "@/app/context";
import type { Employee } from "@/app/context";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Button, DropdownTrigger, Dropdown, DropdownMenu, DropdownItem, Pagination, Spinner, Accordion, AccordionItem } from "@nextui-org/react";
import { SearchIcon } from "@/app/icons";
import { Key, useCallback, useEffect, useMemo, useState } from "react";
import { readEmployees } from "@/app/api";
import { toast } from "@/app/components/toast";

function QualificationTable(qualification: string, employees: Employee[], isLoading: boolean, text: Record<string, Record<string, string>>) {
	
	const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(1);
	const [searchValue, setSearchValue] = useState("");
	const [employedValue, setEmployedValue] = useState<string>("all");
    const utilsDict = useMemo(() => ({
        ["score"]: ["tubista", "carpentiere", "impiegato", "capoTecnico", "manovale"],
        ["technique_material_score"]: ["saldatore"]
    }), []);
	const visibleCloumns = useMemo(() => {
		const key = Object.keys(utilsDict).find(key => utilsDict[key as keyof typeof utilsDict].includes(qualification));
        const columns = key?.split("_") || [];
		return ["name", "surname", "employed", ...columns];
	}, [qualification, utilsDict]);
	const filteredItems = useMemo(() => {
        let filteredEmployees = [...employees];
		if (employedValue !== "all") {
			filteredEmployees = filteredEmployees.filter((employee) => {
				return employee.employed !== null && employee.employed.toString() === employedValue;
			});
		}
		const qualificationItems: Record<string, string | number>[] = [];
		for (const employee of filteredEmployees) {
			if (employee.qualifications) {
				if (employee.qualifications[qualification]) {
					employee.qualifications[qualification].forEach((item) => {
						const qualificationItem = {
							name: employee.name || "",
							surname: employee.surname || "",
							id: employee.id || "",
							employed: employee.employed !== null ? employee.employed : "",
							qualification: qualification,
							...item
						};
						qualificationItems.push(qualificationItem);
					});
				}
			}
		}
		if (searchValue.trim() !== "") {
			return qualificationItems.filter((qualificationItem) => {
				const values = [];
				for (const column of visibleCloumns) {
					if (column !== "score" && column !== "employed" && column !== "id") {
						values.push(qualificationItem[column as keyof Record<string, string | number>].toString().toLowerCase());
					}
				}
				const valuesString = values.join(" ");
				for (const word of searchValue.split(" ")) {
					if (word === "") {
						continue;
					}
					if (valuesString.includes(word.toLowerCase())) {
						return true;
					}
				}
				return false;
			});
		}
		return qualificationItems;
	}, [employees, searchValue, employedValue, qualification, visibleCloumns]);
	
	const pages = useMemo(() =>	{
		return Math.ceil(filteredItems.length / rowsPerPage);
	}, [filteredItems, rowsPerPage]);

	const items = useMemo(() => {
		const start = (page - 1) * rowsPerPage;
		const end = start + rowsPerPage;
		return filteredItems.slice(start, end);
	}, [page, filteredItems, rowsPerPage]);

	const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
		setRowsPerPage(parseInt(e.target.value, 10));
		setPage(1);
	}, []);

	const onSearchChange = useCallback((value: string) => {
		if (value) {
			setSearchValue(value);
		} else {
			setSearchValue("");
		}
		setPage(1);
	}, []);

	const onClear = useCallback(() => {
		setSearchValue("");
		setPage(1);
	}, []);

	const onEmployedChange = useCallback((value: Key) => {
		setEmployedValue(value as string);
		setPage(1);
	}, []);

	const renderCell = useCallback((qualificationItem: Record<string, string | number>, column: string) => {
		if (column === "employed") {
			const value = qualificationItem[column as keyof Record<string, string | number>];
			return value ? text.other[value] : "";
		}
		return qualificationItem[column as keyof Record<string, string | number>];
	}, [text]);

	const topContent = useMemo(() => {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex justify-between gap-3 items-end">
					<Input
						isClearable
						className="w-full"
						placeholder={text.qualificationsTable.searchPlaceholder}
						startContent={<SearchIcon />}
						value={searchValue}
						onClear={onClear}
						onValueChange={onSearchChange}
					/>
					<Dropdown>
						<DropdownTrigger>
							<Button variant="flat">
								{text.qualificationsTable.filter}
							</Button>
						</DropdownTrigger>
						<DropdownMenu 
							variant="flat"
							disallowEmptySelection
							selectionMode="single"
							onAction={(key) => onEmployedChange(key)}
							selectedKeys={[employedValue]}
						>
							<DropdownItem key="all">{text.other.all}</DropdownItem>
							<DropdownItem key="yes">{text.other.employeds}</DropdownItem>
							<DropdownItem key="no">{text.other.unemployeds}</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-default-400 text-small">{text.qualificationsTable.totalQualifications}: {!isLoading ? filteredItems.length : null}</span>
					<label className="flex items-center text-default-400 text-small">
						{text.qualificationsTable.rowsPerPage}:
						<select
							className="bg-transparent outline-none text-default-400 text-small"
							onChange={onRowsPerPageChange}
						>
							<option value="10">10</option>
							<option value="25">25</option>
							<option value="50">50</option>
						</select>
					</label>
				</div>
			</div>
		);
	}, [searchValue, onSearchChange, onClear, onRowsPerPageChange, employedValue, onEmployedChange, filteredItems, text, isLoading]);

	const tableColumns = useMemo(() => {
		return visibleCloumns.map((column : string) => (
			<TableColumn key={column} align="center">
				{text.qualificationsTable[column]}
			</TableColumn>
		));
	}, [visibleCloumns, text]);

	const tableRows = useMemo(() => {
		return items.map((qualificationItem) => (
			<TableRow key={qualificationItem.id} className="cursor-pointer hover:bg-default-100" href={`/employees/${qualificationItem.id}`}>
				{visibleCloumns.map((column : string) => (
					<TableCell key={column}>
						{renderCell(qualificationItem, column)}
					</TableCell>
				))}
			</TableRow>
		));
	}, [visibleCloumns, items, renderCell]);

	const bottomContent = useMemo(() => {
		if (pages > 1) {
			return (
				<div className="flex w-full justify-center">
					<Pagination 
						isCompact
						showControls
						showShadow
						page={page}
						total={pages}
						onChange={setPage}
					/>
				</div>
			);
		}
		return null;
	}, [page, pages]);

	return (
		<>
			<Table 
				className="container mx-auto my-8"
				bottomContent={bottomContent}
				bottomContentPlacement="outside"
				topContent={topContent}
				topContentPlacement="outside"
			>
				<TableHeader>
					{tableColumns}
				</TableHeader>
				<TableBody items={items} isLoading={isLoading} loadingContent={<Spinner />} >
					{tableRows}
				</TableBody>
			</Table>
		</>
	);
}

export default function QualificationsTable() {

	const [employees, setEmployees] = useState<Employee[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		async function fetchEmployees() {
			try {
				const employeesData = await readEmployees();
				setEmployees(employeesData);
			} catch (error: unknown) {
				if (error instanceof Error) {
					toast.error(error.message);
				}
			}
			setIsLoading(false);
		}
		fetchEmployees();
	}, [setEmployees, setIsLoading]);
	const text = useText();

	return (
		employees ? (
			Object.keys(text.qualificationsList).sort().map((qualification) => (
				<Accordion key={qualification} className="container mx-auto my-4" variant="splitted">
					<AccordionItem 
						key={qualification} 
						aria-label={qualification} 
						title={text.qualificationsList[qualification]}
					>
						{QualificationTable(qualification, employees, isLoading, text)}
					</AccordionItem>
				</Accordion>
			))
		) : null
	);
}