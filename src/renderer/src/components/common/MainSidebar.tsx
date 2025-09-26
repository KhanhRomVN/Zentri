import { useState } from 'react'
import { cn } from '../../shared/lib/utils'
import { Button } from '../ui/button'
import { motion } from 'framer-motion'
import { Mail, Settings, Users } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface MainSidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const menuItems = [
  {
    icon: Mail,
    label: 'Email Manager',
    href: '/',
    description: 'Quản lý email & dịch vụ'
  },
  {
    icon: Users,
    label: 'People Manager',
    href: '/people',
    description: 'Quản lý người dùng'
  },
  {
    icon: Settings,
    label: 'Setting',
    href: '/setting',
    description: 'Cài đặt'
  }
]

const sidebarVariants = {
  hidden: { x: -300, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 20
    }
  }
}

export function MainSidebar({ className }: MainSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [, setActiveItem] = useState<string>(location.pathname)

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className={cn('fixed inset-y-0 left-0 w-72', 'flex flex-col p-6', className)}
    >
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Zentri</h1>
        <p className="text-sm text-text-secondary mt-1">Management System</p>
      </div>

      {/* Menu Items */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href))

          return (
            <div key={item.label}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 rounded-xl py-6 text-base transition-all duration-200',
                  'hover:bg-sidebar-item-hover hover:shadow-sm',
                  isActive
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-md'
                    : 'text-text-primary hover:text-text-primary'
                )}
                onClick={() => {
                  setActiveItem(item.href)
                  navigate(item.href)
                }}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-white' : 'text-primary'
                  )}
                />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{item.label}</span>
                  <span
                    className={cn('text-xs', isActive ? 'text-white/80' : 'text-text-secondary')}
                  >
                    {item.description}
                  </span>
                </div>
              </Button>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
