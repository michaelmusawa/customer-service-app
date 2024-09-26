import { fetchUsers } from '@/app/lib/action'
import React from 'react'
import UsersTable from './usersTable'

export default async function Users({type, loggedInUser}:{loggedInUser:string, type:string}) {

  let users;
  if (type === 'attendant'){
    users = await fetchUsers('attendant')
  } else if (type === 'supervisor'){
    users = await fetchUsers('supervisor')
  }

  return (
    <UsersTable type={type} users={users} loggedInUser={loggedInUser} />
    
  )
}
