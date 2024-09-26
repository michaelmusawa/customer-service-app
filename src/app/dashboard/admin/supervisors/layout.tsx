
import Users from '../_components/users';

export default function Layout({ children }: { children: React.ReactNode }) {
  const loggedInUser = 'admin'
    

  return (
    <div>
        <div className='max-w-2xl mx-auto'>
            {children}
            <Users type={'supervisor'} loggedInUser={loggedInUser}/>
        </div>
  </div>
  )
}
