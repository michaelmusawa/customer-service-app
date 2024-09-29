

import { fetchRecordsByAttendant } from '@/app/lib/action';
import RecordsTable from '@/components/recordTable';
import { redirect } from 'next/navigation';
import { auth } from '../../../../../auth';
import Link from 'next/link';

export default async function RecordsPage() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  } else if (session?.user.role !== 'attendant'){
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
 
  const records = await fetchRecordsByAttendant(userId || '');

  return(
    <RecordsTable records={records} role={session?.user.role} />
  )
}