import { Card } from '@/components/card';
import { lusitana } from '../../fonts/fonts';
import {
  fetchRecordsByAttendant,
  fetchRecords,
  getUserById,
} from '../../lib/action';
import { auth } from '../../../../auth';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import DoughnutChart from '@/components/dashboard/Doughnut';
import BarChart from '@/components/dashboard/bar-graph';
import RadarChart from '@/components/dashboard/Radar';


 
export default async function Page() {
  const session = await auth();
  if (!session){
    return redirect('/login');
  }

  const user = await getUserById(session.user.id);
  let passwordsMatch;
  if (user) {
    passwordsMatch = await bcrypt.compare(user.email, user.password);
  }

  if (passwordsMatch) {
    return redirect(`/dashboard/${user?.role}/profile?resetPass=true`) 
  }

  let records;


  if (session?.user.role == 'admin' || session?.user.role == 'supervisor') {
      records = await fetchRecords();
      console.log("The records:", records);
  } else if (session?.user.role == 'attendant'){
      records = await fetchRecordsByAttendant(session?.user.id);
  }

  const receipts = records?.filter((record) => record.recordType === 'receipt');
  const invoices = records?.filter((record) => record.recordType === 'invoice');
  const inquiries = records?.filter((record) => record.recordType === 'inquiries');

  // Morning shift no. of receipts and invoices

  const morningReceipts = receipts?.filter((receipt) => receipt.shift === 'morning')
  const morningInvoices = invoices?.filter((invoice) => invoice.shift === 'morning')

  


  function Capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  
  const data = {
    labels: ['Invoices', 'Inquires', 'Receipts'],
    values: [invoices?.length, inquiries?.length, receipts?.length], // Example data distribution
  };

  const labels = ['January', 'February', 'March', 'April'];

  const dataset1 = {
    label: 'Invoices',
    values: [40, 55, 60, 75],
    backgroundColor: 'rgba(75, 192, 192, 0.5)',
  };

  const dataset2 = {
    label: 'Receipts',
    values: [50, 60, 70, 85],
    backgroundColor: 'rgba(255, 205, 86, 0.5)',
  };

  const morningShiftData = [morningInvoices?.length ?? 0, morningReceipts?.length ?? 0, 0]; // Number of invoices, receipts, inquiries in morning shift
  const eveningShiftData = [
    ((invoices?.length ?? 0) - (morningInvoices?.length ?? 0)),
    ((receipts?.length ?? 0) - (morningReceipts?.length ?? 0)),
    0
  ]; 
 
  return (
    <main>
      <div className={`${lusitana.className} h-28  mb-16 max-lg:max-w-xs text-lg md:text-xl lg:text-2xl text-white bg-gradient-to-r from-green-800 to-yellow-600 p-4 rounded-lg shadow-lg`}>
        <div className='flex justify-between grow'>
          <h1>{Capitalize(`${session?.user.role} dashboard`)} </h1> 
          <div className='text-sm font-bold ml-10'>Monthly analysis</div>
        </div>
        
        
          <div className='flex grow rounded-lg justify-center mt-3 shadow-lg'>
            <div className="grid grid-cols-6 gap-6 grow">
                <Card
                  title="Clients served"
                  value={records}
                  type="records"
                />
                <Card
                  title="Number of receipts"
                  value={receipts}
                  type="records"
                />
                <Card
                  title="Number of invoices"
                  value={invoices}
                  type="records"
                />
                <Card
                  title="Number of inquiries"
                  value={inquiries}
                  type="records"
                />
                <Card
                  title="Total amount receipts"
                  value={receipts}
                  type="receipt"
                />
                <Card
                  title="Total amount invoices"
                  value={invoices}
                  type="invoice"
                />         
              </div>
          </div>

      </div>

      <div className='grid grid-cols-3 grow w-full gap-6 max-lg:flex-col border-2 items-center rounded-lg'>
        <div>
            <DoughnutChart data={data} />
        </div>
        <div>
          <BarChart labels={labels} dataset1={dataset1} dataset2={dataset2} />
        </div>
        <div>     
          <RadarChart morningShift={morningShiftData} eveningShift={eveningShiftData} />
        </div> 
      </div> 
    </main>
  );
}