import { getRecord } from "@/app/lib/action";
import RecordForm from "@/components/forms/recordForm";
import { auth } from "../../../../../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function EditRecordPage({ params }: { params: { id: string, role: string } }) {
  const session = await auth();
  const role = params.role;

  if (!session){
    return redirect('/login');
  } else if (session?.user.role !== role){
    return(
      <div>
        <h1>You are not authorized to visit this page!</h1>
        <Link
        className="button" 
          href='/login'>
          Go to Login
        </Link>
      </div>
    )
  }
    const id = params.id;
    const record = await getRecord(id);
  return (
    <RecordForm shift={record?.shift || ''} role={session.user.role} userId={record?.userId || ''} record= {record}/>
  )
}
