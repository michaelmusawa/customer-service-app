
import RecordForm from '@/components/forms/recordForm'
import { redirect } from 'next/navigation';
import { auth } from '../../../../../../auth';
import Link from 'next/link';
import { getUserById } from '@/app/lib/action';

export default async function page({ params }: { params: { role: string } }) {

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

    
    const userId = session?.user.id || '';
    const biller = await getUserById(userId);
    const shift = biller?.shift
    const counter = biller?.counter
    


  return (
   <RecordForm record={undefined} shift={shift} userId={userId} role={session.user.role} counter={counter} />
  )
}
