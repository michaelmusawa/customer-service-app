import ArrowPathIcon from './icons/ArrowPath';
import { lusitana } from '@/app/fonts/fonts';
import clsx from 'clsx';
import { Record } from '@/app/lib/definitions';



export default async function LatestInvoices({records}:{records:Record[] | undefined}) {

  return (
    <div className="flex w-full flex-col md:col-span-4 shadow-md shadow-black/20">
      <h2 className={`${lusitana.className} m-4 text-xl md:text-2xl`}>
        Latest Records      
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">

        <div className="bg-white px-2">
          {records ? records.slice(0,5).map((record, index) => {
            return (
              <div
                key={record.id}
                className={clsx(
                  'flex flex-row items-center justify-between py-4',
                  {
                    'border-t border-t-green-500': index !== 0,
                  },
                )}
              >
                <div className="grid grid-cols-3 gap-10 items-start w-full">
                    <p className="truncate text-sm font-semibold md:text-base ml-10">
                      {record.name}
                    </p>
                    <p className="text-sm text-gray-500 sm:block mx-4 ">
                      {record.service}
                    </p>
                
                <p
                  className={`${lusitana.className} truncate text-sm font-medium md:text-base`}
                >
                  {record.value}
                </p>

                </div>
              </div>
          )}):(
              <p>No Records found</p>
            )
          }
              </div>
        <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">Updated just now</h3>
        </div>
      </div>
    </div>
  );
}


