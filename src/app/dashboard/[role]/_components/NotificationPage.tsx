'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { EditedRecord, Record, RecordState, User, UserState } from '@/app/lib/definitions';
import { FormatDate, getCurrentTimeFormatted } from '@/app/lib/data';
import { editRequestEditRecord, shiftWarningAction } from '@/app/lib/action';
import { useFormState } from 'react-dom';
import Link from 'next/link';


type NotificationProps = {
  records: Record[] | undefined;
  editRequests: EditedRecord[] | undefined;
  sessionUserId: string;
  attendants: User[] | undefined;
  role: string;
};

const NotificationPage: React.FC<NotificationProps> = ({ 
  editRequests, 
  records, 
  attendants, 
  sessionUserId, 
  role,
}) => {
  const [notifications, setNotifications] = useState({
    editRequests,
    attendants
  });

  let id = '';

  function getCurrentShift (){
    const currentHour = new Date().getHours(); 
    let shift = '';
    if (currentHour < 12) {
         shift = 'morning';
    } else {
         shift = 'evening';
    }
    return shift
  }


  const expiredShiftAttendants = notifications.attendants?.filter((attendant) => attendant.shiftEndDate < new Date());
  const wrongShiftAttendants = notifications.attendants?.filter((attendant) => attendant.shift !== getCurrentShift());
  const attendantWrongShift = wrongShiftAttendants?.find(attendant => attendant.id === sessionUserId);
  const attendantExpiredShift = expiredShiftAttendants?.find(attendant => attendant.id === sessionUserId);


  const [recordToEdit, setRecordToEdit] = useState<EditedRecord | null>(null);
  const [supervisorComment, setSupervisorComment] = useState<string>('');
  const [rejectRecordToEdit, setRejectRecordToEdit] = useState<boolean>(false);
  const [viewShiftDuration, setViewShiftDuration] = useState<User | null>(null);
  const [viewWrongShift, setViewWrongShift] = useState<User | null>(null);
  const [dismissWarning, setDismissWarning] = useState<boolean>(false);
  const [denyRights, setDenyRights] = useState<boolean>(false);

  if (viewShiftDuration){
    id = viewShiftDuration.id;
  }

  const [viewEditRequest, setViewEditRequest] = useState({
    recordId:'',
    userImage:'/images/',
    userName:'',
    userEmail:'',
    createAt:'',
    status:'',
    reason: '',
    supervisorComment: '',
    fields:[{
      id:'',
      fieldName:'',
      value:'',
      editedValue:'',
    }]
  });

  const initialState: RecordState = { response: null, message: null, errors: {} };
  const editRequestEditRecordById = editRequestEditRecord.bind(null, recordToEdit?.id || '');
  const [editState, formAction] = useFormState(editRequestEditRecordById, initialState);

  const shiftInitialState: UserState = { response: null, message: null, state_error: null, errors: {} };
  const [state, shiftFormAction] = useFormState(shiftWarningAction, shiftInitialState);

  const handleViewEditedRecord = (editRecord:EditedRecord) => {
    setViewEditRequest(prevState => ({
      ...prevState,
      recordId: editRecord.recordId,
      userName: editRecord.userName,
      userImage: editRecord.userImage, 
      userEmail: editRecord.userEmail,
      status: editRecord.status,
      supervisorComment: editRecord.supervisorComment,
      reason: editRecord.attendantComment,
      createAt: editRecord.editedRecordCreatedAt.toString(),
    }));
  };
  

  useEffect(() => {
  
    if (recordToEdit){
         
      const matchingRecord = records?.find(record => record.recordId === recordToEdit.recordId);
  
      if (matchingRecord) {
        const fieldsToUpdate: any = [];
  
        // Check if the 'Record type' field is different
        if (matchingRecord.recordType !== recordToEdit.recordType) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: 'Record type',
            value: matchingRecord.recordType,
            editedValue: recordToEdit.recordType,
          });
        }
  
        // Check if the 'customer name' field is different
        if (matchingRecord.name !== recordToEdit.name) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: 'Customer name',
            value: matchingRecord.name,
            editedValue: recordToEdit.name,
          });
        }

         // Check if the 'service category' field is different
         if (matchingRecord.service !== recordToEdit.service) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: 'Service category',
            value: matchingRecord.service,
            editedValue: recordToEdit.service,
          });
        }

        // Check if the 'service category' field is different
        if (matchingRecord.subService !== recordToEdit.subService) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: 'service',
            value: matchingRecord.subService,
            editedValue: recordToEdit.subService,
          });
        }

        

        // Check if the 'Record number' field is different
        if (matchingRecord.recordNumber !== recordToEdit.recordNumber) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: 'Record number',
            value: matchingRecord.recordNumber,
            editedValue: recordToEdit.recordNumber,
          });
        }

        // Check if the 'Amount' field is different
        if (matchingRecord.value !== recordToEdit.value) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: 'Amount',
            value: matchingRecord.value,
            editedValue: recordToEdit.value,
          });
        }
  
        if (fieldsToUpdate.length > 0) {
          setViewEditRequest(prevState => ({
            ...prevState,
            fields: [...fieldsToUpdate],
          }));
        }
    }
  }

  }, [recordToEdit, records]); 
  

  return (
    <div className="notification-page p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>

      {/* Edit Request Notifications */}
      <section className="edit-request-notifications mb-8">
        { role === 'attendant' ? (
           <h3 className="text-xl font-semibold mb-4">Your Edit Requests</h3>
        ): (
           <h3 className="text-xl font-semibold mb-4">Edit Request Notifications</h3>
        )}
       
        <div className='notification-card bg-white shadow-md p-4 rounded-lg mb-4'>
          {viewEditRequest.recordId !== '' && (
            <div className='flex'>
            <div>

            <div className='flex'>
              <Image 
                width={30} 
                height={30} 
                src={viewEditRequest.userImage ?? "/images/"}
                alt='user image' 
                className='h-16 w-16 border rounded-full mr-4'
              />
              <div>
                <p> {viewEditRequest.userName}</p>
                <p> {viewEditRequest.userEmail}</p>
                <p className='text-xs text-gray-500'>{viewEditRequest.createAt}</p>
              </div>
            </div>
            
            <h4 className="font-medium mt-3">Fields to be Changed:</h4>
            <ul className="list-disc list-inside ml-4 text-gray-700">
              {viewEditRequest.fields.map((field, index) => (
                <li key={index}>
                  <strong>{field.fieldName}:</strong> {field.value} → {field.editedValue}
                </li>
              ))}
            </ul> 
            <div className='flex mt-4'>
              { role === 'attendant' ? (
                <>
                  <p>Status</p>
                  <div className="bg-gray-100 !hover:bg-gray-300 !text-gray-800 font-semibold py-1 px-3 rounded">
                    {viewEditRequest.status}
                    </div>
                </>
                
              ): (
                rejectRecordToEdit ? (
                  <>
                   <form action={formAction}>
                  <input type="hidden" name="supervisorId" value={sessionUserId} />
                  <input type="hidden" name="status" value="rejected" />
                  <input type="hidden" name="supervisorComment" value={supervisorComment} />
                  
                  <button 
                    type='submit'
                    className="!bg-red-500 !hover:bg-red-600 !text-white font-semibold py-1 px-3 rounded"
                >
                    Reject
                </button>
                </form>
                <button 
                onClick={() => setRejectRecordToEdit(false)}
                className="bg-gray-100 !hover:bg-gray-300 !text-gray-800 font-semibold py-1 px-3 rounded"
            >
                Cancel
            </button>
                  </>
                 

                ):(
                  <>
                   <form action={formAction}>
                   <input type="hidden" name="supervisorId" value={sessionUserId} />
                   <input type="hidden" name="status" value="accepted" />
                   <input type="hidden" name="supervisorComment" value="accepted" />
                   <button 
                     type='submit'
                     className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded"
                 >
                     Accept
                 </button>
                 </form>
                 <button 
                     onClick={() => setRejectRecordToEdit(true)}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded"
                      >
                    Reject
                  </button>
                  </>
                    
                )
              )}
             
              
            </div>
            
            </div>
            <div className='grow min-w-8 min-h-6 border ml-8 bg-gray-100 rounded-lg shadow-lg'>
              {rejectRecordToEdit ? (
                <>
                 <p className='ml-1 p-1 text-xs text-gray-500'>Reason for rejection:</p> 
                  <textarea 
                  name="supervisorComment" 
                  cols={3} 
                  rows={3} 
                  placeholder='Write a brief reason why ...'
                  onChange={(e) => setSupervisorComment(e.target.value)}
                  className='h-3/4 w-full bg-gray-50 rounded-lg text-sm p-2'
                  required
                />
                </>

              ):(
                <>
                <div>
                  <p className='ml-1 p-1 text-xs text-gray-500'>Reason:</p> 
                  <p className='h-3/4 w-full bg-gray-50 rounded-lg text-sm p-2'>{viewEditRequest.reason}</p>
                </div>
                {viewEditRequest.status === 'rejected' && (
                  <div>
                  <p className='ml-1 p-1 text-xs text-gray-500'>Supervisor reason for rejection:</p> 
                  <p className='h-3/4 w-full bg-gray-50 rounded-lg text-sm p-2'>{viewEditRequest.supervisorComment}</p>
                </div>
                )}
                
                </>
                
              )}
             
               
            
              {/* <p className='h-3/4 w-full bg-gray-50 rounded-lg text-sm p-2'>{viewEditRequest.reason}</p> */}
              </div>
              </div>              
          )}
          
              <div className='overflow-x-auto mt-4'>
                <p className='mb-2 text-gray-600'>Edited record:</p>
              <table className="min-w-full bg-white border border-gray-300  mx-auto">
                <thead className='bg-green-100 text-green-800 max-lg:text-sm max-sm:text-xs'>
                    <tr>
                        <th className="border px-4 py-2">No.</th>
                        <th className="border px-4 py-2">Ticket</th>
                        <th className="border px-4 py-2">Customer Name</th>
                        <th className="border px-4 py-2">Service Category</th>
                        <th className="border px-4 py-2">Service</th>
                        <th className="border px-4 py-2">Record Number</th>
                        <th className="border px-4 py-2">Amount</th>
                        {role === 'attendant' && (
                          <>
                            <th className="border px-4 py-2">Status</th>
                            <th className="border px-4 py-2">Action by</th>
                          </>
                          
                        )}
                     
                        <th className="border px-4 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                {(!notifications.editRequests || notifications.editRequests.length === 0 ) ? (
          <p className="text-gray-500">No edit requests available.</p>
        ) : (
          notifications.editRequests.map((editRequest,index) => (
            
              
                    <tr key={editRequest.id} className='max-lg:text-sm max-sm:text-xs hover:bg-gray-50'>
                    
                        <td className="border px-4 py-2">{index + 1}</td>
                        <td className="border px-4 py-2">{editRequest.ticket}</td>
                        <td className="border px-4 py-2">{editRequest.name}</td>
                        <td className="border px-4 py-2">{editRequest.subService}</td>
                        <td className="border px-4 py-2">{editRequest.service}</td>
                        <td className="border px-4 py-2">{editRequest.recordNumber}</td>
                        <td className="border px-4 py-2">{editRequest.value}</td>
                        {role === 'attendant' && (
                          <>
                          <th className="border px-4 py-2">{editRequest.status}</th>
                          <th className="border px-4 py-2">{editRequest.supervisorName}</th>
                          </>
                        )}
                        <td className="border px-4 py-2">
                          {viewEditRequest.recordId === '' ? (
                            <button 
                            onClick={() => {handleViewEditedRecord(editRequest), setRecordToEdit(editRequest)}}
                            className="bg-gray-50 hover:bg-green-100 text-gray-700 font-semibold py-1 px-3 rounded"
                        >
                            View
                        </button>
                          ):(
                            <button 
                            onClick={() => {setViewEditRequest(prevState => ({
                              ...prevState,
                              recordId: '',
                              userName: '',
                              userImage: '', 
                              userEmail: '',
                              status: '',
                              supervisorComment: '',
                              reason: '',
                              createAt: '',
                            }));
                          }}
                            className="bg-gray-50 hover:bg-green-100 text-gray-700 font-semibold py-1 px-3 rounded"
                        >
                            cancel
                        </button>
                          )}
                        
                        </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
              </div>
            </div>
        
      </section>
      <section className="shift-notifications">
      <h3 className="text-xl font-semibold mb-4">Shift Notifications</h3>

      {/* Wrong Shift Notifications */}
      
      {/* Shift Notifications */}
      {(role === 'attendant' && attendantWrongShift) ? (
        <div className='bg-gray-50 p-2 border rounded-lg shadow-lg mb-4'>
          <h4 className="font-medium mb-2  bg-red-500 text-gray-100 grow p-3">Wrong Shift Warnings</h4>
          <div>You are working on a wrong shift.
            You&apos;re write rights might be denied.
            Contact your supervisor for more information. 
          </div>

          <div>
            <p>Your shift details:</p>
            <div className="grid grid-cols-5 grid-rows-2 gap-2">
              <p className="col-span-1 row-span-1">Shift</p>
              <p className="col-span-1 row-span-1">Start</p>
              <p className="col-span-1 row-span-1">End</p>
              <p className="col-span-1 row-span-1">Current time</p>
              <p className="col-span-1 row-start-2">{attendantWrongShift.shift}</p>
              
              {attendantWrongShift.shift === 'morning' && (
                <>
                  <p className="col-span-1 row-start-2">08:00 AM</p>
                  <p className="col-span-1 row-start-2">01:00 PM</p>
                  <p className="col-span-1 row-start-2"></p> {/* Empty cell for alignment */}
                </>
              )}
              {attendantWrongShift.shift === 'evening' && (
                <>
                  <p className="col-span-1 row-start-2">01:00 PM</p>
                  <p className="col-span-1 row-start-2">05:00 PM</p>
                </>
              )}

              {!['morning', 'evening'].includes(attendantWrongShift.shift) && (
                <>
                  <p className="col-span-1 row-start-2">-</p>
                  <p className="col-span-1 row-start-2">-</p>
                  <p className="col-span-1 row-start-2"></p> {/* Empty cell for alignment */}
                </>
              )}

              <p className="col-span-1 row-start-2">{getCurrentTimeFormatted()}</p>
            </div>
          </div>

         
        </div>
        
      ):(
        role === 'supervisor' && (
          <>
        <h4 className="font-medium mb-2">Wrong Shift Warnings</h4>
        <div className="notification-card bg-white shadow-md p-4 rounded-lg mb-4">
              <div>
                  <div className='flex'>
                    <Image 
                      width={30} 
                      height={30} 
                      src='/images/'
                      alt='user image' 
                      className='h-16 w-16 border rounded-full mr-4'
                    />
                    <div>
                      <p> {viewWrongShift?.name}</p>
                      <p className='text-xs text-gray-500'>Shift, {viewWrongShift?.shift}</p>
                    </div>
                    
                  </div>
                  <p>Currently logged in but shift ended at:</p>
                  <p>{getCurrentTimeFormatted()}</p>
                  <div className='flex max-w-80'>
                    {dismissWarning ? (
                      <>
                      <form action={shiftFormAction}>
                        <p className='text-green-600'>Are you sure you want to dismiss warning?</p>
                        <input type="hidden" name='attendantId' value={viewWrongShift?.id} />
                        <input type="hidden" name='dismiss' value='true' />
                        <button 
                          type='submit'
                          //onClick={() => setDismissWarning(false)}
                          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded mt-3"
                          >
                          Dismiss
                      </button>
                      </form>
                      <button 
                          onClick={() => setDismissWarning(false)}
                          className="flex items-center bg-gray-100 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-3 rounded mt-3"
                          >
                          Cancel
                      </button>
                      </>
                      
                      

                    ):(
                      denyRights ? (
                        <>
                        <form action={shiftFormAction}>
                        <p className='text-green-600'>Are you sure you want to deny write rights?</p>
                        <input type="hidden" name='attendantId' value={viewWrongShift?.id} />
                        <input type="hidden" name='dismiss' value='false' />
                        <button 
                          type='submit'
                          //onClick={() => setDismissWarning(false)}
                          className="flex items-center bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded mt-3"
                          >
                          Deny
                      </button>
                      </form>
                      <button 
                          onClick={() => setDenyRights(false)}
                          className="flex items-center bg-gray-100 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-3 rounded mt-3"
                          >
                          Cancel
                      </button>
                        </>
                      ):(
                        <>
                        <button 
                          onClick={() => setDismissWarning(true)}
                          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded mt-3"
                          >
                          Dismiss
                      </button>
                      <button 
                          onClick={() => setDenyRights(true)}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded mt-3"
                          >
                          Deny write rights
                      </button>
                      </>
                      )
                      
                      
                    )}
                    
                  </div>
                </div>
                
       
                <div className='overflow-x-auto mt-4'>
                <p className='mb-2 text-gray-600'>Shift details:</p>
              <table className="min-w-full bg-white border border-gray-300  mx-auto">
                <thead className='bg-green-100 text-green-800 max-lg:text-sm max-sm:text-xs'>
                    <tr>
                        <th className="border px-4 py-2">No.</th>
                        <th className="border px-4 py-2">Name</th>
                        <th className="border px-4 py-2">Email</th>
                        <th className="border px-4 py-2">Counter</th>
                        <th className="border px-4 py-2">Shift</th>
                        <th className="border px-4 py-2">End time</th>
                        <th className="border px-4 py-2">Current time</th>
                        <th className="border px-4 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                {!wrongShiftAttendants ?(
                  <p className="text-gray-500">No wrong shift warnings.</p>
                ):(
                  wrongShiftAttendants.map((user, index) => (
                    <tr 
                      key={user.id}
                      className='max-lg:text-sm max-sm:text-xs hover:bg-gray-50'>
                      <td className="border px-4 py-2">{index + 1}</td>
                      <td className="border px-4 py-2">{user.name}</td>
                      <td className="border px-4 py-2">{user.email}</td>
                      <td className="border px-4 py-2">{user.counter}</td>
                      <td className="border px-4 py-2">{user.shift}</td>
                      {getCurrentShift() === 'morning' ? (
                         <td className="border px-4 py-2">12 PM</td>
                      ):(
                        <td className="border px-4 py-2">5 PM</td>
                      )}                 
                      <td className="border px-4 py-2">{getCurrentTimeFormatted()}</td>
                      <td className="flex border px-4 py-2">
                      <button 
                          onClick={() => setViewWrongShift(user)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded mt-3"
                          >
                          View
                      </button>
                      </td>
                  </tr>
                  ))
                ) }
                </tbody>
              </table>
              </div>
              </div>    
              </>   
        )
        

      )}
      {/* Expired Shift Duration Notifications */}
     {(role === 'attendant' && attendantExpiredShift ) ? (
      <div className='bg-gray-50 p-2 border rounded-lg shadow-lg'>
      <h4 className="font-medium mb-2 mt-4 bg-red-500 text-gray-100 grow p-3">Expired Shift Duration</h4>
      <div>You&apos;re assigned shift duration has expired.
        Contact your supervisor to be assigned new shift. 
      </div>

      <div>
            <p>Your shift duration details:</p>
            <div className="grid grid-cols-3 grid-rows-2 gap-2">
              <p className="col-span-1 row-span-1">Start date</p>
              <p className="col-span-1 row-span-1">End date</p>
              <p className="col-span-1 row-span-1">Today&apos;s date</p>
              <p className="col-span-1 row-start-2">{<FormatDate date={attendantExpiredShift?.shiftStartDate ?? undefined} />}</p>
              <p className="col-span-1 row-start-2">{<FormatDate date={attendantExpiredShift?.shiftEndDate ?? undefined} />}</p>
              <p className="col-span-1 row-start-2">{<FormatDate date={new Date()} />}</p>

            </div>
          </div>


    </div>
     ):(
      role === 'supervisor' && (
        <>
      <h4 className="font-medium mt-6 mb-2">Expired Shift Duration</h4>
            <div className="notification-card bg-white shadow-md p-4 rounded-lg mb-4">
            <div>
          
                  <div className='flex'>
                      <Image 
                        width={30} 
                        height={30} 
                        src={viewShiftDuration?.image ?? '/images/'}
                        alt='user image' 
                        className='h-16 w-16 border rounded-full mr-4'
                      />
                      <div>
                        <p> {viewShiftDuration?.name}</p>
                        <p className='text-xs text-gray-500'>Shift duration end date:{<FormatDate date={viewShiftDuration?.shiftEndDate ?? undefined} />} </p>
                        <p className='text-xs text-gray-500'>Today&apos;s date: {<FormatDate date={new Date()} />}</p>
                      </div>
                      
                    </div>
                    <Link href={{ pathname: '/dashboard/supervisor/attendants/create', query: { id } }}>
                      <button 
                            //onClick={() => handleAssignNewShift('notification.id)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded mt-3 max-w-44"
                          >
                          Assign New Shift
                        </button>
                    </Link>
                    
                </div>
                
                <div className='overflow-x-auto mt-4'>
                <p className='mb-2 text-gray-600'>Shift details:</p>
              <table className="min-w-full bg-white border border-gray-300  mx-auto">
                <thead className='bg-green-100 text-green-800 max-lg:text-sm max-sm:text-xs'>
                    <tr>
                        <th className="border px-4 py-2">No.</th>
                        <th className="border px-4 py-2">Name</th>
                        <th className="border px-4 py-2">Email</th>
                        <th className="border px-4 py-2">Counter</th>
                        <th className="border px-4 py-2">Shift</th>
                        <th className="border px-4 py-2">End date</th>
                        <th className="border px-4 py-2">Current date</th>
                        <th className="border px-4 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                {!expiredShiftAttendants ? (
                  <p className="text-gray-500">No expired shift notifications.</p>
                ) : (
                  expiredShiftAttendants.map((attendant, index) => (
                    <tr 
                      key={attendant.id}
                      className='max-lg:text-sm max-sm:text-xs hover:bg-gray-50'>
                        <td className="border px-4 py-2">{index + 1}</td>
                        <td className="border px-4 py-2">{attendant.name}</td>
                        <td className="border px-4 py-2">{attendant.email}</td>
                        <td className="border px-4 py-2">{attendant.counter}</td>
                        <td className="border px-4 py-2">{attendant.shift}</td>
                        <td className="border px-4 py-2"><FormatDate date={attendant.shiftEndDate} /></td>
                        <td className="border px-4 py-2"><FormatDate date={new Date()} /></td>
                        <td className="border px-4 py-2">
                        <button 
                          onClick={() => setViewShiftDuration(attendant)}
                          className="bg-gray-50 hover:bg-green-100 text-gray-700 font-semibold py-1 px-3 rounded"
                          >
                          View
                        </button>
                        </td>
                    </tr>
                  ))
                  
                )}
                    
                </tbody>
              </table>
              </div> 
              </div>  
              </>     
      )
      
     )}
        
           
            
      </section>
  
    </div>
  );
  
};

export default NotificationPage;
