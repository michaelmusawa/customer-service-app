import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import CreateUserPage from "../../_components/createUser";
import Link from "next/link";
import { fetchOnlineUsers, fetchUsers } from "@/app/lib/action";
import UsersTable from "../../_components/usersTable";


type Params = { role: string };
type SearchParams = { [key: string]: string | string[] | undefined };

export default async function Page({ 
  params, 
  searchParams
 }: { 
  params: Params, 
  searchParams: SearchParams
 }) {
  const session = await auth();
  const { role } = params;
  const success = searchParams.success as string | undefined;

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

  let type: string = '';
  if (role === 'admin'){
     type = 'supervisor'
  } else if ( role === 'supervisor'){
    type = 'attendant'
  }

  let users;
  const sessionUsers = await fetchOnlineUsers();
  if (type === 'attendant'){
    users = await fetchUsers('attendant')
  } else if (type === 'supervisor'){
    users = await fetchUsers('supervisor')
  }
 
  return (
    <div>
        <CreateUserPage loggedInUser={role} type={type} success= {success}/>
        <UsersTable 
          type={type} 
          users={users} 
          onlineUsers = {sessionUsers}
          loggedInUser={role}
        />
    </div>
  )
}
