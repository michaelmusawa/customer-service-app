import { User } from "@/app/lib/definitions"
import Image from "next/image"
import Link from "next/link"

export default function ProfileCard({user, type}:{user: User | undefined , type: string}) {
  return (
    <div><div className="max-w-sm mx-auto mt-10">
    <div className="bg-gray-50 shadow-md rounded-lg p-6">
      <div className="flex flex-col items-center">
        <Image
          src={user?.image || "/images/avator.jpg"} 
          width={100}
          height={100}
          alt=""
          className="w-36 h-36 rounded-full mb-8 bg-gray-50"
        />
        <h1 className="text-2xl font-semibold mb-8">{user?.name}</h1>
        <h1 className="text-gray-500 mb-8">{user?.email}</h1>
        <Link href={`/dashboard/${type}/profile/${user!.id}/edit`}
            className="button bg-green-800">
                <span className="text-gray-100">Update</span>
        </Link>
      </div>
    </div>
  </div></div>
  )
}
