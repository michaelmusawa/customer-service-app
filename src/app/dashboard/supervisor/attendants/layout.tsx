
import Users from "../../admin/_components/users"

export default function Layout({ children }: { children: React.ReactNode }) {
  const loggedInUser = 'supervisor'
    

  return (
    <div>
        <div className='max-w-2xl mx-auto'>
            {children}
            <Users type={'attendant'} loggedInUser={loggedInUser} />
        </div>
  </div>
  )
}
