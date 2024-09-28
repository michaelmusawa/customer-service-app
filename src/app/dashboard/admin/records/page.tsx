
import RecordsTable from '@/components/recordTable';

import { auth } from '../../../../../auth';
import { fetchRecords, fetchRecordsByAttendant } from '@/app/lib/action';
import { redirect } from 'next/navigation';


export default async function RecordsPage() {

  const session = await auth();
  if (!session){
    return redirect('/login');
  }
  const userId = session?.user.id;
 
let records;

if (session?.user.role === 'admin') {
  records = await fetchRecords();
} else {
  records = await fetchRecordsByAttendant(userId || '');
}
  return(
    <RecordsTable records={records} role={session?.user.role} />
  )
}