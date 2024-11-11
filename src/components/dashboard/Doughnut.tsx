'use client'
import React from 'react'
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';


ChartJS.register(ArcElement, Tooltip, Legend);

export default function DoughnutChart({data}:{data: any}) {
    const chartData = {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99'],
            hoverBackgroundColor: ['#ff6666', '#3399ff', '#66ff66', '#ff9966'],
            borderWidth: 7,
          },
        ],
      };
    
      const options = {
        cutout: '40%', // Adjust for the "doughnut" effect
      };
       
  return (
    <div className='max-h-96'>
        <Doughnut data={chartData} options={options} />
    </div>
  )
}
