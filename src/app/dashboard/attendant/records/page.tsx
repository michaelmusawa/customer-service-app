

import { fetchRecords, fetchRecordsByAttendant } from '@/app/lib/action';
import RecordsTable from '@/components/recordTable';
import { redirect } from 'next/navigation';
import { auth } from '../../../../../auth';

export default async function RecordsPage() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }
  const userId = session?.user.id;
 
let records;

if (session?.user.role === 'supervisor') {
  records = await fetchRecords();
} else {
  records = await fetchRecordsByAttendant(userId || '');
}
  return(
    <RecordsTable records={records} role={session?.user.role} />
  )
}