import { getRecord } from "@/app/lib/action";
import RecordForm from "@/components/forms/recordForm";
import { auth } from "../../../../../../../auth";
import { redirect } from "next/navigation";

export default async function EditRecordPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }
    const id = params.id;
    const record = await getRecord(id);
  return (
    <RecordForm shift={record?.shift || ''} userId={record?.userId || ''} record= {record}/>
  )
}
