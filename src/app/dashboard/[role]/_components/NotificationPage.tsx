"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  EditedRecord,
  Fields,
  Record,
  RequestEditRecordState,
  User,
} from "@/app/lib/definitions";
import { FormatDate, formatTime } from "@/app/lib/data";
import { editRequestEditRecord } from "@/app/lib/action";
import { useFormState } from "react-dom";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

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
  const notifications = {
    editRequests,
    attendants,
  };

  const searchParams = useSearchParams();
  const edit = searchParams.get("edit");

  const [recordToEdit, setRecordToEdit] = useState<EditedRecord | null>(null);
  const [supervisorComment, setSupervisorComment] = useState<string>("");
  const [rejectRecordToEdit, setRejectRecordToEdit] = useState<boolean>(false);
  const [accept, setAccept] = useState<boolean>(false);

  const [viewEditRequest, setViewEditRequest] = useState({
    recordId: "",
    userImage: "/images/",
    userName: "",
    userEmail: "",
    createAt: new Date(),
    status: "",
    reason: "",
    supervisorComment: "",
    fields: [
      {
        id: "",
        fieldName: "",
        value: "",
        editedValue: "",
      },
    ],
  });

  useEffect(() => {
    if (edit === "true") {
      setViewEditRequest((prevState) => ({
        ...prevState,
        recordId: "",
        userName: "",
        userImage: "",
        userEmail: "",
        status: "",
        supervisorComment: "",
        reason: "",
        createAt: new Date(),
        fields: [],
      }));

      toast.success("Changes effected successfully", {
        id: "success-toast",
      });
      window.history.replaceState({}, document.title, window.location.pathname);

      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    }
  }, [edit]);

  const initialState: RequestEditRecordState = {
    response: null,
    message: null,
    errors: {},
  };
  const editRequestEditRecordById = editRequestEditRecord.bind(
    null,
    recordToEdit?.id || ""
  );
  const [editState, formAction] = useFormState(
    editRequestEditRecordById,
    initialState
  );

  if (editState) {
    if (editState.state_error) toast.error(editState.state_error);
  }

  const handleViewEditedRecord = (editRecord: EditedRecord) => {
    setViewEditRequest((prevState) => ({
      ...prevState,
      recordId: editRecord.recordId,
      userName: editRecord.userName,
      userImage: editRecord.userImage,
      userEmail: editRecord.userEmail,
      status: editRecord.status,
      supervisorComment: editRecord.supervisorComment,
      reason: editRecord.attendantComment,
      createAt: editRecord.editedRecordCreatedAt,
    }));
  };

  useEffect(() => {
    if (recordToEdit) {
      const matchingRecord = records?.find(
        (record) => record.recordId === recordToEdit.recordId
      );

      if (matchingRecord) {
        const fieldsToUpdate: Fields[] = [];

        // Check if the 'Record type' field is different
        if (matchingRecord.recordType !== recordToEdit.recordType) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: "Record type",
            value: matchingRecord.recordType,
            editedValue: recordToEdit.recordType,
          });
        }

        // Check if the 'customer name' field is different
        if (matchingRecord.name !== recordToEdit.name) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: "Customer name",
            value: matchingRecord.name,
            editedValue: recordToEdit.name,
          });
        }

        // Check if the 'service category' field is different
        if (matchingRecord.service !== recordToEdit.service) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: "Service category",
            value: matchingRecord.service,
            editedValue: recordToEdit.service,
          });
        }

        // Check if the 'service category' field is different
        if (matchingRecord.subService !== recordToEdit.subService) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: "service",
            value: matchingRecord.subService,
            editedValue: recordToEdit.subService,
          });
        }

        // Check if the 'Record number' field is different
        if (matchingRecord.recordNumber !== recordToEdit.recordNumber) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: "Record number",
            value: matchingRecord.recordNumber,
            editedValue: recordToEdit.recordNumber,
          });
        }

        // Check if the 'Amount' field is different
        if (matchingRecord.value !== recordToEdit.value) {
          fieldsToUpdate.push({
            id: recordToEdit.id,
            fieldName: "Amount",
            value: matchingRecord.value.toString(),
            editedValue: recordToEdit.value.toString(),
          });
        }

        if (fieldsToUpdate.length > 0) {
          setViewEditRequest((prevState) => ({
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
        {role === "attendant" ? (
          <h3 className="text-xl font-semibold mb-4">Your Edit Requests</h3>
        ) : (
          <h3 className="text-xl font-semibold mb-4">
            Edit Request Notifications
          </h3>
        )}

        <div className="notification-card bg-white shadow-md p-4 rounded-lg mb-4">
          {viewEditRequest.recordId !== "" && (
            <div className="flex">
              <div>
                <div className="flex justify-around">
                  <Image
                    width={30}
                    height={30}
                    src={viewEditRequest.userImage ?? "/images/"}
                    alt="No image"
                    className="flex justify-center items-center text-gray-500 h-16 w-16 border rounded-full mr-4 text-xs"
                  />
                  <div>
                    <p> {viewEditRequest.userName}</p>
                    <p> {viewEditRequest.userEmail}</p>
                    <p className="text-xs text-gray-500">
                      <FormatDate date={viewEditRequest.createAt} />, at{" "}
                      {formatTime(viewEditRequest.createAt)}
                    </p>
                  </div>
                </div>

                <fieldset className="border rounded-sm p-4 mt-4">
                  <legend className="text-gray-700 font-semibold">
                    Fields to be Changed
                  </legend>
                  <ul className="list-disc list-inside ml-4 text-gray-700">
                    {viewEditRequest.fields.map((field, index) => (
                      <li key={index}>
                        <strong className="font-medium text-gray-600">
                          {field.fieldName}:
                        </strong>{" "}
                        {field.value} → {field.editedValue}
                      </li>
                    ))}
                  </ul>
                  <div className="flex mt-4 items-center">
                    {role === "attendant" ? (
                      <>
                        <p className="mr-4">Status:</p>
                        <div
                          className={clsx(
                            "font-semibold",
                            {
                              "text-green-700":
                                viewEditRequest.status === "accepted",
                            },
                            {
                              "text-red-700":
                                viewEditRequest.status === "rejected",
                            },
                            {
                              "text-gray-500":
                                viewEditRequest.status === "pending",
                            }
                          )}
                        >
                          {viewEditRequest.status}
                        </div>
                      </>
                    ) : rejectRecordToEdit ? (
                      <div className="flex">
                        <>
                          <form action={formAction}>
                            <input
                              type="hidden"
                              name="supervisorId"
                              value={sessionUserId}
                            />
                            <input
                              type="hidden"
                              name="status"
                              value="rejected"
                            />
                            <input
                              type="hidden"
                              name="supervisorComment"
                              value={supervisorComment}
                            />

                            <button
                              type="submit"
                              className="!bg-red-500 !hover:bg-red-600 !text-white font-semibold py-1 px-3 rounded-lg"
                            >
                              Reject
                            </button>
                          </form>
                          <button
                            onClick={() => setRejectRecordToEdit(false)}
                            className="bg-gray-100 !hover:bg-gray-300 !text-gray-800 font-semibold py-1 px-3 rounded-lg ml-4"
                          >
                            Cancel
                          </button>
                        </>
                      </div>
                    ) : (
                      <div className="flex">
                        <>
                          <form action={formAction}>
                            <input
                              type="hidden"
                              name="supervisorId"
                              value={sessionUserId}
                            />
                            <input
                              type="hidden"
                              name="status"
                              value="accepted"
                            />
                            <input
                              type="hidden"
                              name="supervisorComment"
                              value="accepted"
                            />

                            {accept ? (
                              <>
                                <div className="text-center border border-green-700 p-2">
                                  <p>
                                    Are you sure you want to effect the changes
                                  </p>
                                  <p>made to this record?</p>
                                </div>

                                <div className="flex mt-2">
                                  <button
                                    type="submit"
                                    className="bg-green-700 hover:bg-green-600 text-white font-semibold p-2 rounded-lg"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setAccept(false)}
                                    className="bg-gray-300 hover:bg-gray-100 text-white font-semibold p-2 rounded-lg ml-4"
                                  >
                                    No
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button
                                onClick={() => setAccept(true)}
                                className="bg-green-700 hover:bg-green-600 text-white font-semibold p-2 rounded-lg"
                              >
                                Accept
                              </button>
                            )}
                          </form>
                          {!accept && (
                            <button
                              onClick={() => setRejectRecordToEdit(true)}
                              className="bg-red-500 hover:bg-red-600 text-white font-semibold p-2 rounded-lg  ml-4"
                            >
                              Reject
                            </button>
                          )}
                        </>
                      </div>
                    )}
                  </div>
                </fieldset>
              </div>
              <div className="grow min-w-8 overflow-hidden min-h-6 border ml-8 bg-gray-100 rounded-lg shadow-lg">
                {rejectRecordToEdit ? (
                  <>
                    <p className="ml-1 p-1 text-xs text-gray-500">
                      Reason for rejection:
                    </p>
                    <textarea
                      name="supervisorComment"
                      cols={3}
                      rows={3}
                      placeholder="Write a brief reason why ..."
                      onChange={(e) => setSupervisorComment(e.target.value)}
                      className="h-3/4 w-full bg-gray-50 rounded-lg text-sm p-2"
                      required
                    />
                  </>
                ) : (
                  <>
                    <div className="flex flex-col h-[90%] border">
                      <p className="text-sm m-2 text-gray-500">Reason:</p>
                      <p className="h-full w-full p-2 bg-gray-50 text-sm">
                        {viewEditRequest.reason}
                      </p>
                    </div>
                    {viewEditRequest.status === "rejected" && (
                      <div>
                        <p className="ml-1 p-1 text-xs text-gray-500">
                          Supervisor reason for rejection:
                        </p>
                        <p className="h-3/4 w-full bg-gray-50 rounded-lg text-sm p-2">
                          {viewEditRequest.supervisorComment}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* <p className='h-3/4 w-full bg-gray-50 rounded-lg text-sm p-2'>{viewEditRequest.reason}</p> */}
              </div>
            </div>
          )}

          <div className="overflow-x-auto mt-4">
            <p className="mb-2 text-gray-700 font-semibold">Edited record:</p>
            <table className="min-w-full bg-white border border-gray-300  mx-auto">
              <thead className="bg-green-100 text-green-800 max-lg:text-sm max-sm:text-xs">
                <tr>
                  <th className="border px-4 py-2">No.</th>
                  <th className="border px-4 py-2">Ticket</th>
                  <th className="border px-4 py-2">Customer Name</th>
                  <th className="border px-4 py-2">Service Category</th>
                  <th className="border px-4 py-2">Service</th>
                  <th className="border px-4 py-2">Record Number</th>
                  <th className="border px-4 py-2">Amount</th>
                  {role === "attendant" && (
                    <>
                      <th className="border px-4 py-2">Status</th>
                    </>
                  )}

                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!notifications.editRequests ||
                notifications.editRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={role === "attendant" ? 8 : 7}
                      className="text-center text-gray-500"
                    >
                      No edit requests available.
                    </td>
                  </tr>
                ) : (
                  notifications.editRequests.map((editRequest, index) => (
                    <tr
                      key={editRequest.id}
                      className="max-lg:text-sm max-sm:text-xs hover:bg-gray-50"
                    >
                      <td className="border px-4 py-2">{index + 1}</td>
                      <td className="border px-4 py-2">{editRequest.ticket}</td>
                      <td className="border px-4 py-2">{editRequest.name}</td>
                      <td className="border px-4 py-2">
                        {editRequest.subService}
                      </td>
                      <td className="border px-4 py-2">
                        {editRequest.service}
                      </td>
                      <td className="border px-4 py-2">
                        {editRequest.recordNumber}
                      </td>
                      <td className="border px-4 py-2">
                        {editRequest.value.toLocaleString("en-US")}
                      </td>
                      {role === "attendant" && (
                        <>
                          <th
                            className={clsx(
                              "border px-4 py-2",
                              {
                                "text-green-700":
                                  editRequest.status === "accepted",
                              },
                              {
                                "text-red-700":
                                  editRequest.status === "rejected",
                              },
                              {
                                "text-gray-500":
                                  editRequest.status === "pending",
                              }
                            )}
                          >
                            {editRequest.status}
                          </th>
                        </>
                      )}
                      <td className="border px-4 py-2">
                        {viewEditRequest.recordId !== editRequest.recordId ? (
                          <button
                            onClick={() => {
                              handleViewEditedRecord(editRequest),
                                setRecordToEdit(editRequest);
                            }}
                            className="bg-gray-50 hover:bg-green-100 text-gray-700 font-semibold py-1 px-3 rounded"
                          >
                            View
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setViewEditRequest((prevState) => ({
                                ...prevState,
                                recordId: "",
                                userName: "",
                                userImage: "",
                                userEmail: "",
                                status: "",
                                supervisorComment: "",
                                reason: "",
                                createAt: new Date(),
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
    </div>
  );
};

export default NotificationPage;
