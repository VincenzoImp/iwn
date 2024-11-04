"use client";

import { pushEmployee } from "../api";
import { useEmployeeColumns, useEmployees } from "../context";
import type { Employee } from "../context";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Pagination,
} from "@nextui-org/react";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "../icons";
import { useCallback, useMemo, useState } from "react";

export default function Employees() {
	const employeeColumns = useEmployeeColumns();
    const employees = useEmployees();
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [page, setPage] = useState(1);
	const [searchValue, setsearchValue] = useState("");
    const [employedValue, setemployedValue] = useState<boolean | null>(null);
	
	const filteredItems = useMemo(() => {
        let filteredEmployees = employees ? employees : Array<Employee>();
		if (searchValue) {
            filteredEmployees = filteredEmployees.filter((employee) => {
                for (const word of searchValue.split(" ")) {
                    if (employee.name.toLowerCase().includes(word.toLowerCase()) || employee.surname.toLowerCase().includes(word.toLowerCase())) {
                        return true;
                    }
                }
                return false;
            });
		}
		if (employedValue !== null) {
			filteredEmployees = filteredEmployees.filter((employee) => employee.employed === employedValue);
		}
		return filteredEmployees;
	}, [employees, searchValue, employedValue]);

	const pages = useMemo(() =>	Math.ceil(filteredItems.length / rowsPerPage), [filteredItems, rowsPerPage]);

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
			setsearchValue(value);
		} else {
			setsearchValue("");
		}
		setPage(1);
	}, []);

	const onClear = useCallback(() => {
		setsearchValue("");
		setPage(1);
	}, []);

	const onEmployedChange = useCallback((value: boolean | null) => {
		setemployedValue(value);
		setPage(1);
	}, []);

	const topContent = useMemo(() => {
		return (
			<div className="flex flex-col gap-4">
				<div className="flex justify-between gap-3 items-end">
					<Input
						isClearable
						className="w-full"
						placeholder="Search by name..."
						startContent={<SearchIcon />}
						value={searchValue}
						onClear={() => onClear()}
						onValueChange={onSearchChange}
					/>
					<Dropdown 
						closeOnSelect={false} 
						aria-label="Employed" 
						placement="bottom-start"
						
					>
						<DropdownTrigger>
							<Button endContent={<ChevronDownIcon />} variant="flat">
								Employed
							</Button>
						</DropdownTrigger>
						<DropdownMenu>
							<DropdownItem onClick={() => onEmployedChange(null)}>All</DropdownItem>
							<DropdownItem onClick={() => onEmployedChange(true)}>Employed</DropdownItem>
							<DropdownItem onClick={() => onEmployedChange(false)}>Unemployed</DropdownItem>
						</DropdownMenu>
					</Dropdown>
					
					<Button color="primary" endContent={<PlusIcon />}>
						Add New
					</Button>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-default-400 text-small">Total {employees ? employees.length : 0} employees</span>
					<label className="flex items-center text-default-400 text-small">
						Rows per page:
						<select
							className="bg-transparent outline-none text-default-400 text-small"
							onChange={onRowsPerPageChange}
						>
							<option value="5">5</option>
							<option value="10">10</option>
							<option value="15">15</option>
						</select>
					</label>
				</div>
			</div>
		);
	}, [searchValue, employees, onSearchChange, onClear, onEmployedChange, onRowsPerPageChange]);

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
						// onChange={handlePageChange}
					/>
				</div>
			);
		}
		return null;
	}, [page, pages]);

	function createEmployee() {
		const employee = {
			birthdate: new Date(),
			birthplace: "Rome",
			birthplace_nation: "Italy",
			birthplace_provincia: "RM",
			document: "123456789",
			email: "example@gmail.com",
			employed: true,
			gender: "M",
			id: "123456",
			livingplace_address: "Via Roma 1",
			livingplace_nation: "Italy",
			livingplace_provincia: "RM",
			livingplace_zipcode: 12345,
			n_mat: 123456,
			n_pro: 123456,
			name: "John",
			phone: "1234567890",
			surname: "Doe",
			tax_code: "ABCDEF12G34H567I",
		};
		pushEmployee(employee);
	}


	return (
		<div className="container mx-auto mt-8">
			<button onClick={createEmployee}>click</button>
		<Table
			aria-label="Employees"
			bottomContent={bottomContent}
			bottomContentPlacement="outside"
			topContent={topContent}
			topContentPlacement="outside"
		>
			<TableHeader columns={employeeColumns.map((column) => column.field)}>
				{employeeColumns.map((column: { field: string; headerName: string}) => (
					<TableColumn
						key={column.field}
						align="start"
						allowsSorting={false}
					>
						{column.headerName} {/* Render the header name */}
					</TableColumn>
				))}
			</TableHeader>
			<TableBody emptyContent={"\n"} items={items}>
				{filteredItems.map((employee : Employee) => (
					<TableRow key={employee.id}>
						{employeeColumns.map((column: { field: string, headerName: string }) => (
							<TableCell key={column.field}>
								{employee[column.field as keyof Employee]?.toString()}
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
		</div>
	);
}