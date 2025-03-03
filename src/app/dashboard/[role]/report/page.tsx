import { fetchRecords, fetchRequestEditRecords } from "@/app/lib/action";
import React from "react";
import ReportPage from "./_Report";
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import UnauthorizedMessage from "@/components/unathorizedAccess";

export default async function page() {
  const session = await auth();
  const role = "supersupervisor";

  if (!session) {
    return redirect("/login");
  } else if (session?.user.role !== role) {
    return <UnauthorizedMessage role={role} />;
  }

  const records = await fetchRecords();
  const editedRecords = await fetchRequestEditRecords();
  return (
    <div>
      <ReportPage fetchedRecords={records} editedRecords={editedRecords} />
    </div>
  );
}
