import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import NotificationPage from "../_components/NotificationPage";

import {
  fetchRecords,
  fetchRequestEditRecords,
  fetchRequestEditRecordsByUser,
  fetchUsers,
} from "@/app/lib/action";
import UnauthorizedMessage from "@/components/unathorizedAccess";

export default async function Page({ params }: { params: { role: string } }) {
  const session = await auth();
  const role = params.role;

  if (!session) {
    return redirect("/login");
  } else if (session?.user.role !== role) {
    return <UnauthorizedMessage role={role} />;
  }

  let editRequests;

  if (role === "attendant") {
    editRequests = await fetchRequestEditRecordsByUser(session.user.id);
  } else if (role === "supervisor") {
    const records = await fetchRequestEditRecords();

    editRequests = records.filter((record) => record.status === "pending");
  }

  const records = await fetchRecords();
  const attendants = await fetchUsers("attendant");

  return (
    <NotificationPage
      editRequests={editRequests}
      records={records}
      sessionUserId={session.user.id}
      attendants={attendants}
      role={role}
    />
  );
}
