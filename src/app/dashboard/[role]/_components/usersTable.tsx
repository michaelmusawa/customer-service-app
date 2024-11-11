'use client'


import { FormatDate } from '@/app/lib/data';
import { OnlineUser, User } from '@/app/lib/definitions';
import ArchiveModel from '@/components/ArchiveModel';
import EllipsisIcon from '@/components/icons/ellipsisIcon';
import ShiftAndCounterModel from '@/components/ShiftAndCounterModel';
import clsx from 'clsx';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';


export default function UsersTable({
  users,
  onlineUsers,
  type, 
  loggedInUser,
  
  }:{
    loggedInUser:string, 
    type: string, 
    onlineUsers: OnlineUser[] | undefined, 
    users:User[] | undefined,
   
  }) {

    interface ShiftAndCounter {
      userId:string,
      shift: string,
      counter: number,
      startDate: Date,
      endDate: Date
    }
  
    const [ view, setView ] = useState<string>('active');
    const [shiftAndCounter, setShiftAndCounter] = useState<ShiftAndCounter>({
      userId:'',
      shift: '',
      counter: 0,
      startDate: new Date(),
      endDate: new Date(),
    });
    const [ showArchiveModel, setShowArchiveModel] = useState<boolean>(false);
    const [ showShiftAndCounterModel, setShowShiftAndCounterModel] = useState<boolean>(false);
    const [ editShiftAndCounter, setEditShiftAndCounter ] = useState<boolean>(false);
    const [ editShiftAndCounterId, setEditShiftAndCounterId ] = useState<string>('');

    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    let viewUsers: User[] | undefined = [];
    useEffect(() => {
      if (id) {
        setView('shift & counter');
        setEditShiftAndCounter(true);
        setEditShiftAndCounterId(id);
      }
    }, [id]); 
 
    if (view === 'active' || view === 'shift & counter') {
      viewUsers = users?.filter((user) => user.status === null);
    } else if (view === 'archive') {
      viewUsers = users?.filter((user) => user.status === 'archive');
    } else if (view === 'online') {
      viewUsers = users?.filter((user) => 
        onlineUsers?.some((onlineUser) => onlineUser.userId === user.id)
      );
    } else if (view === 'offline') {
      viewUsers = users?.filter((user) => 
        !onlineUsers?.some((onlineUser) => onlineUser.userId === user.id)
      );
    } 

    function ActionMenu({ userId }:{ userId:string }) {
      
      return (
        <div className="relative group">
          <EllipsisIcon />
          <div className="hidden absolute px-2 -top-4 left-6 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 group-hover:block">
            <div className="py-1">
              <Link 
                className="block px-1 py-1 text-sm text-gray-700 hover:bg-gray-100"
                href={`/dashboard/${loggedInUser}/${type}s/${userId}/edit`} >
                Edit
              </Link>

              {showArchiveModel ? (
                <ArchiveModel 
                  userId={userId} 
                  role='attendant' 
                  status='archive' 
                  setShowArchiveModel={setShowArchiveModel}
                />
              ):(
                <div>
                  <button
                    className="block border-0 px-1 py-1 text-sm text-gray-700 hover:bg-gray-100" 
                    onClick={() => setShowArchiveModel(true)}>Archive
                  </button>
                </div>
              )}               
            </div>
          </div>
        </div>
      );
    }
  
  return (
    <div>
        <div>
          <div className='flex grow items-center border bg-gray-100 rounded-lg mt-8'>
            <ul className='flex w-full justify-evenly'>
            <li>
                <button 
                  onClick={() => {setView('active')}}
                  className={clsx(
                    '!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100',
                    {
                      'bg-green-100 text-green-800': view === 'active'
                    }
                    )}>Active</button>
              </li>
              <li>
                <button 
                  onClick={() => setView('archive')}
                  className={clsx(
                    '!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100',
                    {
                      'bg-green-100 text-green-800': view === 'archive'
                    }
                    )}>Archive</button>
              </li>
              <li>
                <button 
                  onClick={() => setView('online')}
                  className={clsx(
                    '!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100',
                    {
                      'bg-green-100 text-green-800': view === 'online'
                    }
                    )}>Online</button>
              </li>
              
              <li>
                <button 
                  onClick={() => setView('offline')}
                  className={clsx(
                    '!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100',
                    {
                      'bg-green-100 text-green-800': view === 'offline'
                    }
                    )}>Offline</button>
              </li>
              {loggedInUser === 'supervisor' && (
                <li>
                   <button 
                     onClick={() => setView('shift & counter')}
                     className={clsx(
                       '!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100',
                       {
                         'bg-green-100 text-green-800': view === 'shift & counter'
                       }
                       )}>Shift & counter
                    </button>
                </li>
              )}
            
            </ul>
          </div>
            <h2 className="mt-8 text-sm text-gray-500">{`Existing ${type}:`}</h2>
            <div className='overflow-x-auto'>
            <table className="min-w-full bg-white border border-gray-300  mx-auto">
            <thead className='bg-green-100 text-green-800 max-lg:text-sm max-sm:text-xs'>
              <tr>
                <th className="border px-4 py-2">No.</th>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Email</th>
                {(view === 'active' || view === 'archive') && (
                  <th className="border px-4 py-2">Account status</th>
                )}
                {(view === 'online' || view === 'offline') && (
                  <th className="border px-4 py-2">Online status</th>
                )}               
                
                {view === 'shift & counter' && (
                  <>
                    <th className="border px-4 py-2">Shift</th>
                    <th className="border px-4 py-2">Counter</th>
                    <th className="border px-4 py-2">Start date</th>
                    <th className="border px-4 py-2">End date</th>
                  </>
                )}
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
            { viewUsers?.length ?
                viewUsers
                  .map((user, index) => (
                <tr 
                  key={index}
                  className='max-lg:text-sm max-sm:text-xs hover:bg-gray-50'>
                    <td className="border px-4 py-2">{index + 1}</td>
                    <td className="border px-4 py-2">{user.name}</td>
                    <td className="border px-4 py-2">{user.email}</td>
                    {view === 'archive' && (
                      <td className="border px-4 py-2">archived</td>
                    )}
                    {view === 'active' && (
                      <td className="border px-4 py-2">active</td>
                    )}
                    {(view === 'online' || view === 'offline') && (
                      <td className="border px-4 py-2">online</td>
                    )}
                                        
                    {(loggedInUser === 'supervisor' && view === 'shift & counter') && (
                      <>
                        <td className="border px-4 py-2">
                          {(editShiftAndCounter && editShiftAndCounterId === user.id) ? (
                            <select 
                              className='border-0 !m-auto bg-transparent text-gray-700'
                              name="shift" 
                              id="shift"
                              onChange={(e) =>
                                setShiftAndCounter((prev) => ({
                                  ...prev,
                                  shift: e.target.value,
                                }))}
                              >
                                <option value="morning" >Morning</option>
                                <option value="evening" >Evening</option>
                          </select>

                          ):(
                            <span>{user.shift}</span> 
                          ) }
                          
                        </td>
                        <td className="border px-4 py-2">
                        {(editShiftAndCounter && editShiftAndCounterId === user.id) ? (
                          <select 
                            className='border-0 bg-transparent p-0 !max-w-10 m-auto text-gray-700'
                            name="counter" 
                            onChange={(e) =>
                              setShiftAndCounter((prev) => ({
                                ...prev,
                                counter: +e.target.value,
                              }))}
                            id="counter">
                            {Array.from({ length:20 }, (_,i) => i+1).map((counter) => (
                              <option 
                                key={counter} 
                                value={counter}
                                className='!max-w-[0.3px]' >
                                {counter}
                              </option>
                        ))}
                        </select>
                        ):(
                          <span>{user.counter}</span>
                        )}
                        
                      </td>

                      {/* This the the place were are */}
                      {(editShiftAndCounter && editShiftAndCounterId === user.id) ? (
                        <>
                        <td>
                          <input 
                            type="date" 
                            onChange={(e) =>
                              setShiftAndCounter((prev) => ({
                                ...prev,
                                startDate: new Date(e.target.value),
                              }))
                            }
                            
                          />
                        </td>
                         <td>
                         <input type="date" 
                            onChange={(e) =>
                              setShiftAndCounter((prev) => ({
                                ...prev,
                                startDate: new Date(e.target.value),
                              }))
                            }
                           />
                       </td>
                       </>
                      ):(
                        <>
                          <td className="border px-4 py-2"><FormatDate date={user.shiftStartDate} /></td>
                          <td className="border px-4 py-2"><FormatDate date={user.shiftEndDate} /></td>
                        </>
                      )}
                      
                      </>
                    )}
                    <td className="border px-4 py-2">
                      {view === 'shift & counter' ? (
                        (editShiftAndCounter && editShiftAndCounterId === user.id) ? (
                          showShiftAndCounterModel ? (
                            <ShiftAndCounterModel
                              userId={user.id} 
                              counter = {shiftAndCounter.counter} 
                              shift = {shiftAndCounter.shift}
                              startDate={shiftAndCounter.startDate}
                              role={'attendant'}
                              endDate={shiftAndCounter.endDate}
                              setShowShiftAndCounterModel={setShowShiftAndCounterModel}
                            />
                          ):(
                            <button 
                            onClick={() => {
                                      setShowShiftAndCounterModel(true)
                  
                                    }
                                    }
                            className='!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100'
                          >
                            Apply
                          </button>
                          )
                          
                        ) : (
                          <button 
                            onClick={() => {
                              setEditShiftAndCounter(true)
                              setEditShiftAndCounterId(user.id);
                            }}
                            className='!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100'
                          >
                            Edit
                          </button>
                        )
                      ) : (
                        view === 'archive' ? (
                          showArchiveModel ? (
                            <ArchiveModel 
                              userId={user.id} 
                              role='attendant' 
                              status='activate' 
                              setShowArchiveModel={setShowArchiveModel}
                            />
                          ):(
                            <button
                              onClick={() => setShowArchiveModel(true)}
                              className='!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100'>
                              Activate
                          </button>
                          )
                          ):(
                            <ActionMenu userId={user.id}/>
                          )
                        
                      )}
                    </td>


                  </tr>
              )):<p>{`No ${type} found`}</p>}
              
            </tbody>
            </table>
            </div>
      </div>
        
    </div>
  )
}
