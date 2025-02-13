"use client";

import { Stations } from "@/app/lib/data";
import { EditedRecord, Record } from "@/app/lib/definitions";
import {
  filterRecordsByTimeRange,
  G,
  mergeRecordsWithEdits,
} from "@/app/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import React, { useEffect, useMemo, useState } from "react";

export default function ReportPage({
  fetchedRecords,
  editedRecords,
}: {
  fetchedRecords: Record[];
  editedRecords: EditedRecord[];
}) {
  const records = useMemo(
    () => mergeRecordsWithEdits(fetchedRecords ?? [], editedRecords ?? []),
    [fetchedRecords, editedRecords]
  );

  const [analysisType, setAnalysisType] = useState<G>({
    startDate: new Date(),
    endDate: null,
  });
  const [recordType, setRecordType] = useState<string>("invoice");
  const [rankBy, setRankBy] = useState<string>("overall");
  const [sortOrder, setSortOrder] = useState<string>("totalValue");

  const [useRecords, setUseRecords] = useState<Record[]>([]);
  const [recordsOfType, setRecordsOfType] = useState<Record[]>([]);
  const [station, setStation] = useState<string>("Overall");
  const [localRecords, setLocalRecords] = useState<Record[]>([]);
  const getCurrentDate = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };
  const [startDate, setStartDate] = useState<string>(getCurrentDate());
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    if (startDate !== "" && startDate < endDate) {
      //alert("working")
      setAnalysisType({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate === endDate) {
      // If startDate equals endDate, set endDate to the next day
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + 1); // Add one day to endDate

      setAnalysisType({
        startDate: new Date(startDate),
        endDate: newEndDate,
      });
    } else {
      setAnalysisType({
        startDate: new Date(startDate),
        endDate: null,
      });
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (station === "Overall") {
      setLocalRecords(records);
    } else {
      const filteredLocalRecords = records?.filter(
        (record) => record.userStation === station
      );
      setLocalRecords(filteredLocalRecords);
    }
  }, [station, records]);

  type GroupedRecords = {
    [key: string]: {
      shift: string;
      count: number;
      counter: string;
      totalValue: number;
    };
  };

  // Update `recordsOfType` whenever `recordType` or `records` changes
  useEffect(() => {
    const filtered = localRecords?.filter(
      (record) => record.recordType === recordType
    );
    setRecordsOfType(filtered);
  }, [recordType, localRecords]);

  // Update `useRecords` whenever `analysisType` or `recordsOfType` changes
  useEffect(() => {
    const filtered = filterRecordsByTimeRange(recordsOfType, analysisType);
    setUseRecords(filtered);
  }, [analysisType, recordsOfType]);

  const groupedRecords = useMemo(() => {
    if (!useRecords) return { byService: {}, byUser: {} };

    const byService = useRecords.reduce((acc, record) => {
      const key = `${record.service}-${record.shift}-${record.counter}`;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          totalValue: 0,
          shift: record.shift,
          counter: record.counter,
        };
      }
      acc[key].count += 1;
      acc[key].totalValue += record.value;
      return acc;
    }, {} as GroupedRecords);

    const byUser = useRecords.reduce((acc, record) => {
      const key = `${record.userName}-${record.shift}-${record.counter}`;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          totalValue: 0,
          shift: record.shift,
          counter: record.counter,
        };
      }
      acc[key].count += 1;
      acc[key].totalValue += record.value;
      return acc;
    }, {} as GroupedRecords);

    return { byService, byUser };
  }, [useRecords]);

  const sortedGroupedRecords = useMemo(() => {
    if (!groupedRecords) return { byService: [], byUser: [] };

    const sortRecords = (records: GroupedRecords) => {
      return Object.entries(records)
        .sort((a, b) => {
          if (sortOrder === "totalValue")
            return b[1].totalValue - a[1].totalValue;
          return b[1].count - a[1].count;
        })
        .map(([key, data]) => {
          const [name, shift] = key.split("-");
          return {
            name,
            shift,
            count: data.count,
            counter: data.counter,
            totalValue: data.totalValue,
          };
        });
    };

    return {
      byService: sortRecords(groupedRecords.byService),
      byUser: sortRecords(groupedRecords.byUser),
    };
  }, [groupedRecords, sortOrder]);

  //Calculate overall totals
  const overallTotals = useMemo(() => {
    if (!groupedRecords.byService) return;

    return Object.values(groupedRecords.byService).reduce(
      (totals, group) => {
        totals.totalServed += group.count;
        totals.totalValue += group.totalValue;
        return totals;
      },
      { totalServed: 0, totalValue: 0 }
    );
  }, [groupedRecords]);

  const calculateTableTotals = (data: any[]) => {
    return data.reduce(
      (acc, record) => ({
        count: acc.count + record.count,
        totalValue: acc.totalValue + record.totalValue,
      }),
      { count: 0, totalValue: 0 }
    );
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth(); // Get page width for centering
    let yPos = 20;

    const logo = "/images/county.png"; // Replace with actual base64 or URL

    // Logo (far left)
    const logoX = 20; // Far left
    const logoY = 20;
    const logoWidth = 20;
    const logoHeight = 20;

    doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);

    // Header text (centered)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");

    const titleText = "NAIROBI CITY COUNTY";
    const titleX = pageWidth / 2 - doc.getTextWidth(titleText) / 2;
    const titleY = logoY + 5;

    doc.text(titleText, titleX, titleY);

    // Draw gradient line between title and subtitle
    const lineStartX = pageWidth / 4 - 3;
    const lineEndX = (3 * pageWidth) / 4 - 3;
    const lineY = titleY + 5;

    const gradient = doc.setDrawColor(46, 125, 50); // Start with Green
    for (let i = 0; i < lineEndX - lineStartX; i += 2) {
      const ratio = i / (lineEndX - lineStartX);
      const red = 255 * ratio; // Gradually add red
      const green = 128 + 127 * (1 - ratio); // Transition from green to yellow
      doc.setDrawColor(red, green, 0);
      doc.line(lineStartX + i, lineY, lineStartX + i + 2, lineY);
    }

    // Subtitle text (centered)
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");

    const subtitleText =
      "INCLUSIVITY, PUBLIC PARTICIPATION, & CUSTOMER SERVICES";
    const subtitleX = pageWidth / 2 - doc.getTextWidth(subtitleText) / 2;
    const subtitleY = lineY + 5;

    doc.text(subtitleText, subtitleX, subtitleY);

    // Date (far right)
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.setFontSize(6);
    doc.setFont("helvetica", "italic");
    const dateX = pageWidth - doc.getTextWidth(`Date: ${currentDate}`) - 10;
    const dateY = logoY + 5;

    doc.text(`Date: ${currentDate}`, dateX, dateY);

    yPos = subtitleY + 10; // Move yPos below subtitle

    // Station of the report
    doc.setFont("helvetica", "bold");
    doc.text(`Report Summary: ${station}`, dateX, dateY + 5);

    // Function to generate table for a given shift
    const addShiftTable = (
      shiftLabel: string,
      shift: string,
      sortedGroupedRecords: {
        name: string;
        shift: string;
        count: number;
        counter: string;
        totalValue: number;
      }[]
    ) => {
      doc.text(`${shiftLabel} Summary`, 20, yPos);
      yPos += 5;

      const shiftRecords =
        sortedGroupedRecords?.filter((record) => record.shift === shift) || [];
      if (shiftRecords.length === 0) {
        doc.text("No records found", 20, yPos);
        yPos += 10;
        return;
      }

      doc.autoTable({
        startY: yPos,
        head: [
          [
            "No.",
            rankBy === "service" ? "Service Category" : "Biller",
            "Number Served",
            "Total Value",
          ],
        ],
        body: shiftRecords.map((record, index) => [
          index + 1,
          record.name,
          record.count,
          `${record.totalValue.toLocaleString("en-US")}/=`,
        ]),
        foot: [
          [
            "",
            "Total",
            shiftRecords.reduce((sum, record) => sum + record.count, 0),
            shiftRecords.reduce((sum, record) => sum + record.count, 0),
            `${shiftRecords
              .reduce((sum, record) => sum + record.totalValue, 0)
              .toLocaleString("en-US")}/=`,
          ],
        ],
        headStyles: {
          fillColor: [46, 125, 50], // Green header
          textColor: [255, 255, 255], // White text
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [0, 0, 0], // Black text for rows
        },
        footStyles: {
          fillColor: [255, 255, 255], // Green footer
          textColor: [0, 0, 0], // White text
          fontSize: 10,
          fontStyle: "bold",
        },
        margin: { left: 20, right: 20 },
        theme: "grid",
        didDrawPage: (data) => {
          // Add footer to every page
          const pageCount = doc.internal.getNumberOfPages(); // Total number of pages
          const currentPage = data.pageNumber; // Current page number

          // Footer background (green rectangle)
          doc.setFillColor(46, 125, 50); // Green color
          doc.rect(0, 275, pageWidth, 20, "F"); // Draw a filled rectangle as background for the footer

          // Footer text
          doc.setFontSize(10);
          doc.setTextColor("white");
          doc.setFont("helvetica", "bold");
          const footerText = "Let's make Nairobi work";
          const footerX = pageWidth / 2 - doc.getTextWidth(footerText) / 2;
          doc.text(footerText, footerX, 285);

          // Footer subtext
          doc.setFont("helvetica", "italic");
          const footerSubText = "© 2025 All rights reserved.";
          const footerSubX =
            pageWidth / 2 - doc.getTextWidth(footerSubText) / 2;
          doc.text(footerSubText, footerSubX, 290);

          // Page number (far right)
          doc.setFont("helvetica", "bold");
          const pageNumberText = `Page ${currentPage} of ${pageCount}`;
          const pageNumberX = pageWidth - doc.getTextWidth(pageNumberText) - 20; // Far right
          doc.text(pageNumberText, pageNumberX, 290);

          // Thinner Yellow Section
          doc.setFillColor(255, 255, 0); // Yellow color
          doc.rect(0, 295, pageWidth, 10, "F"); // Thinner yellow-filled rectangle
        },
      });

      yPos = doc.autoTable.previous.finalY + 15; // Update Y position after table
    };

    // Add Shift 1 Table
    addShiftTable("Shift 1", "shift 1", sortedGroupedRecords.byUser);

    // Add Shift 2 Table
    addShiftTable("Shift 2", "shift 2", sortedGroupedRecords.byUser);

    // Add Service Summary table when rankBy === "overall"
    if (rankBy === "overall") {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Service Summary", 20, yPos);
      yPos += 10;

      doc.autoTable({
        startY: yPos,
        head: [["Service", "Number Served", "Total Value"]],
        body: sortedGroupedRecords.byService.map((record) => [
          record.name,
          record.count,
          `${record.totalValue.toLocaleString("en-US")}/=`,
        ]),
        headStyles: {
          fillColor: [46, 125, 50], // Green header
          textColor: [255, 255, 255], // White text
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [0, 0, 0], // Black text for rows
        },
        margin: { left: 20, right: 20 },
        theme: "grid",
        didDrawPage: (data) => {
          // Add footer to every page
          const pageCount = doc.internal.getNumberOfPages(); // Total number of pages
          const currentPage = data.pageNumber; // Current page number

          // Footer background (green rectangle)
          doc.setFillColor(46, 125, 50); // Green color
          doc.rect(0, 275, pageWidth, 20, "F"); // Draw a filled rectangle as background for the footer

          // Footer text
          doc.setFontSize(10);
          doc.setTextColor("white");
          doc.setFont("helvetica", "bold");
          const footerText = "Let's make Nairobi work";
          const footerX = pageWidth / 2 - doc.getTextWidth(footerText) / 2;
          doc.text(footerText, footerX, 285);

          // Footer subtext
          doc.setFont("helvetica", "italic");
          const footerSubText = "© 2025 All rights reserved.";
          const footerSubX =
            pageWidth / 2 - doc.getTextWidth(footerSubText) / 2;
          doc.text(footerSubText, footerSubX, 290);

          // Page number (far right)
          doc.setFont("helvetica", "bold");
          const pageNumberText = `Page ${currentPage} of ${pageCount}`;
          const pageNumberX = pageWidth - doc.getTextWidth(pageNumberText) - 20; // Far right
          doc.text(pageNumberText, pageNumberX, 290);

          // Thinner Yellow Section
          doc.setFillColor(255, 255, 0); // Yellow color
          doc.rect(0, 295, pageWidth, 10, "F"); // Thinner yellow-filled rectangle
        },
      });

      yPos = doc.autoTable.previous.finalY + 15; // Update Y position after table
    }

    // Format date for filename (YYYY-MM-DD)
    const formattedDate = new Date().toISOString().split("T")[0];

    // Save the PDF with the date in the filename
    doc.save(`service_report_${station}_${formattedDate}.pdf`);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Service Report Summary
      </h1>

      {/* Overall totals */}
      <div className="bg-gradient-to-r from-green-800 to-yellow-600 text-white p-6 rounded-lg shadow-md mb-8">
        <select
          id="station"
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className="text-2xl font-semibold text-center bg-transparent border border-none"
        >
          <option
            value="Overall"
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Overall total
          </option>
          {Stations.map((station, index) => (
            <option
              key={index}
              value={station.name}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {`${station.name} total`}
            </option>
          ))}
        </select>

        <div className="flex justify-between">
          <div className="flex items-center justify-items-end text-sm font-semibold uppercase">
            <label htmlFor="analysisType" className="flex-1 mr-2">
              Record Type:
            </label>
            <select
              id="recordType"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="flex-1 border px-2 py-1 rounded text-gray-700"
            >
              <option value="receipt">Receipt</option>
              <option value="invoice">Invoice</option>
            </select>
          </div>
          <div className="flex flex-col items-center justify-items-end text-sm font-semibold uppercase">
            <label htmlFor="analysisType" className="flex-1 mr-2">
              filter period:
            </label>
            {/*<DateInfo/>*/}
            <fieldset className="flex  border bg-gray-50 shadow-sm p-2 text-black rounded-md max-md:w-full">
              {/* <legend>Date</legend> */}

              <input
                type="date"
                value={startDate || ""}
                onChange={(e) => setStartDate(e.target.value)}
                className="border px-1 m-1 text-gray-500 rounded bg-gray-100"
              />
              <label className="max-lg:text-sm text-gray-700 mt-2">To</label>
              <input
                type="date"
                value={endDate || ""}
                onChange={(e) => setEndDate(e.target.value)}
                className="border px-1 m-1 text-gray-500 rounded bg-gray-100"
              />
            </fieldset>
          </div>
        </div>

        <div className="flex justify-between mt-4 max-w-screen-md mx-auto bg-green-700 border p-2 rounded-lg">
          <div className="flex flex-col flex-1 items-center">
            <p className="text-lg">Total Customers:</p>
            <p className="text-3xl font-extrabold">
              {overallTotals?.totalServed ?? 0}
            </p>
          </div>
          <div className="flex flex-col flex-1 items-center">
            {recordType === "invoice" ? (
              <p className="text-lg">Total Invoices:</p>
            ) : (
              <p className="text-lg">Total Receipt:</p>
            )}

            <p className="text-3xl font-extrabold">
              {overallTotals?.totalServed ?? 0}
            </p>
          </div>
          <div className="flex flex-col flex-1 items-center">
            <p className="text-lg">Total Value:</p>
            <p className="text-3xl font-extrabold">
              {overallTotals?.totalValue.toLocaleString("en-US") ?? 0}/=
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div className="flex items-center justify-items-end text-sm font-semibold uppercase">
          <label htmlFor="analysisType" className="flex-1 mr-2">
            Ranked by:
          </label>
          <select
            id="rankBy"
            value={rankBy}
            onChange={(e) => setRankBy(e.target.value)}
            className="flex-1 border px-2 py-1 rounded text-gray-700"
          >
            <option value="overall">Overall</option>
            <option value="service">Service</option>
            <option value="biller">Biller</option>
            <option value="biller-ranked">Biller ranked</option>
          </select>
        </div>

        <div className="flex items-center justify-items-end text-sm font-semibold uppercase">
          <label htmlFor="analysisType" className="flex-1 mr-2">
            Sort:
          </label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="flex-1 border px-2 py-1 rounded text-gray-700"
          >
            <option value="numberServed">Number served</option>
            <option value="totalValue">Total Value</option>
          </select>
        </div>
      </div>

      {rankBy === "biller-ranked" ? (
        <table className="min-w-full bg-white border">
          <thead className="bg-green-100">
            <tr>
              <th className="border px-4 py-2">No.</th>
              <th className="border px-4 py-2">Biller</th>
              <th className="border px-4 py-2">Number Served</th>
              <th className="border px-4 py-2">counter</th>
              <th className="border px-4 py-2">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {sortedGroupedRecords.byUser ? (
              sortedGroupedRecords.byUser.map((record, index: number) => (
                <tr key={index}>
                  <td className="border px-4 py-2 text-center">{index + 1}</td>
                  <td className="border px-4 py-2">{record.name}</td>
                  <td className="border px-4 py-2">{record.count}</td>
                  <td className="border px-4 py-2">{record.counter}</td>
                  <td className="border px-4 py-2">
                    {record.totalValue.toLocaleString("en-US")}/=
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  No records found!
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-green-50">
            <tr>
              <td colSpan={2} className="border px-4 py-2 font-bold text-right">
                Total
              </td>
              <td className="border px-4 py-2 font-bold">
                {sortedGroupedRecords.byUser?.reduce(
                  (sum, record) => sum + record.count,
                  0
                )}
              </td>
              <td className="border px-4 py-2 font-bold">-</td>
              <td className="border px-4 py-2 font-bold">
                {sortedGroupedRecords.byUser
                  ?.reduce((sum, record) => sum + record.totalValue, 0)
                  .toLocaleString("en-US")}
                /=
              </td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <>
          <h4 className="my-4 text-center">Shift 1</h4>

          <table className="min-w-full bg-white border">
            <thead className="bg-green-100">
              <tr>
                <th className="border px-4 py-2">No.</th>
                <th className="border px-4 py-2">
                  {rankBy === "service" ? "Service Category" : "Biller"}
                </th>
                <th className="border px-4 py-2">Number Served</th>
                {(rankBy == "biller" || rankBy === "overall") && (
                  <th className="border px-4 py-2">counter</th>
                )}
                <th className="border px-4 py-2">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {rankBy === "service" ? (
                sortedGroupedRecords.byService ? (
                  sortedGroupedRecords.byService
                    .filter(
                      (record) => record.shift.toLowerCase() === "shift 1"
                    )
                    .map((record, index: number) => (
                      <tr key={index}>
                        <td className="border px-4 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border px-4 py-2">{record.name}</td>
                        <td className="border px-4 py-2">{record.count}</td>
                        <td className="border px-4 py-2">
                          {record.totalValue.toLocaleString("en-US")}/=
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No records found!
                    </td>
                  </tr>
                )
              ) : sortedGroupedRecords.byUser ? (
                sortedGroupedRecords.byUser
                  .filter((record) => record.shift.toLowerCase() === "shift 1")
                  .map((record, index: number) => (
                    <tr key={index}>
                      <td className="border px-4 py-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border px-4 py-2">{record.name}</td>
                      <td className="border px-4 py-2">{record.count}</td>
                      {(rankBy == "biller" || rankBy === "overall") && (
                        <td className="border px-4 py-2">{record.counter}</td>
                      )}
                      <td className="border px-4 py-2">
                        {record.totalValue.toLocaleString("en-US")}/=
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No records found!
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-green-50">
              <tr>
                <td
                  colSpan={rankBy === "service" ? 2 : 2}
                  className="border px-4 py-2 font-bold text-right"
                >
                  Total
                </td>
                <td className="border px-4 py-2 font-bold">
                  {sortedGroupedRecords.byUser
                    ?.filter(
                      (record) => record.shift.toLowerCase() === "shift 1"
                    )
                    .reduce((sum, record) => sum + record.count, 0)}
                </td>
                {rankBy !== "service" && (
                  <td className="border px-4 py-2 font-bold">-</td>
                )}
                <td className="border px-4 py-2 font-bold">
                  {sortedGroupedRecords.byUser
                    ?.filter(
                      (record) => record.shift.toLowerCase() === "shift 1"
                    )
                    .reduce((sum, record) => sum + record.totalValue, 0)
                    .toLocaleString("en-US")}
                  /=
                </td>
              </tr>
            </tfoot>
          </table>

          <h4 className="my-4 text-center">Shift 2</h4>

          {/* Table of shift 2*/}
          <table className="min-w-full bg-white border">
            <thead className="bg-green-100">
              <tr>
                <th className="border px-4 py-2">No.</th>
                <th className="border px-4 py-2">
                  {rankBy === "service" ? "Service Category" : "Biller"}
                </th>
                <th className="border px-4 py-2">Number Served</th>
                {(rankBy == "biller" || rankBy === "overall") && (
                  <th className="border px-4 py-2">counter</th>
                )}
                <th className="border px-4 py-2">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {rankBy === "service" ? (
                sortedGroupedRecords.byService ? (
                  sortedGroupedRecords.byService
                    .filter(
                      (record) => record.shift.toLowerCase() === "shift 2"
                    )
                    .map((record, index: number) => (
                      <tr key={index}>
                        <td className="border px-4 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border px-4 py-2">{record.name}</td>
                        <td className="border px-4 py-2">{record.count}</td>
                        <td className="border px-4 py-2">
                          {record.totalValue.toLocaleString("en-US")}/=
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No records found!
                    </td>
                  </tr>
                )
              ) : sortedGroupedRecords.byUser ? (
                sortedGroupedRecords.byUser
                  .filter((record) => record.shift.toLowerCase() === "shift 2")
                  .map((record, index: number) => (
                    <tr key={index}>
                      <td className="border px-4 py-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border px-4 py-2">{record.name}</td>
                      <td className="border px-4 py-2">{record.count}</td>
                      {(rankBy == "biller" || rankBy === "overall") && (
                        <td className="border px-4 py-2">{record.counter}</td>
                      )}
                      <td className="border px-4 py-2">
                        {record.totalValue.toLocaleString("en-US")}/=
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No records found!
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-green-50">
              <tr>
                <td
                  colSpan={rankBy === "service" ? 2 : 2}
                  className="border px-4 py-2 font-bold text-right"
                >
                  Total
                </td>
                <td className="border px-4 py-2 font-bold">
                  {sortedGroupedRecords.byUser
                    ?.filter(
                      (record) => record.shift.toLowerCase() === "shift 1"
                    )
                    .reduce((sum, record) => sum + record.count, 0)}
                </td>
                {rankBy !== "service" && (
                  <td className="border px-4 py-2 font-bold">-</td>
                )}
                <td className="border px-4 py-2 font-bold">
                  {sortedGroupedRecords.byUser
                    ?.filter(
                      (record) => record.shift.toLowerCase() === "shift 1"
                    )
                    .reduce((sum, record) => sum + record.totalValue, 0)
                    .toLocaleString("en-US")}
                  /=
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Service summary */}

          {rankBy === "overall" && (
            <>
              <h4 className="my-4 text-center">Service Summary</h4>
              <table className="min-w-full bg-white border">
                <thead className="bg-green-100">
                  <tr>
                    <th className="border px-4 py-2">Service</th>
                    <th className="border px-4 py-2">Number Served</th>
                    <th className="border px-4 py-2">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGroupedRecords.byService.map((record, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">{record.name}</td>
                      <td className="border px-4 py-2">{record.count}</td>
                      <td className="border px-4 py-2">
                        {record.totalValue.toLocaleString("en-US")}/=
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-green-50">
                  <tr>
                    <td className="border px-4 py-2 font-bold text-right">
                      Total
                    </td>
                    <td className="border px-4 py-2 font-bold">
                      {sortedGroupedRecords.byService?.reduce(
                        (sum, record) => sum + record.count,
                        0
                      )}
                    </td>
                    <td className="border px-4 py-2 font-bold">
                      {sortedGroupedRecords.byService
                        ?.reduce((sum, record) => sum + record.totalValue, 0)
                        .toLocaleString("en-US")}
                      /=
                    </td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </>
      )}

      <div className="flex justify-center mt-6 w-fit mx-auto">
        <button
          onClick={generatePDF}
          className="bg-green-800 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700"
        >
          Generate PDF
        </button>
      </div>
    </div>
  );
}
