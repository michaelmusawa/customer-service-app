"use client";

import { Stations } from "@/app/lib/data";
import { EditedRecord, Record } from "@/app/lib/definitions";
import { filterRecordsByTimeRange, mergeRecordsWithEdits } from "@/app/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import React, { useEffect, useMemo, useState } from "react";

export default function ReportPage({ fetchedRecords, editedRecords }: { fetchedRecords: Record[], editedRecords: EditedRecord[]; }) {

 const records = mergeRecordsWithEdits(fetchedRecords ?? [], editedRecords ?? []);

  const [analysisType, setAnalysisType] = useState<string>("year");
  const [recordType, setRecordType] = useState<string>("invoice");
  const [rankBy, setRankBy] = useState<string>("service");
  const [sortOrder, setSortOrder] = useState<string>("totalValue");

  const [useRecords, setUseRecords] = useState<Record[]>([]);
  const [recordsOfType, setRecordsOfType] = useState<Record[]>([]);
  const [station, setStation] = useState<string>('Overall');
  const [localRecords, setLocalRecords] = useState<Record[]>([]);

  useEffect(() => {
    if (station === 'Overall') {
      setLocalRecords(records);
    } else {
     const filteredLocalRecords = records?.filter(record => record.userStation === station);
     setLocalRecords(filteredLocalRecords)
    }
    
  }, [station, records])
  

  type GroupedRecords = {
    [key: string]: {
      count: number;
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
    return useRecords?.reduce((acc: GroupedRecords, record) => {
      const key = rankBy === "service" ? record.service : record.userName;

      if (!acc[key]) {
        acc[key] = { count: 0, totalValue: 0 };
      }
      acc[key].count += 1;
      acc[key].totalValue += record.value;
      return acc;
    }, {});
  }, [useRecords, rankBy]);

  const sortedGroupedRecords = useMemo(() => {
    if (!groupedRecords){return}
    const sorted = Object.entries(groupedRecords).sort((a, b) => {
      if (sortOrder === "totalValue") return b[1].totalValue - a[1].totalValue;
      return b[1].count - a[1].count;
    });
    return sorted;
  }, [groupedRecords, sortOrder]);

  // Calculate overall totals
  const overallTotals = useMemo(() => {
    if (!groupedRecords){return}
    return Object.values(groupedRecords).reduce(
      (totals, group) => {
        totals.totalServed += group.count;
        totals.totalValue += group.totalValue;
        return totals;
      },
      { totalServed: 0, totalValue: 0 }
    );
  }, [groupedRecords]);

  const generatePDF = () => {
    const doc = new jsPDF();

    // Title of the report
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Service Report Summary", 20, 20);

    // Overall Totals section
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Overall Totals", 20, 30);

    doc.text(`Total Customers: ${overallTotals?.totalServed}`, 20, 40);
    doc.text(`Total Invoices: ${overallTotals?.totalServed}`, 20, 50);
    doc.text(
      `Total Value: ${overallTotals?.totalValue.toLocaleString("en-US")}/=`,
      20,
      60
    );

    // Service Category Table
    doc.text("Service Category Summary", 20, 70);

    doc.autoTable({
      startY: 80,
      head: [["No.", "Service Category", "Number Served", "Total Value"]],
      body: Object.entries(groupedRecords).map(
        ([serviceCategory, { count, totalValue }], index) => [
          index + 1,
          serviceCategory,
          count,
          `${totalValue.toLocaleString("en-US")}/=`,
        ]
      ),
      headStyles: {
        fillColor: [41, 128, 185], // Blue
        textColor: [255, 255, 255], // White
        fontSize: 12,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 12,
        lineColor: [211, 211, 211], // Light gray line color
        halign: "center", // Center align text in cells
      },
      tableWidth: "auto", // Adjust column width to content
      margin: { top: 10, left: 20, right: 20, bottom: 10 },
      theme: "grid",
    });

    // Save the PDF
    doc.save("service_report.pdf");
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
  <option value="Overall" className="bg-gray-100 text-gray-700 hover:bg-gray-200">Overall total</option>
  {Stations.map((station, index) => (
    <option key={index} value={station.name} className="bg-gray-100 text-gray-700 hover:bg-gray-200">
      {`${station.name} total` }
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
          <div className="flex items-center justify-items-end text-sm font-semibold uppercase">
            <label htmlFor="analysisType" className="flex-1 mr-2">
              Analysis Type:
            </label>
            <select
              id="analysisType"
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="flex-1 border px-2 py-1 rounded text-gray-700"
            >
              <option value="year">This year</option>
              <option value="month">This month</option>
              <option value="week">This week</option>
              <option value="day">Today</option>
            </select>
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
            <option value="service">Service</option>
            <option value="biller">Biller</option>
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

   

      {/* Table */}
      <table className="min-w-full bg-white border">
        <thead className="bg-green-100">
          <tr>
            <th className="border px-4 py-2">No.</th>
            <th className="border px-4 py-2">
              {rankBy === "service" ? "Service Category" : "Biller"}
            </th>
            <th className="border px-4 py-2">Number Served</th>
            <th className="border px-4 py-2">Total Value</th>
          </tr>
        </thead>
        <tbody>
          {sortedGroupedRecords ? (
             sortedGroupedRecords?.map(([name, data], index: number) => (
              <tr key={index}>
                <td className="border px-4 py-2 text-center">{index + 1}</td>
                <td className="border px-4 py-2">{name}</td>
                <td className="border px-4 py-2">{data.count}</td>
                <td className="border px-4 py-2">
                  {data.totalValue.toLocaleString("en-US")}/=
                </td>
              </tr>
            ))
          ):(
            <tr>
                <td
                  colSpan={4}
                  className="text-center py-4"
                >
                  No records found!
                </td>
              </tr>
          )}
         
        </tbody>
      </table>

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
