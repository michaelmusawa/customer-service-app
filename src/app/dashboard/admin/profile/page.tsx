

import { getUser } from '@/app/lib/action'
import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import ProfileCard from '@/components/ProfileCard';

export default async function page() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }
  const admin = await getUser(session.user.email || '')
  
  return (
    <div>
      <ProfileCard user = {admin} type={'admin'} />
    </div>
    
  )
}