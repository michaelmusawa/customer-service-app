'use client'


import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueData {
  createdAt: Date;
  totalValue: number;
}

export function RevenueBarChart({ revenue }: { revenue: RevenueData[] | undefined}) {
  let formattedData;
  if (revenue){
    formattedData = revenue.map((record) => ({
      date: record?.createdAt ? record.createdAt.toISOString().split('T')[0] : 'N/A',
      totalRevenue: record?.totalValue, 
    }));
  }
  
  return (
    <div style={{ width: '100%', height: 400, boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)' }}>
      <ResponsiveContainer>
        <BarChart
          width={500}
          height={300}
          data={formattedData} 
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="totalRevenue" fill="#047857" /> 
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

