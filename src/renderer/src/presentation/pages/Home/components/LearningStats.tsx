import { Card, CardContent } from '../../../../components/ui/card'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { learningStatsData } from '../data/mockData'

interface StudyTimeData {
  day: string
  minutes: number
}

const LearningStats = () => {
  const data = learningStatsData.weeklyStudyTime
  const minValue = Math.min(...data.map(item => item.minutes))
  const maxValue = Math.max(...data.map(item => item.minutes))
  const totalMinutes = data.reduce((sum, item) => sum + item.minutes, 0)
  const averageMinutes = Math.round(totalMinutes / data.length)

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-semibold text-[#2D3748]">Learning Statistics</h2>
        <p className="text-sm text-gray-600">
          You've studied for a total of {totalMinutes} minutes this week, averaging {averageMinutes} minutes per day.
        </p>
      </div>
      
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis
                  dataKey="day"
                  stroke="#718096"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  formatter={(value: number) => [`${value} minutes`, 'Study Time']}
                />
                <Bar
                  dataKey="minutes"
                  radius={[6, 6, 0, 0]}
                  fill="#64748b"
                >
                  {data.map((entry: StudyTimeData, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.minutes === maxValue
                          ? '#f97316'
                          : entry.minutes === minValue
                          ? '#3b82f6'
                          : '#52aaa5'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LearningStats