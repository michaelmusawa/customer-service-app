import Link from "next/link";
import { auth } from "../../auth";
//import CounterSelector from "./counterSelector";
import Image from "next/image";
import NotificationIcon from "./icons/Notification";
import Counter from "./Counter";
import { fetchOnlineUsers, getUserById } from "@/app/lib/action";

export default async function UserActions() {
  const session = await auth();

  let user;
  if (session) {
    user = await getUserById(session?.user.id);
  }

  const onlineUsers = await fetchOnlineUsers();
  const numberOfOnlineUsers = onlineUsers?.length;

  return (
    <div>
      {session ? (
        <div className="flex items-center mr-10">
          {session.user.role === "attendant" ? (
            <div className="border rounded-lg mr-6 text-sm flex px-2">
              <div className="font-semibold">
                <p>Shift: </p>
                <p>Counter: </p>
              </div>
              <div className="min-w-6 items-center text-center">
                <p>{user?.shift}</p>
                <p>{user?.counter}</p>
              </div>
            </div>
          ) : (
            user?.role !== "admin" && (
              <Counter numberOfOnlineUsers={numberOfOnlineUsers} />
            )
          )}

          {session.user.role !== "admin" && (
            <Link href={`/dashboard/${session.user.role}/notification`}>
              <div className="flex justify-center w-10 mr-6">
                <NotificationIcon />
              </div>
            </Link>
          )}

          <Link href={`/dashboard/${session?.user.role}/profile`}>
            <Image
              src={session?.user.image || "/profile/avator.jpg"}
              height={40}
              width={40}
              alt="profile pic"
              className="m-1 rounded-full w-[40px] h-[40px] max-sm:w-[40px] max-sm:h-[40px]"
            />
          </Link>
          <p className="text-sm max-lg:text-xs text-gray-800">
            <span className="text-gray-500">Hello</span>{" "}
            {`${session?.user.name}`}
          </p>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}
