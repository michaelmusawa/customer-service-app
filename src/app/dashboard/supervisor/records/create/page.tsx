
import RecordForm from '@/components/forms/recordForm'
import { redirect } from 'next/navigation';
import { auth } from '../../../../../../auth';
import Link from 'next/link';

export default async function page() {

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

    let shift = '';
    const currentHour = new Date().getHours(); 
    if (currentHour < 12) {
        shift = 'morning';
    } else {
        shift = 'evening';
    }
    

    const userId = session?.user.id || '';


  return (
   <RecordForm record={undefined} shift={shift} role={session.user.role} userId={userId}/>
  )
}
