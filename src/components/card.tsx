import {
    BanknotesIcon,
    InboxIcon,
  } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/fonts/fonts';
import { Record } from '@/app/lib/definitions';
  
  const iconMap = {
    revenue: BanknotesIcon,
    records: InboxIcon,
  };
    
  export function Card({
    title,
    value,
    type,
  }: {
    title: string;
    value: Record[] | undefined;
    type: 'records' | 'revenue';
  }) {
    const Icon = iconMap[type];
  

    return (
      <div className="rounded-xl bg-gradient-to-r from-green-800 to-yellow-600 p-2 shadow-md shadow-black/20 border-b-4 border-yellow-500">
        <div className="flex p-4">
          {Icon ? <Icon className="h-5 w-5 text-gray-100" /> : null}
          <h3 className="ml-2 text-sm font-medium text-gray-100">{title}</h3>
        </div>
  
        {type === 'records' ? (
          <h2
            className={`${lusitana.className} bg-gray-50 truncate rounded-xl px-4 py-8 text-center bold text-4xl max-md:text-xl text-green-800 font-extrabold max-md:font-bold`}
          >
            {value?.length || 0}
          </h2>
        ) : (
          <h2
          className={`${lusitana.className} bg-gray-50 truncate rounded-xl px-4 py-8 text-center bold text-4xl max-md:text-xl text-green-800 font-extrabold max-md:font-bold`}
        >
         Ksh. {value?.[0].totalValue || 0}
        </h2>
        )}
      </div>
    );
  }
  
  