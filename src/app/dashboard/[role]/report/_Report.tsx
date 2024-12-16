"use client";
import { Record } from "@/app/lib/definitions";
import { filterRecordsByTimeRange } from "@/app/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import React, { useEffect, useState } from "react";

export default function ReportPage({ records }: { records: Record[] }) {
  const [analysisType, setAnalysisType] = useState<string>("year");
  const [useRecords, setUseRecords] = useState(() => {
    if (analysisType === "year")
      return filterRecordsByTimeRange(records, analysisType);
    if (analysisType === "month")
      return filterRecordsByTimeRange(records, analysisType);
    if (analysisType === "week")
      return filterRecordsByTimeRange(records, analysisType);
    if (analysisType === "day")
      return filterRecordsByTimeRange(records, analysisType);
    return [];
  });

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAnalysisType(event.target.value);
  };

  useEffect(() => {
    const filteredRecords = filterRecordsByTimeRange(records, analysisType);
    setUseRecords(filteredRecords); // Update the state with filtered records
  }, [analysisType, records]);

  // Group records by service category
  const groupedRecords = useRecords?.reduce(
    (acc: Record<string, { count: number; totalValue: number }>, record) => {
      if (!acc[record.service]) {
        acc[record.service] = { count: 0, totalValue: 0 };
      }
      acc[record.service].count += 1;
      acc[record.service].totalValue += record.value;
      return acc;
    },
    {}
  );

  // Calculate overall totals
  const overallTotals = Object.values(groupedRecords).reduce(
    (totals, group) => {
      totals.totalServed += group.count;
      totals.totalValue += group.totalValue;
      return totals;
    },
    { totalServed: 0, totalValue: 0 }
  );

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

    doc.text(`Total Customers: ${overallTotals.totalServed}`, 20, 40);
    doc.text(`Total Invoices: ${overallTotals.totalServed}`, 20, 50);
    doc.text(
      `Total Value: ${overallTotals.totalValue.toLocaleString("en-US")}/=`,
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
        <h2 className="flex text-2xl font-semibold justify-center">
          Overall Totals
        </h2>
        <div className="flex justify-end">
          <div className="flex items-center justify-items-end text-sm font-semibold uppercase">
            <label htmlFor="analysisType" className="flex-1 mr-2">
              Analysis Type:
            </label>
            <select
              id="analysisType"
              value={analysisType}
              onChange={handleChange}
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
              {overallTotals.totalServed}
            </p>
          </div>
          <div className="flex flex-col flex-1 items-center">
            <p className="text-lg">Total Invoices:</p>
            <p className="text-3xl font-extrabold">
              {overallTotals.totalServed}
            </p>
          </div>
          <div className="flex flex-col flex-1 items-center">
            <p className="text-lg">Total Value:</p>
            <p className="text-3xl font-extrabold">
              {overallTotals.totalValue.toLocaleString("en-US")}/=
            </p>
          </div>
        </div>
      </div>

      {/* Service category summaries */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 mx-auto">
          <thead className="bg-green-100 text-green-800 max-lg:text-sm max-sm:text-xs">
            <tr>
              <th className="border px-2 py-2">No.</th>
              <th className="border px-4 py-2">Service Category</th>
              <th className="border px-4 py-2">Number Served</th>
              <th className="border px-4 py-2">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedRecords).map(
              ([serviceCategory, { count, totalValue }], index) => (
                <tr
                  className="max-lg:text-sm max-sm:text-xs hover:bg-gray-50"
                  key={serviceCategory}
                >
                  <td className="border px-2 py-2 text-center">{index + 1}</td>
                  <td className="border px-4 py-2">{serviceCategory}</td>
                  <td className="border px-4 py-2">{count}</td>
                  <td className="border px-4 py-2 font-bold">
                    {totalValue.toLocaleString("en-US")}/=
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
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
