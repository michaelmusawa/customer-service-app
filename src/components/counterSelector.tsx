'use client'

import { useContext } from 'react';
import { CounterContext } from './counterContext';

export default function CounterSelector() {
  const { counter, setCounter } = useContext(CounterContext);

  return (
    <div className="flex items-center justify-center gap-1">
      <label htmlFor="counter" className="block text-sm max-lg:text-xs font-medium text-gray-100">
        Counter:
      </label>
      <select
        className="text-gray-100 p-1 max-lg:p-0 text-center bg-green-800"
        id="counter"
        value={counter} 
        name="counter"
        onChange={(e) => setCounter(Number(e.target.value))} 
      >
        {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
          <option className="bg-green-50 text-green-700" key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
    </div>
  );
}
