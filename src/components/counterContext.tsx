'use client'

import { createContext, useEffect, useState } from "react"


export const CounterContext = createContext<{
    counter: number;
    setCounter: (value: number) => void;
}>({
  counter: 0,
  setCounter: () => {},
})



export default function CounterProvider({children}:{children: React.ReactNode}) {
  const [counter, setCounter ] = useState(1);
  const ls = typeof window !== 'undefined' ? window.localStorage : null;

  useEffect(() => {
    if (ls && ls.getItem('counter')){
      setCounter(JSON.parse(ls.getItem('counter') || '1'));
    }
  },[ls]);

  function saveCounterToLocalStorage(counter:number){
    if (ls){
      ls.setItem('counter',JSON.stringify(counter));
    }
  }

  const handleSetCounter = (value: number) => {
    setCounter(value);
    saveCounterToLocalStorage(value);
  }


  return (
    <CounterContext.Provider value ={{ counter, setCounter: handleSetCounter }}>
        {children}
    </CounterContext.Provider>
  )
}
