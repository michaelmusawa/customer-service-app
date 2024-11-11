import {
    BanknotesIcon,
    InboxIcon,
  } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/fonts/fonts';
import { Record } from '@/app/lib/definitions';
  
  const iconMap = {
    receipt: BanknotesIcon,
    invoice: BanknotesIcon,
    records: InboxIcon,
  };
    
  export function Card({
    title,
    value,
    type,
  }: {
    title: string;
    value: Record[] | undefined;
    type: 'records' |'invoice' | 'receipt';
  }) {
    const Icon = iconMap[type];
  

    return (
      <div className="rounded-xl border border-gray-800 bg-gray-300">
        <div className="flex p-2">
          {Icon ? <Icon className="h-5 w-5 text-gray-800" /> : null}
          <h3 className="ml-2 text-sm font-medium text-gray-800">{title}</h3>
        </div>
  
        {type === 'records' ? (
          <h2
            className={`${lusitana.className} bg-gray-50 truncate rounded-xl px-4 py-2 text-center bold text-4xl max-md:text-xl text-green-800 font-extrabold max-md:font-bold`}
          >
            {value?.length || 0}
          </h2>
        ) : (
          <h2
          className={`${lusitana.className} bg-gray-50 truncate rounded-xl px-4 py-2 text-center bold text-4xl max-md:text-xl text-green-800 font-extrabold max-md:font-bold`}
        >
          {type === 'receipt' ? (
            <>
            <span className='max-xl:hidden'>Ksh.</span> {value?.[0].receiptTotal || 0}
            </>
            
          ):(
            <>
            <span className='max-xl:hidden'>Ksh.</span> {value?.[0].invoiceTotal || 0}
            </>
          )}
         
        </h2>
        )}
      </div>
    );
  }
  
  