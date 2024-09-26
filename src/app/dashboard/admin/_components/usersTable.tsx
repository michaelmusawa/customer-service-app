'use client'

import { deleteUser } from '@/app/lib/action';
import { User } from '@/app/lib/definitions';
import DeleteButton from '@/components/DeleteButton';
import Link from 'next/link';


export default function UsersTable({users, type, loggedInUser }:{loggedInUser:string, type: string, users:User[] | undefined}) {
  
  return (
    <div>
        <div>
            <h2 className="mt-8 text-sm text-gray-500">{`Existing ${type}:`}</h2>
            { users?.length ? users?.map(user => (
            <div key={user.id} 
                className="bg-gray-100 rounded-xl p-2 px-4 flex gap-1 mb-1 items-center"
            >
                <div className="grow max-sm:hidden">{user.name} </div>
                <div className="grow text-gray-500">{user.email} </div>
                <div className="flex gap-1">
                <Link 
                    className='button'
                    href={`/dashboard/${loggedInUser}/${type}s/${user.id}/edit`}>
                        Edit
                </Link>
                <DeleteButton 
                    deleteFunction={() =>{deleteUser(user.id)}} 
                    label={'Delete'}
                    className={'button cursor-pointer bg-red-100 hover:bg-red-300'}
                />
                </div>

            </div>
            )):<p>No supervisors found</p>}
      </div>
        
    </div>
  )
}
