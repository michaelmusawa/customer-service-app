'use client'

import { editUser } from "@/app/lib/action";
import { useState } from "react";
import { useFormStatus, useFormState } from "react-dom"; // Correct the import path based on your project structure
import { User, UserState } from "@/app/lib/definitions";
import { AtSymbolIcon, KeyIcon } from '@heroicons/react/24/outline';
import UserIcon from "../icons/userIcon";
import toast from 'react-hot-toast';
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus(); 
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Updating...' : 'Update'}
    </button>
  );
}

export default function ProfileForm({ user, type }: { user: User | undefined, type: string}) {

  const [editedUser, setEditedUser] = useState<User | null>(user || null);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Create image preview URL
    }
  };

  function Edit() {
    const initialState: UserState = { response: null, message: null, errors: {} };
    const editUserById = editUser.bind(null, editedUser?.id || '');
    const [editState, formAction] = useFormState(editUserById, initialState);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append('name', editedUser?.name || '');
      formData.append('email', editedUser?.email || '');
      formData.append('password', editedUser?.password || '');
      if (imageFile) formData.append('image', imageFile);

      await formAction(formData);
    };
    
    // Toast messages
    if (editState?.message) {
      if (editState?.response === 'ok') {
        toast.success(editState.message);
        setEditedUser(null);
      } else if (editState?.response === null) {
        toast.error(editState.message);
      }
    } else if (editState?.state_error) {
      toast.error(editState.state_error);
    } else {
      toast.dismiss();
    }

    return (
      <form onSubmit={handleSubmit}>
        <FormInputs label="Update Profile" />
      </form>
    );
  }

  return (
    <section className="mt-8 max-w-xl mx-auto mb-20">
      {editedUser ? (
        <Edit />
      ) : (
        <div className="max-w-sm mx-auto mt-10">
          <div className="bg-gray-50 shadow-md rounded-lg p-6">
            <div className="flex flex-col items-center">
              <Image
                src={imagePreview || "/images/avator.jpg"} 
                width={100}
                height={100}
                alt="Profile Image"
                className="w-36 h-36 rounded-full mb-8 bg-gray-50"
              />
              <h1 className="text-2xl font-semibold mb-8">{user?.name}</h1>
              <h1 className="text-gray-500 mb-8">{user?.email}</h1>
              <button
                onClick={() => setEditedUser(user!)}
                className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  function FormInputs({ label }: { label: string }) {
    return (
      <div className="gap-2 items-end">
        <h2 className="mt-8 text-xl text-gray-500 text-center mb-6">{label}</h2>
        <div className="flex">
          <div className="w-1/3 h-2/3 mx-auto relative">
            <Image 
              src={imagePreview || '/images/avator.jpg'}
              width={100}
              height={100}
              alt="profile image"
              className="m-auto border border-red-500"
            />
            <label className="text-gray-700 text-sm ml-11 bottom-[5px] px-1 border rounded-lg pointer-events-none absolute">
              Choose Image
            </label>
            <input 
              className="p-2 cursor-pointer opacity-0 ml-10 inset-0"
              type="file" 
              name="image"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="grow">
            <input 
              type="hidden"
              id="name"
              name="role"
              defaultValue={type || ''}
              aria-describedby="name-error"
            />
            <div className="relative">
              <input 
                type="text"
                id="name"
                placeholder="User Name"
                name="name"
                defaultValue={editedUser?.name || ''}
                required
                aria-describedby="name-error"
                className="p-2 pl-8"
              />
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div className="relative">
              <input 
                type="email"
                id="email"
                placeholder="User Email"
                defaultValue={editedUser?.email || ''}
                disabled
                className="p-2 pl-8 my-6"
                aria-describedby="email-error"
              />
              <input type="hidden" name="email" defaultValue={editedUser?.email || ''} />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div className="relative">
              <input 
                type="password"
                id="password"
                placeholder="Password"
                name="password"
                defaultValue=""
                required
                aria-describedby="password-error"
                className="p-2 pl-8 my-6"
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div className="pb-2 flex gap-2 my-6">
              <SubmitButton />
              {editedUser && (
                <button type="button" onClick={() => setEditedUser(null)}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
