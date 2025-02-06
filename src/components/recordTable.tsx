"use client";

import Link from "next/link";
import { EditedRecord, Record } from "@/app/lib/definitions";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import SearchIcon from "./icons/searchIcon";
import DropIcon from "./icons/downIcon";
import Funnel from "./icons/funnel";
import { FormatDate } from "@/app/lib/data";
import {
  getEditedRecordIds,
  getPendingRecordIds,
  mergeRecordsWithEdits,
} from "@/app/lib/utils";
import toast from "react-hot-toast";

export default function RecordsTable({
  records,
  editedRecords,
  role,
  edit,
  station,
}: {
  edit: string | undefined;
  role: string | undefined;
  records: Record[] | undefined;
  editedRecords: EditedRecord[] | undefined;
  station: string | undefined;
}) {
  const searches = ["customer name", "ticket", "service", "biller", "email"];
  const [searchBy, setSearchBy] = useState("customer name");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [startDate, setStartDate] = useState<string | null>();

  let localRecords;
  let localEditedRecords;

  if (role === "supersupervisor") {
    localRecords = records;
    localEditedRecords = editedRecords;
  }else {
    localRecords = records?.filter((record) => record.userStation === station);
    localEditedRecords = editedRecords;
  }



  const pendingIds = getPendingRecordIds(localRecords ?? [], localEditedRecords ?? []);

  const notEditableRecordsId = getEditedRecordIds(
    localRecords ?? [],
    localEditedRecords ?? []
  );

  const [endDate, setEndDate] = useState<string | null>(null);
  const [startValue, setStartValue] = useState<number | null>(null);
  const [endValue, setEndValue] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  let totalPages = 0;


  const useRecords = mergeRecordsWithEdits(localRecords ?? [], localEditedRecords ?? []);

  console.log("local",localRecords)
  console.log("local edit",localEditedRecords)


  const filteredRecords = useRecords?.filter((record) => {
    const recordDate = new Date(record.recordCreatedAt);
    let matchesSearch;

    if (searchBy == "customer name") {
      matchesSearch = record.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    } else if (searchBy == "ticket") {
      matchesSearch = record.ticket
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    } else if (searchBy == "service") {
      matchesSearch = record.service
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    } else if (searchBy == "biller") {
      matchesSearch = record.userName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    } else if (searchBy == "email") {
      matchesSearch = record.userEmail
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    }

    const isWithinDateRange =
      (!startDate || recordDate >= new Date(startDate)) &&
      (!endDate || recordDate <= new Date(endDate));

    const isWithinValueRange =
      endValue === null || startValue === null || endValue >= startValue
        ? (startValue === null || record.value >= startValue) &&
          (endValue === null || record.value <= endValue)
        : startValue === null || record.value >= startValue;

    return matchesSearch && isWithinDateRange && isWithinValueRange;
  });

  if (filteredRecords) {
    totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  }

  // Get the current rows to display
  const currentRows = filteredRecords?.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const exportToExcel = () => {
    if (filteredRecords) {
      const worksheet = XLSX.utils.json_to_sheet(
        filteredRecords.map((record) => ({
          Ticket: record.ticket,
          Type: record.recordType,
          Name: record.name,
          Service: record.service,
          Record: record.recordNumber,
          Value: record.value,
          Date: record.createdAt,
          Counter: record.counter,
          Shift: record.shift,
          UserCreated: record.userName,
          UserEmailCreated: record.userEmail,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
      XLSX.writeFile(workbook, "Records.xlsx");
    }
  };

  useEffect(() => {
    if (edit === "true") {
      toast.success("Edit request send successfully", {
        id: "success-toast", // Assign a unique ID for the success message
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [edit]);

  return (
    <div className="container mt-8 mx-auto p-4 items-center">
      <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex gap-2 justify-center">
          {role === "attendant" && (
            <Link href={`/dashboard/${role}/records/create`}>
              <button className="submit text-sm max-md:text-xs mt-2 rounded-lg">
                Add Record
              </button>
            </Link>
          )}
          <button
            onClick={exportToExcel}
            className="w-fit bg-gray-50 hover:bg-green-100 shadow-md max-md:text-xs rounded-lg text-sm mt-2"
          >
            To Excel
          </button>
        </div>
        <fieldset className="flex flex-col md:flex-row grow gap-2 md:ml-6 bg-gray-50 border p-2 items-center justify-between relative">
          <legend className="flex items-center">
            <Funnel className="size-4" />
            Filter by:
          </legend>

          <div className="relative pl-3">
            <select
              className="opacity-0 inset-0 cursor-pointer absolute -left-3 top-1"
              id="search"
              value={searchBy}
              onChange={(e) => {
                setSearchBy(e.target.value);
              }}
            >
              {searches.map((search, index) => (
                <option
                  className="text-gray-500"
                  id="search"
                  value={search}
                  key={index}
                >
                  {search}
                </option>
              ))}
            </select>
            <DropIcon className="absolute pointer-events-none -left-1 top-3 z-10 w-[20px] border-none" />
            <input
              type="text"
              placeholder={`Search by ${searchBy}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border bg-white pl-8 mt-2 ml-3 py-1 rounded max-w-60 relative"
            />
            <SearchIcon className="pointer-events-none absolute left-8 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>

          <div className="flex max-lg:flex-col gap-2 ml-4 items-center">
            <fieldset className="flex border bg-gray-50 shadow-sm p-2 rounded-md max-md:w-full">
              <legend>Date</legend>
              <input
                type="date"
                value={startDate || ""}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-1 m-1 rounded bg-gray-100"
              />
              <label className="max-lg:text-sm">To</label>
              <input
                type="date"
                value={endDate || ""}
                onChange={(e) => setEndDate(e.target.value)}
                className="border px-1 m-1 rounded bg-gray-100"
              />
            </fieldset>
          </div>

          <div className="flex max-lg:flex-col gap-2 ml-4 items-center">
            <fieldset className="flex border bg-gray-50 shadow-sm p-2 rounded-md">
              <legend>Value</legend>
              <input
                type="number"
                value={startValue ?? ""}
                onChange={(e) =>
                  setStartValue(
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                className="border px-1 m-1 rounded bg-gray-100"
              />

              <label className="max-lg:text-sm">-</label>
              <input
                type="number"
                value={endValue ?? ""}
                onChange={(e) =>
                  setEndValue(
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                className="border px-1 m-1 rounded bg-gray-100"
              />
            </fieldset>
          </div>
        </fieldset>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 mx-auto">
          <thead className="bg-green-100 text-green-800 max-lg:text-sm max-sm:text-xs">
            <tr>
              <th className="border px-4 py-2">No.</th>
              <th className="border px-4 py-2">Ticket</th>
              <th className="border px-4 py-2">Customer Name</th>
              <th className="border px-4 py-2">Service</th>
              <th className="border px-4 py-2">Sub-Service</th>
              <th className="border px-4 py-2">Invoice/Receipt No.</th>
              <th className="border px-4 py-2">Value</th>
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Counter</th>
              <th className="border px-4 py-2">Shift</th>
              {(role === "supervisor" ||
                role === "supersupervisor" ||
                role === "admin") && (
                <>
                  <th className="border px-4 py-2">Biller</th>
                  <th className="border px-4 py-2">Biller email</th>
                </>
              )}
              {role === "attendant" && (
                <th className="border px-4 py-2">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentRows && currentRows.length > 0 ? (
              currentRows.map((record, index) => (
                <tr
                  className="max-lg:text-sm max-sm:text-xs hover:bg-gray-50"
                  key={record.recordId}
                >
                  <td className="border px-4 py-2">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>
                  <td className="border px-4 py-2">{record.ticket}</td>
                  <td className="border px-4 py-2">{record.name}</td>
                  <td className="border px-4 py-2">{record.service}</td>
                  <td className="border px-4 py-2">{record.subService}</td>
                  <td className="border px-4 py-2">{record.recordNumber}</td>
                  <td className="border px-4 py-2">
                    {record.value.toLocaleString("en-US")}
                  </td>
                  <td className="border px-4 py-2">
                    <FormatDate date={record.recordCreatedAt} />
                  </td>
                  {record.counter === "0" ? (<td className="border px-4 py-2"></td>):(<td className="border px-4 py-2">{record.counter}</td>)}
                  
                  <td className="border px-4 py-2">{record.shift}</td>
                  {(role === "supervisor" || role === "supersupervisor") && (
                    <>
                      <td className="border px-4 py-2">{record.userName}</td>
                      <td className="border px-4 py-2">{record.userEmail}</td>
                    </>
                  )}
                  {role === "attendant" &&
                    (pendingIds.includes(record.recordId) ? (
                      <td className="border px-4 py-2 text-center text-gray-500">
                        Pending...
                      </td>
                    ) : notEditableRecordsId.includes(record.recordId) ? (
                      <td className="border px-4 py-2 text-center text-gray-300">
                        Not editable
                      </td>
                    ) : (
                      <td className="border px-4 py-2">
                        <Link
                          className="flex justify-center items-center border rounded-lg px-1 py-1 text-sm text-gray-700 hover:bg-gray-100"
                          href={`/dashboard/${role}/records/${record.recordId}/edit`}
                        >
                          Edit
                        </Link>
                      </td>
                    ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={role === "attendant" ? 12 : 13}
                  className="text-center py-4"
                >
                  No records found!
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="grid grid-cols-3 max-w-screen-md items-center mx-auto gap-10 mt-4">
            <button
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <p className="text-gray-700 text-center">
              Page {currentPage} of {totalPages}
            </p>
            <button
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
