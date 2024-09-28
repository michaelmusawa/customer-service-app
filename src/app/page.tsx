import Logo from '@/components/logo';
import ArrowRightIcon from '@/components/icons/arrowRight';
import Link from 'next/link';
import Image from 'next/image';

export default function Page() {
  return (
    <main className="flex  flex-col p-6">
      <div className="flex h-20 shrink-0 rounded-lg bg-green-800 md:h-44">
        <Logo />
      </div>
      <div className="mt-10 flex grow flex-col gap-4 max-md:flex-col-reverse md:flex-row">
        <div className="flex flex-col justify-center m-auto gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
          <p className={`text-xl text-gray-800 max-md:text-center md:text-3xl md:leading-normal`}>
            <strong className='text-yellow-600'>Nairobi City County.</strong><br/> 
            Application for Customer Service Management.  
          </p>
          <Link
            href="/login"
            className="flex items-center max-md:m-auto gap-5 self-start rounded-lg bg-green-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-900 md:text-base"
          >
            <span>Log in</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>
        <div className="flex max-h-svh w-auto items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12 bg-cover bg-center"
            style={{ backgroundImage: `url('/images/nairobibackgroung.jpg')` }}>
          <Image
            src={"/images/customerService.png"}
            width="2000"
            height="2000"
            alt=" customer service image" 
            className='max-h-96 w-auto transform rotate-y-180'
          />
        </div>
      </div>
    </main>
  );
}
