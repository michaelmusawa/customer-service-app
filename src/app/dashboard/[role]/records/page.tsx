import RecordsTable from "@/components/recordTable";

import { auth } from "../../../../../auth";
import {
  fetchRecords,
  fetchRecordsByAttendant,
  fetchRequestEditRecords,
  fetchRequestEditRecordsByUser,
  getUserById,
} from "@/app/lib/action";
import { redirect } from "next/navigation";
import UnauthorizedMessage from "@/components/unathorizedAccess";

type Params = { role: string };
type SearchParams = { [key: string]: string | string[] | undefined };

export default async function RecordsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await auth();
  const { role } = params;
  const edit = searchParams.edit as string | undefined;

  if (!session) {
    return redirect("/login");
  } else if (session?.user.role !== role) {
    return <UnauthorizedMessage role={role} />;
  }
  const userId = session?.user.id;

  let records;
  let editedRecords;

  if (
    session?.user.role === "supervisor" ||
    session?.user.role === "supersupervisor"
  ) {
    records = await fetchRecords();
    editedRecords = await fetchRequestEditRecords();
  } else {
    records = await fetchRecordsByAttendant(userId || "");
    editedRecords = await fetchRequestEditRecordsByUser(userId || "");
  }

  const getUser = await getUserById(session.user.id);
  const station = getUser?.station;

  return (
    <RecordsTable
      records={records}
      editedRecords={editedRecords}
      role={session?.user.role}
      edit={edit}
      station={station}
    />
  );
}
