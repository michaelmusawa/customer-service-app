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

  // Generating pdf function

  //  const generatePDF = () => {
  //   const doc = new jsPDF();
  //   const pageWidth = doc.internal.pageSize.getWidth();
  //   let yPos = 20;

  //   const logo = "/images/county.png";

  //   // Logo (far left)
  //   const logoX = 20; // Far left
  //   const logoY = 20;
  //   const logoWidth = 20;
  //   const logoHeight = 20;

  //   doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);

  //   // Header text (centered)
  //   doc.setFontSize(14);
  //   doc.setFont("helvetica", "bold");

  //   const titleText = "NAIROBI CITY COUNTY";
  //   const titleX = pageWidth / 2 - doc.getTextWidth(titleText) / 2;
  //   const titleY = logoY + 5;

  //   doc.text(titleText, titleX, titleY);

  //   // Draw gradient line between title and subtitle
  //   const lineStartX = pageWidth / 4 - 3;
  //   const lineEndX = (3 * pageWidth) / 4 - 3;
  //   const lineY = titleY + 5;

  //   const gradient = doc.setDrawColor(46, 125, 50); // Start with Green
  //   for (let i = 0; i < lineEndX - lineStartX; i += 2) {
  //     const ratio = i / (lineEndX - lineStartX);
  //     const red = 255 * ratio; // Gradually add red
  //     const green = 128 + 127 * (1 - ratio); // Transition from green to yellow
  //     doc.setDrawColor(red, green, 0);
  //     doc.line(lineStartX + i, lineY, lineStartX + i + 2, lineY);
  //   }

  //   // Subtitle text (centered)
  //   doc.setFontSize(8);
  //   doc.setFont("helvetica", "bold");

  //   const subtitleText =
  //     "INCLUSIVITY, PUBLIC PARTICIPATION, & CUSTOMER SERVICES";
  //   const subtitleX = pageWidth / 2 - doc.getTextWidth(subtitleText) / 2;
  //   const subtitleY = lineY + 5;

  //   doc.text(subtitleText, subtitleX, subtitleY);

  //   // Date (far right)
  //   const currentDate = new Date().toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "long",
  //     day: "numeric",
  //   });

  //   doc.setFontSize(6);
  //   doc.setFont("helvetica", "italic");
  //   const dateX = pageWidth - doc.getTextWidth(`Date: ${currentDate}`) - 10;
  //   const dateY = logoY + 5;

  //   doc.text(`Date: ${currentDate}`, dateX, dateY);

  //   yPos = subtitleY + 10; // Move yPos below subtitle

  //   // Station of the report
  //   doc.setFont("helvetica", "bold");
  //   doc.text(`Report Summary: ${station}`, dateX, dateY + 5);

  //   // Footer drawing function ------------------------------
  //   const drawFooter = (data: any) => {
  //     const pageCount = doc.internal.getNumberOfPages();
  //     const currentPage = data.pageNumber;

  //     // Narrower footer background
  //     doc.setFillColor(46, 125, 50);
  //     doc.rect(0, 280, pageWidth, 15, "F"); // Reduced height and position

  //     // Footer text
  //     doc.setFontSize(10);
  //     doc.setTextColor("white");
  //     doc.setFont("helvetica", "bold");
  //     doc.text(
  //       "Let's make Nairobi work",
  //       pageWidth / 2 - doc.getTextWidth("Let's make Nairobi work") / 2,
  //       288
  //     );

  //     // Page number
  //     const pageNumberText = `Page ${currentPage} of ${pageCount}`;
  //     doc.text(
  //       pageNumberText,
  //       pageWidth - doc.getTextWidth(pageNumberText) - 10,
  //       288
  //     );

  //     // Thinner yellow section
  //     doc.setFillColor(255, 255, 0);
  //     doc.rect(0, 290, pageWidth, 5, "F");
  //   };

  //   // Deep seek code -------------------------------

  //   // const addTableSection = (
  //   //   title: string,
  //   //   data: any[],
  //   //   columns: string[],
  //   //   showCounter: boolean
  //   // ) => {
  //   //   // Add section title
  //   //   doc.setFontSize(12).setFont("helvetica", "bold").text(title, 20, yPos);
  //   //   yPos += 8;

  //   //   doc.autoTable({
  //   //     startY: yPos,
  //   //     head: [columns],
  //   //     body: data.map((record, index) => [
  //   //       index + 1,
  //   //       record.name,
  //   //       record.count,
  //   //       ...(showCounter ? [record.counter] : []),
  //   //       `${record.totalValue.toLocaleString("en-US")}/=`
  //   //     ]),
  //   //     foot: [[
  //   //       "",
  //   //       "Total",
  //   //       data.reduce((sum, r) => sum + r.count, 0),
  //   //       ...(showCounter ? ["-"] : []),
  //   //       `${data.reduce((sum, r) => sum + r.totalValue, 0).toLocaleString("en-US")}/=`
  //   //     ]],
  //   //     headStyles: {
  //   //       fillColor: [46, 125, 50],
  //   //       textColor: 255,
  //   //       fontSize: 10,
  //   //       fontStyle: "bold"
  //   //     },
  //   //     bodyStyles: { fontSize: 8 },
  //   //     footStyles: {
  //   //       fillColor: [46, 125, 50],
  //   //       textColor: 255,
  //   //       fontSize: 10
  //   //     },
  //   //     margin: { left: 20, right: 20 },
  //   //     theme: "grid",
  //   //     showFoot: 'lastPage',
  //   //     didDrawPage: drawFooter
  //   //   });

  //   //   yPos = doc.autoTable.previous.finalY + 15;
  //   // };

  //   // // End of const add table selection deepseek -----------

  //   //   // Main content tables
  //   //   if (rankBy === "service") {
  //   //     addTableSection(
  //   //       "Shift 1 - Service Summary",
  //   //       sortedGroupedRecords.byService.filter((r: any) => r.shift === "shift 1"),
  //   //       ["No.", "Service Category", "Number Served", "Total Value"],
  //   //       false
  //   //     );
  //   //     addTableSection(
  //   //       "Shift 2 - Service Summary",
  //   //       sortedGroupedRecords.byService.filter((r: any) => r.shift === "shift 2"),
  //   //       ["No.", "Service Category", "Number Served", "Total Value"],
  //   //       false
  //   //     );
  //   //   } else if (rankBy === "biller-ranked") {
  //   //     addTableSection(
  //   //       "Biller Performance Summary",
  //   //       sortedGroupedRecords.byUser,
  //   //       ["No.", "Biller", "Number Served", "Counter", "Total Value"],
  //   //       true
  //   //     );
  //   //   } else {
  //   //     addTableSection(
  //   //       "Shift 1 Summary",
  //   //       sortedGroupedRecords.byUser.filter((r: any) => r.shift === "shift 1"),
  //   //       ["No.", "Biller", "Number Served", "Counter", "Total Value"],
  //   //       true
  //   //     );
  //   //     addTableSection(
  //   //       "Shift 2 Summary",
  //   //       sortedGroupedRecords.byUser.filter((r: any) => r.shift === "shift 2"),
  //   //       ["No.", "Biller", "Number Served", "Counter", "Total Value"],
  //   //       true
  //   //     );
  //   //   }

  //   // End of main table content -----------------

  //   // Function to generate table for a given shift -------------------
  //   const addShiftTable = (
  //     shiftLabel: string,
  //     shift: string,
  //     records: typeof sortedGroupedRecords.byUser,
  //     isServiceTable: boolean = false
  //   ) => {
  //     // Add table label
  //     doc.setFontSize(12);
  //     doc.setFont("helvetica", "bold");
  //     doc.text(`${shiftLabel}`, 20, yPos);
  //     yPos += 8;

  //     const filteredRecords =
  //       records?.filter((record) => record.shift.toLowerCase() === shift) || [];

  //     // Common table configuration
  //     const baseTableConfig = {
  //       headStyles: {
  //         fillColor: [46, 125, 50],
  //         textColor: [255, 255, 255],
  //         fontSize: 10,
  //         fontStyle: "bold",
  //       },
  //       bodyStyles: {
  //         fontSize: 8,
  //         textColor: [0, 0, 0],
  //       },
  //       footStyles: {
  //         fillColor: [46, 125, 50],
  //         textColor: [255, 255, 255],
  //         fontSize: 10,
  //         fontStyle: "bold",
  //       },
  //       margin: { left: 20, right: 20 },
  //       theme: "grid",
  //       didDrawPage: (data) => {
  //         // Add footer to every page
  //         const pageCount = doc.internal.getNumberOfPages(); // Total number of pages
  //         const currentPage = data.pageNumber; // Current page number

  //         // Footer background (green rectangle)
  //         doc.setFillColor(46, 125, 50); // Green color
  //         doc.rect(0, 286, pageWidth, 15, "F"); // Draw a filled rectangle as background for the footer

  //         // Footer text
  //         doc.setFontSize(10);
  //         doc.setTextColor("white");
  //         doc.setFont("helvetica", "bold");
  //         doc.text(
  //           "Let's make Nairobi work",
  //           pageWidth / 2 - doc.getTextWidth("Let's make Nairobi work") / 2,
  //           290
  //         );

  //         // Footer subtext
  //         doc.setFontSize(6);
  //         doc.setFont("helvetica", "italic");
  //         const footerSubText = "© 2025 All rights reserved.";
  //         const footerSubX =
  //           pageWidth / 2 - doc.getTextWidth(footerSubText) / 2;
  //         doc.text(footerSubText, footerSubX, 293);

  //         // Page number (far right)
  //         doc.setFont("helvetica", "bold");
  //         const pageNumberText = `Page ${currentPage} of ${pageCount}`;
  //         doc.text(
  //           pageNumberText,
  //           pageWidth - doc.getTextWidth(pageNumberText) - 10,
  //           291
  //         );

  //         // Thinner Yellow Section
  //         doc.setFillColor(255, 255, 0); // Yellow color
  //         doc.rect(0, 295, pageWidth, 2, "F"); // Thinner yellow-filled rectangle
  //       },
  //     };

  //     if (rankBy === "biller-ranked") {
  //       doc.autoTable({
  //         ...baseTableConfig,
  //         startY: yPos,
  //         head: [["No.", "Biller", "Number Served", "Counter", "Total Value"]],
  //         body: records.map((record, index) => [
  //           index + 1,
  //           record.name,
  //           record.count,
  //           record.counter,
  //           `${record.totalValue.toLocaleString("en-US")}/=`,
  //         ]),
  //         foot: [
  //           [
  //             "",
  //             "Total",
  //             records.reduce((sum, record) => sum + record.count, 0),
  //             "-",
  //             `${records
  //               .reduce((sum, record) => sum + record.totalValue, 0)
  //               .toLocaleString("en-US")}/=`,
  //           ],
  //         ],
  //       });
  //     } else {
  //       const showCounter = rankBy === "biller" || rankBy === "overall";

  //       doc.autoTable({
  //         ...baseTableConfig,
  //         startY: yPos,
  //         head: [
  //           [
  //             "No.",
  //             rankBy === "service" ? "Service Category" : "Biller",
  //             "Number Served",
  //             ...(showCounter ? ["Counter"] : []),
  //             "Total Value",
  //           ],
  //         ],
  //         body: filteredRecords.map((record, index) => [
  //           index + 1,
  //           record.name,
  //           record.count,
  //           ...(showCounter ? [record.counter] : []),
  //           `${record.totalValue.toLocaleString("en-US")}/=`,
  //         ]),
  //         foot: [
  //           [
  //             "",
  //             "Total",
  //             filteredRecords.reduce((sum, record) => sum + record.count, 0),
  //             ...(showCounter ? ["-"] : []),
  //             `${filteredRecords
  //               .reduce((sum, record) => sum + record.totalValue, 0)
  //               .toLocaleString("en-US")}/=`,
  //           ],
  //         ],
  //       });
  //     }

  //     yPos = doc.autoTable.previous.finalY + 15;
  //   };

  //   if (rankBy === "service") {
  //     // Add Shift 1 Table
  //     addShiftTable("Shift 1", "shift 1", sortedGroupedRecords.byService);

  //     // Add Shift 2 Table
  //     addShiftTable("Shift 2", "shift 2", sortedGroupedRecords.byService);
  //   } else if (rankBy === "biller-ranked") {
  //     // Add Shift 1 Table
  //     addShiftTable("Shift 1", "shift 1", sortedGroupedRecords.byUser);
  //   } else {
  //     // Add Shift 1 Table
  //     addShiftTable("Shift 1", "shift 1", sortedGroupedRecords.byUser);

  //     // Add Shift 2 Table
  //     addShiftTable("Shift 2", "shift 2", sortedGroupedRecords.byUser);
  //   }

  //   // Add Service Summary Table
  //   if (rankBy === "overall") {
  //     doc.autoTable({
  //       startY: yPos,
  //       head: [["Service", "Number Served", "Total Value"]],
  //       body: sortedGroupedRecords.byService.map((record) => [
  //         record.name,
  //         record.count,
  //         `${record.totalValue.toLocaleString("en-US")}/=`,
  //       ]),
  //       foot: [
  //         [
  //           "Total",
  //           sortedGroupedRecords.byService.reduce(
  //             (sum, record) => sum + record.count,
  //             0
  //           ),
  //           `${sortedGroupedRecords.byService
  //             .reduce((sum, record) => sum + record.totalValue, 0)
  //             .toLocaleString("en-US")}/=`,
  //         ],
  //       ],
  //       headStyles: {
  //         fillColor: [46, 125, 50],
  //         textColor: [255, 255, 255],
  //         fontSize: 10,
  //         fontStyle: "bold",
  //       },
  //       bodyStyles: {
  //         fontSize: 8,
  //         textColor: [0, 0, 0],
  //       },
  //       footStyles: {
  //         fillColor: [46, 125, 50],
  //         textColor: [255, 255, 255],
  //         fontSize: 10,
  //         fontStyle: "bold",
  //       },
  //       margin: { left: 20, right: 20 },
  //       theme: "grid",

  //       didDrawPage: drawFooter,
  //       //   // Add footer to every page
  //       //   const pageCount = doc.internal.getNumberOfPages(); // Total number of pages
  //       //   const currentPage = data.pageNumber; // Current page number

  //       //   // Footer background (green rectangle)
  //       //   doc.setFillColor(46, 125, 50); // Green color
  //       //   doc.rect(0, 275, pageWidth, 20, "F"); // Draw a filled rectangle as background for the footer

  //       //   // Footer text
  //       //   doc.setFontSize(10);
  //       //   doc.setTextColor("white");
  //       //   doc.setFont("helvetica", "bold");
  //       //   const footerText = "Let's make Nairobi work";
  //       //   const footerX = pageWidth / 2 - doc.getTextWidth(footerText) / 2;
  //       //   doc.text(footerText, footerX, 285);

  //       //   // Footer subtext
  //       //   doc.setFont("helvetica", "italic");
  //       //   const footerSubText = "© 2025 All rights reserved.";
  //       //   const footerSubX =
  //       //     pageWidth / 2 - doc.getTextWidth(footerSubText) / 2;
  //       //   doc.text(footerSubText, footerSubX, 290);

  //       //   // Page number (far right)
  //       //   doc.setFont("helvetica", "bold");
  //       //   const pageNumberText = `Page ${currentPage} of ${pageCount}`;
  //       //   const pageNumberX = pageWidth - doc.getTextWidth(pageNumberText) - 20; // Far right
  //       //   doc.text(pageNumberText, pageNumberX, 290);

  //       //   // Thinner Yellow Section
  //       //   doc.setFillColor(255, 255, 0); // Yellow color
  //       //   doc.rect(0, 295, pageWidth, 10, "F"); // Thinner yellow-filled rectangle
  //       // },
  //     });

  //     yPos = doc.autoTable.previous.finalY + 15; // Update Y position after table
  //   }

  //   // Add final summary section
  //   doc.setFontSize(14);
  //   doc.setFont("helvetica", "bold");
  //   doc.text("Overall Summary", 20, yPos);
  //   yPos += 10;

  //   const summaryData = [
  //     ["Total Customers Served:", overallTotals?.totalServed],
  //     [
  //       "Total Value:",
  //       `${overallTotals?.totalValue.toLocaleString("en-US")}/=`,
  //     ],
  //     ["Total Invoices/Receipts:", overallTotals?.totalServed],
  //   ];

  //   doc.autoTable({
  //     startY: yPos,
  //     head: [["Metric", "Value"]],
  //     body: summaryData,
  //     headStyles: {
  //       fillColor: [46, 125, 50],
  //       textColor: [255, 255, 255],
  //       fontSize: 12,
  //       fontStyle: "bold",
  //     },
  //     bodyStyles: { fontSize: 11 },
  //     theme: "grid",
  //   });

  //   // Format date for filename (YYYY-MM-DD)
  //   const formattedDate = new Date().toISOString().split("T")[0];

  //   // Save the PDF with the date in the filename
  //   doc.save(`service_report_${station}_${formattedDate}.pdf`);
  // };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    const logo = "/images/county.png";

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

    // Dark green to darker yellow gradient
    for (let i = 0; i < lineEndX - lineStartX; i += 2) {
      const ratio = i / (lineEndX - lineStartX);
      const red = 180 * ratio; // Red increases from 0 to 180
      const green = 100 + 80 * (1 - ratio); // Green decreases from 180 to 100
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

    // Footer drawing function ------------------------------

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawFooter = (data: any) => {
      //const pageCount = doc.internal.getNumberOfPages();
      const currentPage = data.pageNumber;

      // Narrower footer background
      doc.setFillColor(46, 125, 50);
      doc.rect(0, 286, pageWidth, 15, "F"); // Reduced height and position

      // Footer text
      doc.setFontSize(10);
      doc.setTextColor("white");
      doc.setFont("helvetica", "bold");
      doc.text(
        "Let's make Nairobi work",
        pageWidth / 2 - doc.getTextWidth("Let's make Nairobi work") / 2,
        292
      );

      // Page number
      const pageNumberText = `Page ${currentPage}`;
      doc.text(
        pageNumberText,
        pageWidth - doc.getTextWidth(pageNumberText) - 10,
        292
      );

      // Thinner yellow section
      doc.setFillColor(255, 255, 0);
      doc.rect(0, 295, pageWidth, 5, "F");
    };

    yPos += 10;

    const addTableSection = (
      title: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: any[],
      columns: string[],
      showCounter: boolean
    ) => {
      // Add section title
      doc.setFontSize(12).setFont("helvetica", "bold").text(title, 20, yPos);
      yPos += 8;

      doc.autoTable({
        startY: yPos,
        head: [columns],
        body: data.map((record, index) => [
          index + 1,
          record.name,
          record.count,
          ...(showCounter ? [record.counter] : []),
          `${record.totalValue.toLocaleString("en-US")}/=`,
        ]),
        foot: [
          [
            "",
            "Total",
            data.reduce((sum, r) => sum + r.count, 0),
            ...(showCounter ? ["-"] : []),
            `${data
              .reduce((sum, r) => sum + r.totalValue, 0)
              .toLocaleString("en-US")}/=`,
          ],
        ],
        headStyles: {
          fillColor: [46, 125, 50],
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 8 },
        footStyles: {
          fillColor: [46, 125, 50],
          textColor: 255,
          fontSize: 10,
        },
        margin: { left: 20, right: 20 },
        theme: "grid",
        showFoot: "lastPage",
        didDrawPage: drawFooter,
      });

      yPos = doc.autoTable.previous.finalY + 15;
    };

    // Main content tables
    if (rankBy === "service") {
      addTableSection(
        "Shift 1 - Service Summary",
        sortedGroupedRecords.byService.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (r: any) => r.shift.toLowerCase() === "shift 1"
        ),
        ["No.", "Service Category", "Number Served", "Total Value"],
        false
      );
      addTableSection(
        "Shift 2 - Service Summary",
        sortedGroupedRecords.byService.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (r: any) => r.shift.toLowerCase() === "shift 2"
        ),
        ["No.", "Service Category", "Number Served", "Total Value"],
        false
      );
    } else if (rankBy === "biller-ranked") {
      addTableSection(
        "Biller Performance Summary",
        sortedGroupedRecords.byUser,
        ["No.", "Biller", "Number Served", "Counter", "Total Value"],
        true
      );
    } else {
      addTableSection(
        "Shift 1 Summary",
        sortedGroupedRecords.byUser.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (r: any) => r.shift.toLowerCase() === "shift 1"
        ),
        ["No.", "Biller", "Number Served", "Counter", "Total Value"],
        true
      );
      addTableSection(
        "Shift 2 Summary",
        sortedGroupedRecords.byUser.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (r: any) => r.shift.toLowerCase() === "shift 2"
        ),
        ["No.", "Biller", "Number Served", "Counter", "Total Value"],
        true
      );
    }

    // Service Summary Table
    if (rankBy === "overall") {
      addTableSection(
        "Service Summary",
        sortedGroupedRecords.byService,
        ["No.", "Service", "Number Served", "Total value"],
        false
      );
    }
    // Add final summary section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Overall Summary", 20, yPos);
    yPos += 10;

    const summaryData = [
      ["Total Customers Served:", overallTotals?.totalServed],
      [
        "Total Value:",
        `${overallTotals?.totalValue.toLocaleString("en-US")}/=`,
      ],
      ["Total Invoices/Receipts:", overallTotals?.totalServed],
    ];

    doc.autoTable({
      startY: yPos,
      head: [["Metric", "Value"]],
      body: summaryData,
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: [255, 255, 255],
        fontSize: 12,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 11 },
      theme: "grid",
    });

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
                      (record) => record.shift.toLowerCase() === "shift 2"
                    )
                    .reduce((sum, record) => sum + record.count, 0)}
                </td>
                {rankBy !== "service" && (
                  <td className="border px-4 py-2 font-bold">-</td>
                )}
                <td className="border px-4 py-2 font-bold">
                  {sortedGroupedRecords.byUser
                    ?.filter(
                      (record) => record.shift.toLowerCase() === "shift 2"
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
