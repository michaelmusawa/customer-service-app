

import { getUser } from '@/app/lib/action'
import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/forms/profile';

export default async function page() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }
  const attendant = await getUser(session.user.email || '')
  
  return (
    <div>
      <ProfileForm user = {attendant} type={'attendant'} />
    </div>
    
  )
}