import { Outlet } from 'react-router-dom'
import { MainSidebar } from '../../components/common/MainSidebar'

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-sidebar-background">
      <MainSidebar />

      {/* Main content */}
      <div className="flex-1 pl-72 flex flex-col min-h-screen h-screen p-4 ">
        <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-background rounded-xl">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default MainLayout
