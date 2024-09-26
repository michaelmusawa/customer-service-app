'use client'


import { useFormStatus } from "react-dom"
import { User } from "@/app/lib/definitions";
import {
  AtSymbolIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import UserIcon from "../icons/userIcon";
import Link from "next/link";



function SubmitButton ({editedUser}: { editedUser: User | undefined }){
  const { pending } = useFormStatus(); 
  return(
    <button type="submit" disabled={pending}>
    {pending ? (
      editedUser ? "Updating..." : "Creating..."
    ) : (
        editedUser ? "Update" : "Create"
    )}
  </button>
    
  )
}

export default function UserForm({ user, type, label, loggedInUser }: { loggedInUser:string, label:string, user: User | undefined, type: string}) {

  return (
    <div className="gap-2 items-end">
      <h2 className="mt-8 text-sm text-gray-500">{label}</h2>
          <div className="grow">
          <input type="hidden" 
                  id="name"
                  name="role" 
                  defaultValue={type || ''}
                  aria-describedby="name-error"
                  
              /> 
              <div className="relative">
                <input type="text" 
                    id="name"
                    placeholder="User Name" 
                    name="name" 
                    defaultValue={user?.name || ''}
                    required 
                    aria-describedby="name-error"
                    className="p-2 pl-8"
                />  
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" /> 
              </div>
              <div className="relative">
              <input type="email" 
                  id="email"
                  placeholder="User Email" 
                  name="email" 
                  defaultValue={user?.email || ''}
                  required 
                  aria-describedby="email-error"
                 className="p-2 pl-8"
              /> 
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
              
              
              <div className="relative">
              <input type="password" 
                  id="password"
                  placeholder="Password" 
                  name="password" 
                  defaultValue={''}
                  required 
                  aria-describedby="password-error"
                  className="p-2 pl-8"
              /> 
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
              
            </div> 
                <div className="pb-2 flex gap-2">
                  <SubmitButton editedUser={user}/>
                  {user &&
                    <Link 
                    className="button"
                      href={`/dashboard/${loggedInUser}/${type}s/create`}>
                        Cancel
                    </Link>
                  }
            </div>
        </div>
  )
  
}

