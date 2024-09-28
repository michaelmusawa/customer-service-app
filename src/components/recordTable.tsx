
'use client'

import Link from 'next/link';
import EllipsisIcon from './icons/ellipsisIcon';
import { Record } from '@/app/lib/definitions';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import SearchIcon from './icons/searchIcon';
import DeleteButton from './DeleteButton';
import { deleteRecord } from '@/app/lib/action';
import DropIcon from './icons/downIcon';


export default function RecordsTable( {records, role}:{role: string | undefined, records: Record[] | undefined} ) {
  const searches = ['name','ticket','service','attendant','email'];
  const [searchBy, setSearchBy] = useState('name');

    const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);


  const filteredRecords = records?.filter((record) => {
    const recordDate = new Date(record.recordCreatedAt);
    let matchesSearch;
    if (searchBy == 'name'){
      matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (searchBy == 'ticket'){
      matchesSearch = record.ticket.toLowerCase().includes(searchTerm.toLowerCase());

    }else if (searchBy == 'service') {
      matchesSearch = record.service.toLowerCase().includes(searchTerm.toLowerCase());
    }else if (searchBy == 'attendant'){
      matchesSearch = record.userName.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (searchBy == 'email'){
      matchesSearch = record.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    }
      
    const isWithinDateRange =
      (!startDate || recordDate >= new Date(startDate)) &&
      (!endDate || recordDate <= new Date(endDate));
    return matchesSearch && isWithinDateRange;
  });

  function FormatDate({ date }: { date: Date }) {
    const goodDate = new Date(date);
    const recordDate = goodDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'UTC',
    });
    return (recordDate);
  }



  function ActionMenu({recordId}:{recordId:string}) {
    return (
      <div className="relative group">
        <EllipsisIcon />
        <div className="hidden absolute px-2 -top-4 left-6 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 group-hover:block">
          <div className="py-1">
            <Link 
              className="block px-1 py-1 text-sm text-gray-700 hover:bg-gray-100"
              href={`/dashboard/${role}/records/${recordId}/edit`} >
              Edit
            </Link>
            {role === 'admin' && (
              <div 
              className="block px-1 py-1 text-sm text-red-700 hover:bg-red-100">
              <DeleteButton 
                deleteFunction={() =>{deleteRecord(recordId)}} 
                label={'Delete'} 
                className={'text-sm border-t text-red-500 cursor-pointer py-1'}
              />
            </div>
            )}  
          </div>
        </div>
      </div>
    );
  }

  const exportToExcel = () => { 
     if (filteredRecords) {
      const worksheet = XLSX.utils.json_to_sheet(
        filteredRecords.map((record) => ({
          Ticket: record.ticket,
          Name: record.name,
          Service: record.service,
          Invoice: record.invoice,
          Value: record.value,
          Date: record.createdAt,
          Counter: record.counter,
          Shift: record.shift,
          UserCreated: record.userName, 
          UserEmailCreated: record.userEmail
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');
      XLSX.writeFile(workbook, 'Records.xlsx');
     }
    
  };

  

  return (
    <div className="container mt-8 mx-auto p-4 items-center">
       <div className="mb-4 flex gap-4">
        <div>
        <Link href={`/dashboard/${role}/records/create`}>
          <button className="submit text-sm max-md:text-xs mt-2 rounded-lg">
            Add Record
          </button>
        </Link>
        <button
          onClick={exportToExcel}
          className="w-fit bg-gray-50 hover:bg-green-100 shadow-md max-md:text-xs rounded-lg text-sm mt-2"
        >
          To Excel
        </button>
        </div>
        <div className="flex gap-2 ml-6 bg-gray-50 border p-2 items-center relative">
          <label className='absolute top-0 text-sm text-gray-600'>Filter by</label>
          <div className='relative'>
          <select 
             className='max-w-8 opacity-0 inset-0 cursor-pointer absolute -left-2 top-1'
            id='search'
            value={searchBy}
            onChange={(e) => {setSearchBy(e.target.value)}}>
            {searches.map((search, index) => (
              <option className='text-white'
                id="search" value={search} key={index}>{search}
              </option>
            ))}
          </select>
          <DropIcon className='absolute pointer-events-none -left-2 top-3 z-10 w-[20px] border-none'/>
            <input
              type="text"
              placeholder={`Search by ${searchBy}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border bg-white pl-8 mt-2 ml-3 rounded max-w-60 relative"
            />
            <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          
          <div className='flex max-lg:flex-col gap-2 ml-4 items-center max-w-lg'>
            <div>
            <label className='max-lg:text-sm'>Start</label>
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => setStartDate(e.target.value)}
              className="border px-1 m-1 rounded bg-gray-100"
            />
            </div>
            <div>
            <label className='max-lg:text-sm'>End</label>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value)}
              className="border px-1 m-1 rounded bg-gray-100"
            />
            </div>
            
          </div>
        </div>
        
      </div>
      <div className='overflow-x-auto pr-4'>
      <table className="min-w-full bg-white border border-gray-300  mx-auto">
        <thead className='bg-green-100 text-green-800 max-lg:text-sm max-sm:text-xs'>
          <tr>
            <th className="border px-4 py-2">Ticket</th>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Service Category</th>
            <th className="border px-4 py-2">Service</th>
            <th className="border px-4 py-2">Invoice</th>
            <th className="border px-4 py-2">Value</th>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Counter</th>
            <th className="border px-4 py-2">Shift</th>
            {(role === 'supervisor' || role === 'admin') && (
              <>
              <th className="border px-4 py-2">Attendant</th>
              <th className="border px-4 py-2">Attendant Email</th>
              <th className="border px-4 py-2">Actions</th>
              </>    
            )}
            
          </tr>
        </thead>
        <tbody>
          {filteredRecords ? (filteredRecords?.map((record) => (
            <tr 
              className='max-lg:text-sm max-sm:text-xs hover:bg-gray-50'
              key={record.recordId}>
              <td className="border px-4 py-2">{record.ticket}</td>
              <td className="border px-4 py-2">{record.name}</td>
              <td className="border px-4 py-2">{record.service}</td>
              <td className="border px-4 py-2">{record.subService}</td>
              <td className="border px-4 py-2">{record.invoice}</td>
              <td className="border px-4 py-2">{record.value}</td>
              <td className="border px-4 py-2"><FormatDate date={record.recordCreatedAt} /></td>
              <td className="border px-4 py-2">{record.counter}</td>
              <td className="border px-4 py-2">{record.shift}</td>
              {(role === 'supervisor' || role === 'admin') && (
                <>
                <td className="border px-4 py-2">{record.userName}</td>
                <td className="border px-4 py-2">{record.userEmail}</td>
                <td className="border px-4 py-2">
                <ActionMenu recordId={record.recordId}/>
              </td>
                </>
              )}           
            </tr>
          ))):(<p>No records found!</p>)}
        </tbody>
      </table>
      </div>

      
    </div>
  );
}



