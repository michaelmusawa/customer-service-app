import { fetchRecords, fetchRequestEditRecords } from "@/app/lib/action";
import React from "react";
import ReportPage from "./_Report";

export default async function page() {
  const records = await fetchRecords();
  const editedRecords = await fetchRequestEditRecords();
  return (
    <div>
      <ReportPage fetchedRecords={records} editedRecords={editedRecords} />
    </div>
  );
}
