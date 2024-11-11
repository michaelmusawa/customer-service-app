import type { Metadata } from "next";
import { inter } from "./fonts/fonts";
import "./globals.css";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import UserActions from "@/components/userActions";




export const metadata: Metadata = {
  title: "Customer Service App",
  description: "Record management for NCC customer service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="en">
       <body className={`${inter.className} antialiased relative`}>
        <Toaster />
          <div className="h-14 w-auto flex justify-between grow">
            <Image 
              src={'/images/nav.webp'} 
              alt={'County Logo'} 
              width={257} 
              height={83} 
              className="transform rotate-y-180"
            />  
            <UserActions />
            
          </div>
          <div className="h-4 w-full bg-green-800 border-b-4 border-yellow-500 "></div>
            {children}
            <div className="h-14 w-full items-center bg-green-800 border-b-8 border-yellow-500 fixed bottom-1 left-0">
                <p className="text-white text-center mt-4">&copy; 2024 All rights reserved.</p>
            </div>
        </body>
    </html>
  );
}
