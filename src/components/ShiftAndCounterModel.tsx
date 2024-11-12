'use client'


import { archiveUser, assignShiftAndCounter } from '@/app/lib/action';
import { UserState } from '@/app/lib/definitions';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react'
import { useFormState } from 'react-dom';
import toast from 'react-hot-toast';



export default function ShiftAndCounterModel({ 
    userId,
    counter,
    shift,
    startDate,
    endDate,
    role,
    setShowShiftAndCounterModel
 }:{ 
    userId:string,
    counter:number,
    shift:string,
    startDate:Date,
    endDate:Date,
    role: string,
    setShowShiftAndCounterModel: (value: boolean) => void;
 }) {
    const initialState: UserState = { response: null, message: null, errors: {} };
      const assignShiftAndCounterById = assignShiftAndCounter.bind(null, userId);
      const [state, formAction] = useFormState(assignShiftAndCounterById, initialState);

      const searchParams = useSearchParams();
      const id = searchParams.get('id');

      const router = useRouter();

      if(state.response){
        setShowShiftAndCounterModel(false)
      }

      if (state?.message) {
        setShowShiftAndCounterModel(false)
        if (state?.response === '!ok') {
          toast.error(state.message);
        } else if (state?.response === 'ok') {
          toast.error(state.message);
        } 
      } else if (state?.state_error) {
        setShowShiftAndCounterModel(false)
        toast.error(state.state_error);
      } else {
        toast.dismiss();
      }

  return (
    <div className="fixed bg-black/60 backdrop-blur-sm inset-0 flex items-center h-full w-full justify-center" style={{ pointerEvents: 'auto' }}>
        <div className="items-center bg-white h-40 w-72 p-4 rounded-lg">
        <p className="text-center mt-4 text-gray-700">Are you sure you want to <br/> <span>{status} user?</span> </p>
        <div className="flex gap-2 mt-4">
            <form action={formAction}>
            <input type="hidden" name="id" value={userId ?? ''} />
            <input type="hidden" name="counter" value={counter} />
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="shift" value={shift} />
            <input type="hidden" name="startDate" defaultValue={`${startDate}`} />
            <input type="hidden" name="endDate" defaultValue={`${endDate}`}/>

            {id ? (
              <button
              onClick={() => router.push('/dashboard/supervisor/notification')}
              className="!bg-green-800 px-1 py-1 !text-sm !text-gray-white hover:bg-gray-100" 
              type='submit'> Yes,&nbsp;update shift!
              
            </button>
            ): (
              <button
                className="!bg-green-800 px-1 py-1 !text-sm !text-gray-white hover:bg-gray-100" 
                type='submit'> Yes,&nbsp;update shift!
                
              </button>
            )}

            
            
            </form>
            <button
                className="!bg-gray-100 px-1 py-1 !text-sm !text-gray-700 hover:bg-gray-100"
                onClick={() => setShowShiftAndCounterModel(false)}>Cancel
            </button>
        </div>
        
        </div>
    </div>
    )
}