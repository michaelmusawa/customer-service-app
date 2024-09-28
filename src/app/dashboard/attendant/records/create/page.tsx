
import RecordForm from '@/components/forms/recordForm'
import { redirect } from 'next/navigation';
import { auth } from '../../../../../../auth';

export default async function page() {
  const session = await auth();
  const userId = session?.user.id || '';
  if (!session){
    return redirect('/login');
  }
  
    let shift = '';
    const currentHour = new Date().getHours(); 
    
    if (currentHour < 12) {
        shift = 'morning';
    } else {
        shift = 'evening';
    }

  return (
    <RecordForm record={undefined} shift={shift} role={session.user.role} userId={userId}/>
  )
}
