import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import CreateUserPage from "../../_components/createUser";
import Link from "next/link";
import Users from "../../_components/users";


type Params = { role: string };
type SearchParams = { [key: string]: string | string[] | undefined };

export default async function Page({ params, searchParams }: { params: Params, searchParams: SearchParams }) {
  const session = await auth();
  const { role } = params;
  const archive = searchParams.archive as string | undefined;
  const success = searchParams.success as string | undefined;


  console.log (searchParams.success);
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
  const type = 'supervisor'
  return (
    <div>
        <CreateUserPage loggedInUser={session.user.role} type={type} success= {success}/>
        <Users type={'supervisor'} archive={archive} loggedInUser={session.user.role}/>
    </div>
  )
}
