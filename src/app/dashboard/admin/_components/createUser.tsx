'use client'

import { createUser } from '@/app/lib/action';
import { UserState } from '@/app/lib/definitions';
import UserForm from '@/components/forms/form';
import React from 'react'
import { useFormState } from 'react-dom';
import toast from 'react-hot-toast';

export default function CreateUserPage({type, loggedInUser}:{loggedInUser:string, type:string}) {
    const initialState: UserState = { response: null, message: null, state_error: null, errors: {} };
    const [state, formAction] = useFormState(createUser, initialState);
   

    if (state?.message) {
        if (state?.response === 'ok') {
          toast.success(state.message);
        } else if (state?.response === null) {
          toast.error(state.message);
        }
      } else if (state?.state_error) {
        toast.error(state.state_error);
      } else {
        toast.dismiss();
      }
      
  return (
    <div>
        <form 
          action={formAction}>
          <UserForm loggedInUser={loggedInUser} type = {type} label={`Create ${type}`} user = {undefined}/>
      </form>
    </div>
  )
}
