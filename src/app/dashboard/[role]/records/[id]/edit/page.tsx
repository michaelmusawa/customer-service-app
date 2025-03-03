import { getEditedRecord, getRecord } from "@/app/lib/action";
import RecordForm from "@/components/forms/recordForm";
import { auth } from "../../../../../../../auth";
import { redirect } from "next/navigation";
import UnauthorizedMessage from "@/components/unathorizedAccess";

export default async function EditRecordPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const session = await auth();
  const role = params.role;

  if (!session) {
    return redirect("/login");
  } else if (session?.user.role !== role) {
    return <UnauthorizedMessage role={role} />;
  }
  const id = params.id;

  let record;
  record = await getEditedRecord(id);

  if (!record) {
    record = await getRecord(id);
  }

  return (
    <RecordForm
      shift={record?.shift || ""}
      role={session.user.role}
      userId={record?.userId || ""}
      record={record}
      counter={record?.counter}
    />
  );
}
