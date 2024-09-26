'use client'

import { createRecord, editRecord } from "@/app/lib/action";
import { RecordState } from "@/app/lib/definitions";
import { useFormState, useFormStatus } from "react-dom";
import { Record } from "@/app/lib/definitions";
import { useContext } from "react";
import { CounterContext } from "../counterContext";


function SubmitButton ({editedRecord}: { editedRecord: Record | undefined }){
  const { pending } = useFormStatus(); 
  return(
 
  <button type="submit" disabled={pending}>
  {pending ? (
    editedRecord? "Updating..." : "Adding..."
  ) : (
    editedRecord ? "Update" : "Add"
  )}
  </button>
    
  )
}

export default function RecordForm({shift, userId, record}:{userId: string, shift: string, record: Record | undefined}) {

  const {counter} = useContext(CounterContext);

 
  const initialState: RecordState = { message: null, state_error: null, errors: {} };
  const [state, formAction] = useFormState(createRecord, initialState);

  const editRecordById = editRecord.bind(null,record?.id || '');
   
  return (
    <>

    {record ? (
      <form  action={editRecordById} className="space-y-4 max-w-xl mx-auto">
        <FormInputs />
    </form>
    ):(
      <form  action={formAction} className="space-y-4 max-w-xl mx-auto">
        <FormInputs />
    </form>
    )}
    </> 
  );

  function FormInputs(){
    return(
      <>
      <div>
    <input
        type="hidden"
        name="shift"
        defaultValue={shift}
        className="border p-2 rounded w-full"
        required
      />
      <input
        type="hidden"
        name="counter"
        defaultValue={counter}
        className="border p-2 rounded w-full"
        required
      />
       <input
        type="hidden"
        name="userId"
        defaultValue={userId}
        className="border p-2 rounded w-full"
        required
      />
      <label className="block text-sm font-medium">Ticket Number</label>
      <input
        type="text"
        name="ticketNumber"
        defaultValue={record?.ticket || ''}
        className="border p-2 rounded w-full"
        required
      />
      <label className="block text-sm font-medium">Name</label>
      <input
        type="text"
        name="name"
        defaultValue={record?.name || ''}
        className="border p-2 rounded w-full"
        required
      />

    </div>
    <div>
      <label className="block text-sm font-medium">Service Offered</label>
      <input
        type="text"
        name="service"
        defaultValue={record?.service || ''}
        className="border p-2 rounded w-full"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium">Invoice Number</label>
      <input
        type="text"
        name="invoice"
        defaultValue={record?.invoice || ''}
        className="border p-2 rounded w-full"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium">Value</label>
      <input
        type="number"
        name="value"
        defaultValue={record?.value || ''}
        className="border p-2 rounded w-full"
        required
      />
    </div>
   
    <SubmitButton editedRecord={record}/>
      </>
    )
   
  }
}
