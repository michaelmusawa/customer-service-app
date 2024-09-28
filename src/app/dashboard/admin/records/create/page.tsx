
import RecordForm from '@/components/forms/recordForm'
import { redirect } from 'next/navigation';
import { auth } from '../../../../../../auth';

export default async function page() {

    let shift = '';
    const currentHour = new Date().getHours(); 
    if (currentHour < 12) {
        shift = 'morning';
    } else {
        shift = 'evening';
    }
    
    const session = await auth();
   
    if (!session){
        return redirect('/login');
    }
    const userId = session?.user.id || '';


  return (
   <RecordForm record={undefined} shift={shift} userId={userId} role={session.user.role} />
  )
}
