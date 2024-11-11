'use client'


// components/ShiftComparisonRadarChart.tsx
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

// Register chart components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// Define types for the data props
interface RadarChartProps {
  morningShift: number[];
  eveningShift: number[];
}

export default function RadarChart ({
  morningShift,
  eveningShift,
}: RadarChartProps
){
  const chartData = {
    labels: ['Invoices', 'Receipts', 'Inquiries'],
    datasets: [
      {
        label: 'Morning Shift',
        data: morningShift,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Evening Shift',
        data: eveningShift,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Comparison of Morning and Evening Shifts' },
    },
    scales: {
      r: {
        beginAtZero: true,
        suggestedMax: Math.max(...morningShift, ...eveningShift) + 5, // adjust maximum based on data
      },
    },
  };

  return (
    <div>
      <Radar data={chartData} options={options} />
    </div>
  );
};


