'use client'

// components/BarChart.tsx
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';


// Register required chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Define the types for the data prop
interface BarChartProps {
  labels: string[];
    dataset1: {
      label: string;
      values: number[];
      backgroundColor?: string;
    };
    dataset2: {
      label: string;
      values: number[];
      backgroundColor?: string;
    };
}

export default function BarChart ({ labels, dataset1, dataset2 }: BarChartProps){
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: dataset1.label,
        data: dataset1.values,
        backgroundColor: dataset1.backgroundColor || 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      },
      {
        label: dataset2.label,
        data: dataset2.values,
        backgroundColor: dataset2.backgroundColor || 'rgba(255, 205, 86, 0.2)',
        borderColor:  'rgb(255, 205, 86)',
        borderWidth: 1
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Revenue Vs Invoices' },
    },
  };

  return (
    <div>
      <Bar data={chartData} options={options} />
    </div>
  );
};


