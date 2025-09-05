import { Card, CardContent } from '../../../../components/ui/card'
import { BookOpen, Mic, Headphones } from 'lucide-react'

const tasks = [
  {
    id: 't1',
    activity: 'Grammar Practice',
    timeEstimate: '20 mins',
    skill: 'Grammar',
    description: 'Master advanced tenses and structures',
    iconColor: 'text-[#FF6B6B]',
    borderColor: 'border-[#FF6B6B]/30'
  },
  {
    id: 't2',
    activity: 'Pronunciation Training',
    timeEstimate: '15 mins',
    skill: 'Speaking',
    description: 'Practice difficult sounds and intonation',
    iconColor: 'text-[#4DABF7]',
    borderColor: 'border-[#4DABF7]/30'
  },
  {
    id: 't3',
    activity: 'Listening Exercise',
    timeEstimate: '25 mins',
    skill: 'Listening',
    description: 'Comprehension with native speakers',
    iconColor: 'text-[#40C057]',
    borderColor: 'border-[#40C057]/30'
  }
]

const SkillIcon = ({ skill, color }: { skill: string; color: string }) => {
  switch (skill.toLowerCase()) {
    case 'grammar':
      return <BookOpen className={`h-6 w-6 ${color}`} />
    case 'speaking':
      return <Mic className={`h-6 w-6 ${color}`} />
    case 'listening':
      return <Headphones className={`h-6 w-6 ${color}`} />
    default:
      return <BookOpen className={`h-6 w-6 ${color}`} />
  }
}

const TodayTask = () => {
  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#2D3748]">Today's Tasks</h2>
        <p className="text-sm text-gray-600">Your learning activities for today</p>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card 
            key={task.id} 
            className={`group overflow-hidden border-l-4 ${task.borderColor} transition-all duration-200 hover:shadow-lg`}
          >
            <CardContent className="flex items-center p-4">
              <div className="flex flex-1 items-center space-x-4">
                <div className="rounded-full bg-gray-50 p-3">
                  <SkillIcon skill={task.skill} color={task.iconColor} />
                </div>
                
                <div>
                  <h3 className="font-medium text-[#2D3748]">{task.activity}</h3>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <p className="mt-1 text-sm font-medium text-gray-500">
                    {task.timeEstimate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default TodayTask