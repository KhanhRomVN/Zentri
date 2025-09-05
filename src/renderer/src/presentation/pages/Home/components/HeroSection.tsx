import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { userProgressData } from '../data/mockData'
import { Clock, Flame, BookOpen, Target } from 'lucide-react'

const HeroSection = () => {

  return (
    <div className="relative mb-8 overflow-hidden rounded-xl">
      {/* Content */}
      <div className="relative">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-[#2D3748]">Welcome Back!</h1>
          <p className="text-lg text-gray-600">Ready to continue your learning journey?</p>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#52aaa5]/10 p-4 transition-all duration-200 hover:shadow-md">
            <div className="mb-2 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-[#52aaa5]" />
              <span className="text-sm text-[#2D3748]">Today's Learning</span>
            </div>
            <p className="text-2xl font-bold text-[#52aaa5]">{userProgressData.todayLearned} mins</p>
          </div>

          <div className="rounded-xl bg-orange-500/10 p-4 transition-all duration-200 hover:shadow-md">
            <div className="mb-2 flex items-center">
              <Flame className="mr-2 h-5 w-5 text-orange-500" />
              <span className="text-sm text-[#2D3748]">Streak</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{userProgressData.streakDays} days</p>
          </div>

          <div className="rounded-xl bg-purple-500/10 p-4 transition-all duration-200 hover:shadow-md">
            <div className="mb-2 flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-purple-500" />
              <span className="text-sm text-[#2D3748]">Total Vocabulary</span>
            </div>
            <p className="text-2xl font-bold text-purple-500">{userProgressData.totalVocabulary}</p>
          </div>
        </div>

        {/* Current Lesson Overview */}
        {userProgressData.currentLesson && (
          <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md">
            <div className="flex">
              {/* Left side - Square Image */}
              <div className="relative h-64 w-64 flex-shrink-0">
                <img
                  src={userProgressData.currentLesson.imageUrl}
                  alt={userProgressData.currentLesson.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Right side - Content */}
              <div className="flex-1 p-4">
                <h2 className="mb-2 text-2xl font-bold text-[#2D3748]">
                  {userProgressData.currentLesson.course}
                </h2>
                
                <div className="mb-4">
                  <h3 className="mb-2 text-lg font-semibold text-[#2D3748]">
                    {userProgressData.currentLesson.title}
                  </h3>
                  <p className="text-sm text-gray-600">{userProgressData.currentLesson.overview}</p>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {userProgressData.currentLesson.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-[#52aaa5]/10 text-[#52aaa5]"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Target className="mr-2 h-4 w-4" />
                    <span>Bài học tiếp theo: {userProgressData.currentLesson.nextMilestone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>Last studied {userProgressData.currentLesson.lastStudied}</span>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full bg-[#52aaa5] text-white hover:bg-[#52aaa5]/90"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HeroSection