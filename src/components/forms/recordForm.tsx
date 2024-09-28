'use client'

import { createRecord, editRecord } from "@/app/lib/action";
import { RecordState } from "@/app/lib/definitions";
import { useFormState, useFormStatus } from "react-dom";
import { Record } from "@/app/lib/definitions";
import { useContext, useState } from "react";
import { CounterContext } from "../counterContext";
import { Services } from "@/app/lib/data";
import toast from "react-hot-toast";
import Link from "next/link";


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

export default function RecordForm({shift, userId, role, record}:{role:string, userId: string, shift: string, record: Record | undefined}) {

  const {counter} = useContext(CounterContext);
 
  const initialState: RecordState = { message: null, state_error: null, errors: {} };
  const [state, formAction] = useFormState(createRecord, initialState);

  const editRecordById = editRecord.bind(null,record?.id || '');
    const [editState, editFormAction] = useFormState(editRecordById, initialState);

 

  if (state?.message) {
    if (state?.response === 'ok') {
      toast.success(state.message);
    }
  } else if (state?.state_error) {
    toast.error(state.state_error);
  } else {
    toast.dismiss();
  }

  if (editState?.message) {
    if (editState?.response === null) {
      toast.error(editState.message);
    }
  } else if (editState?.state_error) {
    toast.error(editState.state_error);
  }
 
   
  return (
    <>

    {record ? (
      <form  action={editFormAction} className="space-y-4 max-w-xl mx-auto">
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
    const [ service, setService ] = useState<string>('Daily parking')
  const [ subServices, setSubServices ] = useState<string[]>(Services[0].subServices)

  function handleServiceChange(selectedService:string){
    const service = Services.find((service) => service.name === selectedService);
    if (service){
      setService(service.name)
      setSubServices(service.subServices)
    }
  }
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
      <select 
        name="service"
        defaultValue={service || ''}
        onChange={(e) => handleServiceChange(e.target.value)}
        className="border p-2 rounded-lg w-full"
      >
        {Services.map((service, index) => (
          <option key={index} value={service.name}>{service.name}</option>
        ) 
        )}   
      </select>
      </div>
      <div>
      <label className="block text-sm font-medium">Sub Service Offered</label>
      <select
      name="subService"
      defaultValue={subServices}
      className="border p-2 rounded-lg w-full"
      >
        {subServices.map((subService, index) => (
           <option key={index} value={subService}>{subService}</option>

        ))}
       
      </select>
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
   
    <div className="pb-2 flex gap-2">
        <SubmitButton editedRecord={record}/>
          <Link 
          className="button"
            href={`/dashboard/${role}/records`}>
              Cancel
          </Link>
        </div>
      </>
    )
   
  }
}
