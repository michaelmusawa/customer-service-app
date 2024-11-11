'use client'

import { editUser } from '@/app/lib/action';
import { User, UserState } from '@/app/lib/definitions';
import UserForm from '@/components/forms/form';
import React from 'react'
import { useFormState } from 'react-dom';
import toast from 'react-hot-toast';

export default function EditUserPage({ user, type, loggedInUser }:{loggedInUser:string, type:string, user:User | undefined}) {
    const initialState: UserState = { response: null, message: null, errors: {} };
    const editUserById = editUser.bind(null, user?.id || '');
    const [state, formAction] = useFormState(editUserById, initialState);
    
    if (state?.message) {
      if (state?.response === '!ok') {
        toast.error(state.message);
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
          <UserForm type = {type} label={`Update ${type}`} user = {user} loggedInUser={loggedInUser} />
      </form>
    </div>
  )
}
