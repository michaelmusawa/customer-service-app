import Link from "next/link";
import { auth } from "../../auth"
import CounterSelector from "./counterSelector";
import Image from "next/image";

export default async function UserActions() {
    const session = await auth();
    const currentHour = new Date().getHours(); 

    let shift = '';
    if (currentHour < 12) {
        shift = 'Morning';
    } else {
        shift = 'Evening';
    }

  return (
    <>
    <div className="absolute right-[335px] max-sm:right-4 top-4 max-md:top-5 rounded-full border-2 border-yellow-600 ">
    <Link href={`/dashboard/${session?.user.role}/profile`}>
      <Image
        src={session?.user.image || '/profile/avator.jpg'}
        height={60} 
        width={60} 
        alt="profile pic"
        className="m-1 rounded-full"
      />
     </Link>
    </div>
    
     <div className="flex gap-4 absolute right-12 max-sm:right-4 top-3 max-md:top-5
             items-center shadow-md shadow-black/20 text-sm 
             border-b-4 bg-green-800 border-yellow-500 rounded-lg">
      <div className="bg-gray-50 py-2 px-5 border rounded-lg max-lg:py-2 max-lg:px-2">
        <p className="text-sm max-lg:text-xs text-gray-800"><span className="text-gray-500">{`Good ${shift.toLowerCase()},`}</span><br /> {`${session?.user.name}`}</p>
      </div>
    <div className="flex bg-green-800 items-center text-gray-100 p-2 text-sm max-lg:text-xs rounded-md">
        <div>
            <CounterSelector />
            <h5>{shift} shift</h5>
        </div>
        
        
    </div>
    </div>
    
    </>
   
  )
}
