
import RecordsTable from '@/components/recordTable';

import { auth } from '../../../../../auth';
import { fetchRecords, fetchRecordsByAttendant } from '@/app/lib/action';
import { redirect } from 'next/navigation';
import Link from 'next/link';


export default async function RecordsPage() {

  const session = await auth();
  if (!session){
    return redirect('/login');
  } else if (session?.user.role !== 'supervisor'){
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