import { useState } from 'react'
import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'

interface Option {
  id: string
  text: string
  isCorrect: boolean
  explanation: string
}

interface Question {
  id: string
  question: string
  options: Option[]
}

// Mock data - Replace with actual API data later
const mockQuestions: Question[] = [
  {
    id: '1',
    question: 'Which word means "to make something better"?',
    options: [
      {
        id: 'a',
        text: 'Improve',
        isCorrect: true,
        explanation: '"Improve" means to make something better or enhance its quality.'
      },
      {
        id: 'b',
        text: 'Decline',
        isCorrect: false,
        explanation: '"Decline" means to decrease or become worse.'
      },
      {
        id: 'c',
        text: 'Maintain',
        isCorrect: false,
        explanation: '"Maintain" means to keep something in its current state.'
      },
      {
        id: 'd',
        text: 'Ignore',
        isCorrect: false,
        explanation: '"Ignore" means to pay no attention to something.'
      }
    ]
  }
]

const QuizSection = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [, setShowExplanation] = useState(false)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)

  const currentQuestion = mockQuestions[currentQuestionIndex]

  const handleOptionClick = (optionId: string) => {
    setSelectedOption(optionId)
    setShowExplanation(true)
    setTotalAnswered(prev => prev + 1)
    
    const isCorrect = currentQuestion.options.find(opt => opt.id === optionId)?.isCorrect
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1)
    }
  }

  const handleNextQuestion = () => {
    setSelectedOption(null)
    setShowExplanation(false)
    setCurrentQuestionIndex((prev) =>
      prev < mockQuestions.length - 1 ? prev + 1 : 0
    )
  }

  const getOptionStyle = (option: Option) => {
    if (!selectedOption) return 'border-[#e2e8f0] bg-white'
    if (option.id === selectedOption) {
      return option.isCorrect
        ? 'border-[#52aaa5] bg-[#52aaa5] bg-opacity-5 text-[#52aaa5]'
        : 'border-red-400 bg-red-50 text-red-500'
    }
    if (option.isCorrect) return 'border-[#52aaa5] bg-[#52aaa5] bg-opacity-5 text-[#52aaa5]'
    return 'border-[#e2e8f0] bg-white'
  }

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[#2D3748]">Quick Quiz</h2>
        <p className="text-sm text-gray-600">
          Test your vocabulary and grammar skills with quick quizzes
        </p>
      </div>
      
      <Card className="group overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-6">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <p className="text-lg font-medium text-[#2D3748]">{currentQuestion.question}</p>
            </div>
            <div className="flex items-center rounded-full bg-[#52aaa5] bg-opacity-10 px-4 py-2 text-sm">
              <span className="font-semibold text-[#52aaa5]">{correctAnswers}</span>
              <span className="mx-1 text-gray-500">/</span>
              <span className="text-gray-600">{totalAnswered}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {currentQuestion.options.map((option) => (
              <Button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={!!selectedOption}
                variant="outline"
                className={`group relative w-full justify-start py-6 px-5 text-left transition-all duration-200
                  ${getOptionStyle(option)}
                  ${!selectedOption && 'hover:border-[#52aaa5] hover:bg-[#52aaa5] hover:bg-opacity-5 hover:text-[#52aaa5]'}
                  ${selectedOption ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <span className="text-base font-medium">
                  {option.text}
                </span>
              </Button>
            ))}
          </div>

          {selectedOption && (
            <Button
              onClick={handleNextQuestion}
              className="mt-6 w-full bg-gradient-to-r from-[#52aaa5] to-[#478f8b] text-white transition-all duration-200 hover:from-[#478f8b] hover:to-[#3b7875]"
            >
              Next Question
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default QuizSection