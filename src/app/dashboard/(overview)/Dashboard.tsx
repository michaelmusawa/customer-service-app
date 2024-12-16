"use client";

import { lusitana } from "@/app/fonts/fonts";
import { Card } from "@/components/card";
import LatestInvoices from "@/components/latest-invoices";
import RevenueChart from "@/components/revenue-chart";
import React, { useEffect, useState } from "react";
import { GroupedByMonth } from "./page";
import { GroupedByDay, GroupedByWeek } from "@/app/lib/utils";

export default function Dashboard({
  user,
  monthlyRecords,
  dailyRecords,
  weeklyRecords,
}: {
  user: string;
  monthlyRecords: GroupedByMonth[];
  numberOfServices: number;
  dailyRecords: GroupedByDay[];
  weeklyRecords: GroupedByWeek[];
}) {
  const [analysisType, setAnalysisType] = useState<string>("monthly");

  const [useRecords, setUseRecords] = useState(() => {
    if (analysisType === "monthly") return monthlyRecords;
    if (analysisType === "weekly") return weeklyRecords;
    if (analysisType === "daily") return dailyRecords;
    return [];
  });

  useEffect(() => {
    if (analysisType === "monthly") {
      setUseRecords(monthlyRecords || []);
    } else if (analysisType === "weekly") {
      setUseRecords(weeklyRecords || []);
    } else if (analysisType === "daily") {
      setUseRecords(dailyRecords || []);
    }
  }, [analysisType, dailyRecords, monthlyRecords, weeklyRecords]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAnalysisType(event.target.value);
  };
  function Capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  return (
    <main>
      <div
        className={`${lusitana.className} mb-4 text-white bg-gradient-to-r from-green-800 to-yellow-600 p-3 rounded-lg shadow-md`}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {Capitalize(`${user} Dashboard`)}
          </h1>
          <div className="flex items-center text-sm font-semibold uppercase">
            <label htmlFor="analysisType" className="flex-1 mr-2">
              Analysis Type:
            </label>
            <select
              id="analysisType"
              value={analysisType}
              onChange={handleChange}
              className="flex-1 border px-2 py-1 rounded text-gray-700"
            >
              <option value="monthly">Monthly Analysis</option>
              <option value="weekly">Weekly Analysis</option>
              <option value="daily">Daily Analysis</option>
            </select>
          </div>
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Clients Served" value={useRecords} type="records" />
        <Card title="Number of Invoices" value={useRecords} type="records" />
        <Card title="Types of Services" value={useRecords} type="services" />
        <Card
          title="Total Amount (Invoices)"
          value={useRecords}
          type="invoice"
        />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <RevenueChart revenue={useRecords} type={analysisType} />
        <LatestInvoices records={useRecords} />
      </div>
    </main>
  );
}
