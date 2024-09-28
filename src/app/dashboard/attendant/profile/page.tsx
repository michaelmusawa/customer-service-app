

import { getUser } from '@/app/lib/action'
import { auth } from '../../../../../auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcrypt';
import ProfileCard from '@/components/ProfileCard';

export default async function page() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }
  const attendant = await getUser(session.user.email || '')

  let passwordsMatch;
  if (attendant) {
    passwordsMatch = await bcrypt.compare(attendant.email, attendant.password);
  }
  
  return (
    <div>
      {passwordsMatch && (
        <p className='text-center text-red-500'>Change your password to continue</p>
      )}
      <ProfileCard  user = {attendant} type={'attendant'} />
    </div>
    
  )
}