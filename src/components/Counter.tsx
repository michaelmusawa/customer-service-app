import Ping from "./Ping";


export default function Counter({numberOfOnlineUsers}: {numberOfOnlineUsers: number | undefined}) {
  return (
    <div className="relative mr-6">
        <div className="absolute -top-2 -right-2">
            <Ping />
        </div>
        <p className="border border-gray-300 rounded-xl p-1">
          {numberOfOnlineUsers ? (
             <span className="text-gray-800 font-semibold">
             {numberOfOnlineUsers} online
           </span>
          ):(
            <span className="text-gray-800 font-semibold">
            0 online
          </span>
          )}
           
        </p>
    </div>
  )
}
