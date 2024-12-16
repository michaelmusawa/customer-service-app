import { fetchRecords } from "@/app/lib/action";
import React from "react";
import ReportPage from "./_Report";

export default async function page() {
  const records = await fetchRecords();
  return (
    <div>
      <ReportPage records={records} />
    </div>
  );
}
