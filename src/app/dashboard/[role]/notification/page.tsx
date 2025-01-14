import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import NotificationPage from "../_components/NotificationPage";
import Link from "next/link";
import {
  fetchRecords,
  fetchRequestEditRecords,
  fetchRequestEditRecordsByUser,
  fetchUsers,
} from "@/app/lib/action";

export default async function Page({ params }: { params: { role: string } }) {
  const session = await auth();
  const role = params.role;

  if (!session) {
    return redirect("/login");
  } else if (session?.user.role !== role) {
    return (
      <div>
        <h1>You are not authorized to visit this page!</h1>
        <Link className="button" href="/login">
          Go to Login
        </Link>
      </div>
    );
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
