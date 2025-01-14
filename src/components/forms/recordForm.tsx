"use client";

import { createRecord, requestEditRecord } from "@/app/lib/action";
import { EditRecordState, RecordState } from "@/app/lib/definitions";
import { useFormState, useFormStatus } from "react-dom";
import { Record } from "@/app/lib/definitions";
import { useContext, useState } from "react";
import { CounterContext } from "../counterContext";
import { Services } from "@/app/lib/data";
import toast from "react-hot-toast";
import Link from "next/link";

function SubmitButton({ editedRecord }: { editedRecord: Record | undefined }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending
        ? editedRecord
          ? "Sending..."
          : "Adding..."
        : editedRecord
        ? "Send request"
        : "Add"}
    </button>
  );
}

export default function RecordForm({
  shift,
  userId,
  role,
  record,
}: {
  role: string;
  userId: string;
  shift: string;
  record: Record | undefined;
}) {
  const { counter } = useContext(CounterContext);
  const [recordType, setRecordType] = useState<string>(
    record?.recordType ?? ""
  );

  const initialState: RecordState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const [state, formAction] = useFormState(createRecord, initialState);

  const editFormState: EditRecordState = {
    message: null,
    state_error: null,
    errors: {},
  };
  const [editState, requestEditFormAction] = useFormState(
    requestEditRecord,
    editFormState
  );

  if (state?.message) {
    if (state?.response === "ok") {
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
        <form
          action={requestEditFormAction}
          className="space-y-4 max-w-xl mx-auto"
        >
          <FormInputs />
        </form>
      ) : (
        <form action={formAction} className="space-y-4 max-w-xl mx-auto">
          <FormInputs />
        </form>
      )}
    </>
  );

  function FormInputs() {
    const [service, setService] = useState<string>(
      record?.service ?? "Daily parking"
    );
    const [subServices, setSubServices] = useState<string[]>(
      Services[0].subServices
    );

    const [editSubService, setEditSubService] = useState<boolean>(
      !!record?.subService
    );

    function handleServiceChange(selectedService: string) {
      const service = Services.find(
        (service) => service.name === selectedService
      );
      if (service) {
        setService(service.name);
        setSubServices(service.subServices);
      }
      setEditSubService(false);
    }
    return (
      <>
        {record ? (
          <h1 className="text-gray-700 font-semibold flex grow justify-center">
            Request to edit record form
          </h1>
        ) : (
          <h1 className="text-gray-700 font-semibold flex grow justify-center">
            Add record form
          </h1>
        )}

        <div>
          {record && (
            <input
              type="hidden"
              name="recordId"
              defaultValue={record.id}
              className="border p-2 rounded w-full"
              required
            />
          )}
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

          <fieldset className="flex justify-between items-center border p-2 rounded w-full mb-2">
            <legend>Record type:</legend>
            <div>
              <input
                type="radio"
                name="recordType"
                value="invoice"
                className="mx-2"
                checked={
                  record?.recordType === "invoice" || recordType === "invoice"
                }
                onChange={(e) => setRecordType(e.target.value)}
              />
              <label>Invoice</label>
            </div>
            <div>
              <input
                type="radio"
                name="recordType"
                value="receipt"
                className="mx-2"
                checked={
                  record?.recordType === "receipt" || recordType === "receipt"
                }
                onChange={(e) => setRecordType(e.target.value)}
              />
              <label>Receipt</label>
            </div>
          </fieldset>

          <label className="block text-sm font-medium">Ticket Number</label>
          <input
            type="text"
            name="ticketNumber"
            defaultValue={record?.ticket || ""}
            className="border p-2 rounded w-full"
            required
          />
          <label className="block text-sm font-medium">Customer name</label>
          <input
            type="text"
            name="name"
            defaultValue={record?.name || ""}
            className="border p-2 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Service Offered</label>
          <select
            name="service"
            defaultValue={service || ""}
            onChange={(e) => handleServiceChange(e.target.value)}
            className="border p-2 rounded-lg w-full"
          >
            {Services.map((service, index) => (
              <option key={index} value={service.name}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">
            Sub Service Offered
          </label>
          <select
            name="subService"
            defaultValue={record?.subService ?? subServices}
            className="border p-2 rounded-lg w-full"
          >
            {editSubService ? (
              <option value={record?.subService || ""}>
                {record?.subService || "Select a sub-service"}
              </option>
            ) : (
              subServices.map((subService, index) => (
                <option key={index} value={subService}>
                  {subService}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          {recordType ? (
            <>
              <label className="block text-sm font-medium">
                {recordType === "invoice" ? "Invoice Number" : "Receipt Number"}
              </label>
              <input
                type="text"
                name="recordNumber"
                defaultValue={record?.recordNumber || ""}
                className="border p-2 rounded w-full"
                required
              />
            </>
          ) : (
            <>
              <label className="block text-sm text-red-800 font-medium">
                Please choose a record type
              </label>
              <input
                type="text"
                name="recordNumber"
                defaultValue={record?.recordNumber || ""}
                className="border p-2 rounded w-full"
                required
                disabled
              />
            </>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium">Value</label>
          <input
            type="number"
            name="value"
            defaultValue={record?.value || ""}
            className="border p-2 rounded w-full"
            required
          />
        </div>
        {record && (
          <div>
            <label className="block text-sm font-medium">
              Reason for edit:
            </label>
            <textarea
              name="attendantComment"
              rows={2}
              cols={2}
              className="border p-2 rounded w-full"
              required
            />
          </div>
        )}

        <div className="pb-2 flex gap-2">
          <SubmitButton editedRecord={record} />
          <Link className="button" href={`/dashboard/${role}/records`}>
            Cancel
          </Link>
        </div>
      </>
    );
  }
}
