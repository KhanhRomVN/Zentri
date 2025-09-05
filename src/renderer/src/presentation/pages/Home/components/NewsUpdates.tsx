import { Card, CardContent } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Bell, Sparkles, Calendar } from 'lucide-react'
import { newsUpdatesData } from '../data/mockData'

interface NewsTypeConfig {
  icon: typeof Bell | typeof Sparkles | typeof Calendar
  color: string
  bgColor: string
  label: string
}

const newsTypeConfigs: Record<string, NewsTypeConfig> = {
  feature: {
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    label: 'New Feature'
  },
  course: {
    icon: Bell,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    label: 'New Course'
  },
  event: {
    icon: Calendar,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    label: 'Upcoming Event'
  }
}

const NewsUpdates = () => {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-2xl font-semibold text-[#2D3748]">News & Updates</h2>
      
      <div className="grid gap-4">
        {newsUpdatesData.map((news) => {
          const config = newsTypeConfigs[news.type]
          const Icon = config.icon
          
          return (
            <Card 
              key={news.id}
              className="group transition-all duration-200 hover:shadow-md"
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className={`rounded-full ${config.bgColor} p-3`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>

                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge 
                      variant="secondary"
                      className={`${config.bgColor} ${config.color}`}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(news.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <h3 className="mb-1 font-medium text-[#2D3748]">
                    {news.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {news.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default NewsUpdates