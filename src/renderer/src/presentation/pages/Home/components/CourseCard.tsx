import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'

interface Course {
  id: string
  title: string
  overview: string
  image_urls: string[]
  band: string
  skills: string[]
}

interface CourseCardProps {
  course: Course
  onClick: (courseId: string) => void
}

const CourseCard = ({ course, onClick }: CourseCardProps) => {
  const colors = [
    'bg-[#FF69B4]/20 text-[#FF69B4]',
    'bg-[#4A90E2]/20 text-[#4A90E2]',
    'bg-[#3CB371]/20 text-[#3CB371]',
    'bg-[#9370DB]/20 text-[#9370DB]',
    'bg-[#FF7F50]/20 text-[#FF7F50]',
    'bg-[#FFD700]/20 text-[#FFD700]'
  ]

  return (
    <Card 
      className="group relative flex h-full flex-col overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#52aaa5]/20 hover:ring-2 hover:ring-[#52aaa5]"
      onClick={() => onClick(course.id)}
    >
      <div className="relative">
        <img
          src={course.image_urls[0]}
          alt={course.title}
          className="aspect-square w-full rounded-t-xl object-cover"
        />
        <Badge 
          variant="secondary" 
          className="absolute right-3 top-3 bg-[#52aaa5] text-xs font-medium text-white"
        >
          {course.band}
        </Badge>
      </div>
      <CardHeader className="flex-grow space-y-2 p-4 pb-2">
        <CardTitle className="line-clamp-1 text-lg font-semibold text-[#2D3748]">
          {course.title}
        </CardTitle>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {course.skills.map((skill, index) => (
            <Badge 
              key={skill} 
              variant="secondary" 
              className={`${colors[index % colors.length]} shrink-0 text-xs font-medium`}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="line-clamp-2 text-sm text-[#718096]">
          {course.overview}
        </p>
      </CardContent>
    </Card>
  )
}

export default CourseCard