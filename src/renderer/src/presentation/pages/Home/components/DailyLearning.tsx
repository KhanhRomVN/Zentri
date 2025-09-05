import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Clock, BookOpen, Mic, Headphones } from 'lucide-react'
import { dailyLearningData } from '../data/mockData'

const SkillIcon = ({ skill }: { skill: string }) => {
  switch (skill.toLowerCase()) {
    case 'vocabulary':
      return <BookOpen className="h-5 w-5 text-purple-500" />
    case 'speaking':
      return <Mic className="h-5 w-5 text-blue-500" />
    case 'listening':
      return <Headphones className="h-5 w-5 text-green-500" />
    default:
      return <BookOpen className="h-5 w-5 text-gray-500" />
  }
}

const DailyLearning = () => {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-[#2D3748]">Today's Learning Plan</h2>
        <p className="text-sm text-gray-600">Complete these activities to stay on track</p>
      </div>

      <div className="grid gap-4">
        {dailyLearningData.map((activity) => (
          <Card key={activity.id} className="group transition-all duration-200 hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-gray-100 p-3">
                  <SkillIcon skill={activity.skill} />
                </div>
                
                <div>
                  <h3 className="font-medium text-[#2D3748]">{activity.activity}</h3>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{activity.timeEstimate}</span>
                  </div>
                </div>
              </div>

              <Button 
                className="bg-white text-[#52aaa5] shadow-sm transition-all duration-200 hover:bg-[#52aaa5] hover:text-white group-hover:shadow-md"
              >
                Start
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <Button 
          variant="outline" 
          className="border-[#52aaa5] text-[#52aaa5] hover:bg-[#52aaa5] hover:text-white"
        >
          View Full Schedule
        </Button>
      </div>
    </div>
  )
}

export default DailyLearning