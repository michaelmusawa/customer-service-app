'use client'

import { useState } from "react";

export default function DeleteButton({
    deleteFunction, label, className
    }:{
    deleteFunction: ()=>void,
    label: string,
    className: string
    }) {

    const [showConfirm,setShowConfirm] = useState(false);

    if (showConfirm) {

        return (
            <div className="fixed bg-black/60 inset-0 flex items-center h-full w-full justify-center" style={{ pointerEvents: 'auto' }}>
                <div className="items-center bg-white h-40 w-72 p-4 rounded-lg">
                    <p className="text-center mt-4 text-gray-700">Are you sure you want to <br/> 
                        <span className="text-red-500 font-semibold">delete?</span></p>
                    <div className="flex gap-2 mt-4">
                        <button 
                            className="py-1 text-sm h-fit bg-gray-100"
                            type="button"
                            onClick={() => setShowConfirm(false)}>
                                Cancel
                            </button>
                            <button
                                className="py-1 text-sm text-gray-100 h-fit bg-red-400"
                                onClick={() => {
                                    deleteFunction(); 
                                    setShowConfirm(false);
                                }}
                                type="button"
                            >
                                    Yes,&nbsp;Delete!
                                </button>
                    </div>
                </div>
            </div>
        )
        }
        return(
            <div 
                className={className}
                onClick={() => {setShowConfirm(true) }}>
                    {label}
                </div>
        )
    }
