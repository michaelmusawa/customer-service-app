import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import CreateUserPage from "../../_components/createUser";
import Link from "next/link";

type Params = { role: string };
type SearchParams = { [key: string]: string | string[] | undefined };

export default async function Page({ params, searchParams }: { params: Params, searchParams: SearchParams }) {
  const session = await auth();
  const { role } = params;
  const id = searchParams.id as string | undefined;


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
  const loggedInUser = session.user.role
  return (
    !id ? (
      <div>
        <CreateUserPage loggedInUser={loggedInUser} type="attendant"/>
    </div>
    ):(
    <div></div>
  )
    
  )
}
