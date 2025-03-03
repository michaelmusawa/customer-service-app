import { getUser } from "@/app/lib/action";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import ProfileCard from "@/components/ProfileCard";
import UnauthorizedMessage from "@/components/unathorizedAccess";

type Params = { role: string };
type SearchParams = { [key: string]: string | string[] | undefined };

export default async function page({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await auth();
  const { role } = params;
  const success = searchParams.success as string | undefined;

  if (!session) {
    return redirect("/login");
  } else if (session?.user.role !== role) {
    return <UnauthorizedMessage role={role} />;
  }

  const user = await getUser(session.user.email || "");

  return (
    <div>
      <ProfileCard user={user} type={session.user.role} success={success} />
    </div>
  );
}
