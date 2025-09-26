import { Outlet } from 'react-router-dom'
import { MainSidebar } from '../../components/common/MainSidebar'

const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-sidebar-background">
      <MainSidebar />

      {/* Main content */}
      <div className="flex-1 pl-72 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 min-h-0 p-4 bg-background rounded-xl overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default MainLayout
