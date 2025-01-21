"use client";

import { OnlineUser, User } from "@/app/lib/definitions";
import ArchiveModel from "@/components/ArchiveModel";
import EllipsisIcon from "@/components/icons/ellipsisIcon";
import ShiftAndCounterModel from "@/components/ShiftAndCounterModel";
import clsx from "clsx";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function UsersTable({
  users,
  onlineUsers,
  type,
  loggedInUser,
  station,
}: {
  loggedInUser: string;
  type: string;
  onlineUsers: OnlineUser[] | undefined;
  users: User[] | undefined;
  station: string | undefined;
}) {
  interface ShiftAndCounter {
    userId: string;
    shift: string;
    counter: number;
  }
  
  let localUsers;
  if (type === 'admin') {
    localUsers = users;
  } else {
    localUsers = users?.filter(user => user.station === station );
  }
  

  const [view, setView] = useState<string>("active");
  const [shiftAndCounter, setShiftAndCounter] = useState<ShiftAndCounter>({
    userId: "",
    shift: "morning",
    counter: 1,
  });
  const [showArchiveModel, setShowArchiveModel] = useState<boolean>(false);
  const [userArchivedId, setUserArchivedId] = useState<string>("");
  const [showShiftAndCounterModel, setShowShiftAndCounterModel] =
    useState<boolean>(false);
  const [editShiftAndCounter, setEditShiftAndCounter] =
    useState<boolean>(false);
  const [editShiftAndCounterId, setEditShiftAndCounterId] =
    useState<string>("");

  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const archive = searchParams.get("archive");
  const activate = searchParams.get("activate");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  let totalPages = 0;

  let viewUsers: User[] | undefined = [];
  useEffect(() => {
    if (id) {
      setView("shift & counter");
      setEditShiftAndCounter(true);
      setEditShiftAndCounterId(id);
    }
  }, [id]);

  useEffect(() => {
    if (archive === "true") {
      setShowArchiveModel(false);
      toast.success("Archive successfully");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (activate === "true") {
      setShowArchiveModel(false);
      toast.success("Activated successfully");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [archive, activate]);

  if (view === "active" || view === "shift & counter") {
    viewUsers = localUsers?.filter((user) => user.status === null);
  } else if (view === "archive") {
    viewUsers = localUsers?.filter((user) => user.status === "archive");
  } else if (view === "online") {
    viewUsers = localUsers?.filter((user) =>
      onlineUsers?.some((onlineUser) => onlineUser.userId === user.id)
    );
  } else if (view === "offline") {
    viewUsers = localUsers?.filter(
      (user) =>
        !onlineUsers?.some((onlineUser) => onlineUser.userId === user.id)
    );
  }

  // Calculate total pages
  if (viewUsers) {
    totalPages = Math.ceil(viewUsers.length / rowsPerPage);
  }

  // Get the current rows to display
  const currentRows = viewUsers?.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  function ActionMenu({ userId }: { userId: string }) {
    return (
      <div className="relative group">
        <EllipsisIcon />
        <div className="hidden absolute px-2 -top-4 left-6 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 group-hover:block">
          <div className="py-1">
            <Link
              className="block px-1 py-1 text-sm text-gray-700 hover:bg-gray-100"
              href={`/dashboard/${loggedInUser}/${type}s/${userId}/edit`}
            >
              Edit
            </Link>

            {showArchiveModel && userArchivedId ? (
              <ArchiveModel
                userId={userArchivedId}
                role={type}
                status="archive"
                setShowArchiveModel={setShowArchiveModel}
                setUserArchivedId={setUserArchivedId}
              />
            ) : (
              <div>
                <button
                  className="block border-0 px-1 py-1 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setShowArchiveModel(true), setUserArchivedId(userId);
                  }}
                >
                  Archive
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
        <div className="flex grow items-center border bg-gray-100 rounded-lg mt-8">
          <ul className="flex w-full justify-evenly">
            <li>
              <button
                onClick={() => {
                  setView("active");
                }}
                className={clsx(
                  "!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100",
                  {
                    "bg-green-100 text-green-800": view === "active",
                  }
                )}
              >
                Active
              </button>
            </li>
            <li>
              <button
                onClick={() => setView("archive")}
                className={clsx(
                  "!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100",
                  {
                    "bg-green-100 text-green-800": view === "archive",
                  }
                )}
              >
                Archive
              </button>
            </li>
            <li>
              <button
                onClick={() => setView("online")}
                className={clsx(
                  "!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100",
                  {
                    "bg-green-100 text-green-800": view === "online",
                  }
                )}
              >
                Online
              </button>
            </li>

            <li>
              <button
                onClick={() => setView("offline")}
                className={clsx(
                  "!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100",
                  {
                    "bg-green-100 text-green-800": view === "offline",
                  }
                )}
              >
                Offline
              </button>
            </li>
            {loggedInUser === "supervisor" && (
              <li>
                <button
                  onClick={() => setView("shift & counter")}
                  className={clsx(
                    "!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100",
                    {
                      "bg-green-100 text-green-800": view === "shift & counter",
                    }
                  )}
                >
                  Shift & counter
                </button>
              </li>
            )}
          </ul>
        </div>
        {type === "attendant" ? (
          <h2 className="mt-8 text-sm text-gray-500">Existing Billers</h2>
        ) : (
          <h2 className="mt-8 text-sm text-gray-500">{`Existing ${type}:`}</h2>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300  mx-auto">
            <thead className="bg-green-100 text-green-800 max-lg:text-sm max-sm:text-xs">
              <tr>
                <th className="border px-4 py-2">No.</th>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Station</th>
                {(view === "active" || view === "archive") && (
                  <th className="border px-4 py-2">Account status</th>
                )}
                {(view === "online" || view === "offline") && (
                  <th className="border px-4 py-2">Online status</th>
                )}

                {view === "shift & counter" && (
                  <>
                    <th className="border px-4 py-2">Shift</th>
                    <th className="border px-4 py-2">Counter</th>
                  </>
                )}
                {(view === "active" ||
                  view === "archive" ||
                  view === "shift & counter") && (
                  <th className="border px-4 py-2">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentRows?.length ? (
                currentRows.map((user, index) => (
                  <tr
                    key={index}
                    className="max-lg:text-sm max-sm:text-xs hover:bg-gray-50"
                  >
                    <td className="border px-4 py-2">
                      {" "}
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="border px-4 py-2">{user.name}</td>
                    <td className="border px-4 py-2">{user.email}</td>
                    <td className="border px-4 py-2">{user.station}</td>
                    {view === "archive" && (
                      <td className="border px-4 py-2">archived</td>
                    )}
                    {view === "active" && (
                      <td className="border px-4 py-2">active</td>
                    )}
                    {view === "online" && (
                      <td className="border px-4 py-2">online</td>
                    )}
                    {view === "offline" && (
                      <td className="border px-4 py-2">offline</td>
                    )}

                    {loggedInUser === "supervisor" &&
                      view === "shift & counter" && (
                        <>
                          <td className="border px-4 py-2">
                            {editShiftAndCounter &&
                            editShiftAndCounterId === user.id ? (
                              <select
                                className="border-0 !m-auto bg-transparent text-gray-700"
                                name="shift"
                                id="shift"
                                value={shiftAndCounter.shift}
                                onChange={(e) =>
                                  setShiftAndCounter((prev) => ({
                                    ...prev,
                                    shift: e.target.value,
                                  }))
                                }
                              >
                                <option value="shift 1">Shift 1</option>
                                <option value="shift 2">Shift 2</option>
                              </select>
                            ) : (
                              <span>{user.shift ?? "Not assigned"}</span>
                            )}
                          </td>
                          <td className="border px-4 py-2">
                            {editShiftAndCounter &&
                            editShiftAndCounterId === user.id ? (
                              <select
                                className="border-0 bg-transparent p-0 !max-w-10 m-auto text-gray-700"
                                name="counter"
                                value={shiftAndCounter.counter}
                                onChange={(e) =>
                                  setShiftAndCounter((prev) => ({
                                    ...prev,
                                    counter: +e.target.value,
                                  }))
                                }
                                id="counter"
                              >
                                {Array.from(
                                  { length: 20 },
                                  (_, i) => i + 1
                                ).map((counter) => (
                                  <option
                                    key={counter}
                                    value={counter}
                                    className="!max-w-[0.3px]"
                                  >
                                    {counter}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span>{user.counter ?? "Not assigned"}</span>
                            )}
                          </td>
                        </>
                      )}
                    {view !== "online" && view !== "offline" && (
                      <td className="border px-4 py-2">
                        {view === "shift & counter" ? (
                          editShiftAndCounter &&
                          editShiftAndCounterId === user.id ? (
                            showShiftAndCounterModel ? (
                              <ShiftAndCounterModel
                                userId={user.id}
                                counter={shiftAndCounter.counter}
                                shift={shiftAndCounter.shift}
                                role={type}
                                setShowShiftAndCounterModel={
                                  setShowShiftAndCounterModel
                                }
                                setEditShiftAndCounter={setEditShiftAndCounter}
                              />
                            ) : (
                              <button
                                onClick={() => {
                                  setShowShiftAndCounterModel(true);
                                }}
                                className="!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100"
                              >
                                Apply
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => {
                                setEditShiftAndCounter(true);
                                setEditShiftAndCounterId(user.id);
                              }}
                              className="!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100"
                            >
                              Edit
                            </button>
                          )
                        ) : view === "archive" ? (
                          showArchiveModel && userArchivedId ? (
                            <ArchiveModel
                              userId={userArchivedId}
                              role={type}
                              status="activate"
                              setShowArchiveModel={setShowArchiveModel}
                              setUserArchivedId={setUserArchivedId}
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setShowArchiveModel(true),
                                  setUserArchivedId(user.id);
                              }}
                              className="!border-0 py-2 px-4 text-md bg-gray-50 hover:cursor-pointer hover:bg-green-100"
                            >
                              Activate
                            </button>
                          )
                        ) : (
                          <ActionMenu userId={user.id} />
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : type === "attendant" ? (
                <p>{`No billers found`}</p>
              ) : (
                <p>{`No ${type} found`}</p>
              )}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="grid grid-cols-3 max-w-screen-md items-center mx-auto gap-10 mt-4">
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <p className="text-gray-700 text-center">
                Page {currentPage} of {totalPages}
              </p>
              <button
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
