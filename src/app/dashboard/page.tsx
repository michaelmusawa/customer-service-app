import { Card } from '@/components/card';
import LatestInvoices from '@/components/latest-invoices';
import { lusitana } from '../fonts/fonts';
import {
  fetchRecordsByAttendant,
  fetchRecords,
  fetchDailyRevenue,
  fetchDailyRevenueByAttendant,
} from '../lib/action';
import { auth } from '../../../auth';
import { RevenueBarChart } from '@/components/dashboard/bar-graph';
import { redirect } from 'next/navigation';


 
export default async function Page() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }
  let records;
  let revenue;

  if (session?.user.role == 'admin' || session?.user.role == 'supervisor') {
      records = await fetchRecords();
      revenue = await fetchDailyRevenue();
  } else if (session?.user.role == 'attendant'){
      records = await fetchRecordsByAttendant(session?.user.id);
      revenue = await fetchDailyRevenueByAttendant(session?.user.id)
  }


  function Capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  
 
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-lg md:text-xl lg:text-2xl`}>
        {Capitalize(`${session?.user.role} dashboard`)}
      </h1>
      <div className='flex grow w-full gap-6 max-lg:flex-col'>
        <div className="grid grid-cols-2 gap-6 min-h-40 grow">
          <Card title="Total Records" value={records} type="records" />
          <Card
            title="Total Revenue"
            value={records}
            type="revenue"
          />
          <div className='col-span-2'><RevenueBarChart revenue={revenue} /></div>
        </div>
        <div className="flex">     
          <LatestInvoices records={records} />
        </div>
      </div>   
    </main>
  );
}