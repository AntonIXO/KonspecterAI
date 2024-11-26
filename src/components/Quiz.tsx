"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Skeleton } from "./ui/skeleton"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Label } from "./ui/label"
import { toast } from "sonner"
import { generateQuiz, saveQuiz, type Quiz as QuizType } from "@/app/actions/quiz"
import confetti from 'canvas-confetti'
import { Check, X, Share2, Zap } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { RainbowButton } from "./ui/rainbow-button"
import { useFile } from "@/lib/FileContext"
import { useText } from '@/lib/TextContext';
import { ChromeAINotice } from "./ChromeAINotice";

interface Question {
  question: string
  options: string[]
  correctAnswer: number
}

interface QuizProps {
  open?: boolean
  setOpen?: (open: boolean) => void
  initialQuiz?: QuizType
  standalone?: boolean
}

export function Quiz({ open, setOpen, initialQuiz, standalone = false }: QuizProps) {
  const { pagesContent } = useText();
  const [questions, setQuestions] = useState<Question[]>(initialQuiz?.questions || [])
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [publicId, setPublicId] = useState<string>()

  const router = useRouter()
  const { filename } = useFile();

  // Modified useEffect to only use TextContext
  React.useEffect(() => {
    if (initialQuiz) {
      setQuestions(initialQuiz.questions);
      setUserAnswers(new Array(initialQuiz.questions.length).fill(-1));
    } else if (open && !questions.length && !loading) {
      const textToQuiz = Object.values(pagesContent).join('\n\n');
      handleGenerateQuiz(textToQuiz);
    }
  }, [open, pagesContent, initialQuiz, questions.length, loading]);

  // Remove the cleanup effect that was clearing questions
  React.useEffect(() => {
    if (!open && !standalone) {
      setUserAnswers([]);
      setShowResults(false);
      setScore(0);
      // Don't clear questions here
    }
  }, [open, standalone]);

  const handleGenerateQuiz = async (textContent: string) => {
    if (!textContent) return;
    
    try {
      setLoading(true);
      setQuestions([]);
      
      const quiz = await generateQuiz(textContent);
      
      setQuestions(quiz.questions);
      setUserAnswers(new Array(quiz.questions.length).fill(-1));
      setShowResults(false);
      setScore(0);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      toast.error("Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (showResults) return; // Prevent changing answers after submission
    
    setUserAnswers(prev => {
      const newAnswers = [...prev]
      newAnswers[questionIndex] = answerIndex
      return newAnswers
    })
  }

  const checkAnswers = () => {
    const correctAnswers = questions.reduce((acc, question, index) => {
      return acc + (userAnswers[index] === question.correctAnswer ? 1 : 0)
    }, 0)
    setScore(correctAnswers)
    setShowResults(true)

    // Trigger confetti if all answers are correct
    if (correctAnswers === questions.length) {
      const count = 200
      const defaults = {
        origin: { y: 0.7 }
      }

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        })
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      })
      fire(0.2, {
        spread: 60,
      })
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      })
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      })
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      })
    }
  }
  if (!filename) return;

  const handleSave = async () => {
    try {
      const id = await saveQuiz({ questions }, filename);
      setPublicId(id);
      toast.success("Quiz saved successfully!");
    } catch (error) {
      console.error('Failed to save quiz:', error);
      toast.error("Failed to save quiz");
    }
  };

  const handleShare = async () => {
    try {
      let shareId = publicId;
      if (!shareId) {
        // Save and get the ID directly without relying on state
        shareId = await saveQuiz({ questions }, filename);
        setPublicId(shareId); // Update state for future use
      }
      const url = `${window.location.origin}/quiz/${shareId}`; // Use the local variable instead of state
      await navigator.clipboard.writeText(url);
      toast.success("Quiz link copied to clipboard!");
    } catch (error) {
      console.error('Failed to share quiz:', error);
      toast.error("Failed to share quiz");
    }
  };

  if (standalone) {
    return (
        <div className="w-full max-w-4xl mx-auto bg-card p-8 rounded-lg shadow-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Quiz</h1>
            <p className="text-muted-foreground">
              Test your knowledge of the selected text
            </p>
          </div>

          <div className="space-y-8">
            {loading && (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="space-y-3">
                      {[...Array(4)].map((_, j) => (
                        <Skeleton key={j} className="h-4 w-1/2" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="pb-6 border-b last:border-0">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-lg font-medium">{`${qIndex + 1}. ${question.question}`}</p>
                  {showResults && (
                    <div className="ml-4 mt-1">
                      {userAnswers[qIndex] === question.correctAnswer ? (
                        <Check className="h-6 w-6 text-green-500" />
                      ) : (
                        <X className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <RadioGroup
                  value={userAnswers[qIndex]?.toString()}
                  onValueChange={(value) => handleAnswerSelect(qIndex, parseInt(value))}
                  className="space-y-3"
                >
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center space-x-3">
                      <RadioGroupItem
                        value={oIndex.toString()}
                        id={`q${qIndex}-o${oIndex}`}
                        disabled={showResults}
                        className="h-5 w-5"
                      />
                      <Label 
                        htmlFor={`q${qIndex}-o${oIndex}`}
                        className={`text-base ${
                          showResults
                            ? oIndex === question.correctAnswer
                              ? "text-green-500 font-medium"
                              : userAnswers[qIndex] === oIndex
                              ? "text-red-500 line-through"
                              : ""
                            : ""
                        }`}
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {showResults && userAnswers[qIndex] !== question.correctAnswer && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Correct answer: {question.options[question.correctAnswer]}
                  </p>
                )}
              </div>
            ))}

            {showResults && (
              <div className="p-6 bg-muted rounded-lg dark:bg-muted/50">
                <p className="text-center text-lg font-medium">
                  Your score: {score} out of {questions.length}
                  {score === questions.length && (
                    <span className="block text-green-500 mt-2 text-xl">Perfect Score! 🎉</span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center">
            {questions.length > 0 && !showResults && (
              <Button 
                size="lg"
                onClick={checkAnswers}
                className="px-8 transition-opacity duration-300"
              >
                Check Answers
              </Button>
            )}
            {questions.length > 0 && showResults && (
              <RainbowButton
                onClick={() => router.push('/landing')}
                className="group transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  Get more about Konspecter
                  <Zap className="transition-transform group-hover:rotate-12" />
                </span>
              </RainbowButton>
            )}
          </div>
        </div>
    );
  }

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Quiz</DialogTitle>
            <DialogDescription>
              Test your knowledge of the selected text
            </DialogDescription>
          </DialogHeader>

          {questions.length > 0 && (
            <div className="absolute right-4 top-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSave}>
                    Save Quiz
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    Share Quiz
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div className="h-[400px] overflow-y-auto pr-4">
            {loading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="space-y-2">
                      {[...Array(4)].map((_, j) => (
                        <Skeleton key={j} className="h-3 w-1/2" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="mb-6">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-medium">{`${qIndex + 1}. ${question.question}`}</p>
                  {showResults && (
                    <div className="ml-2 mt-1">
                      {userAnswers[qIndex] === question.correctAnswer ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <RadioGroup
                  value={userAnswers[qIndex]?.toString()}
                  onValueChange={(value) => handleAnswerSelect(qIndex, parseInt(value))}
                >
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem
                        value={oIndex.toString()}
                        id={`q${qIndex}-o${oIndex}`}
                        disabled={showResults}
                      />
                      <Label 
                        htmlFor={`q${qIndex}-o${oIndex}`}
                        className={
                          showResults
                            ? oIndex === question.correctAnswer
                              ? "text-green-500 font-medium"
                              : userAnswers[qIndex] === oIndex
                              ? "text-red-500 line-through"
                              : ""
                            : ""
                        }
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {showResults && userAnswers[qIndex] !== question.correctAnswer && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Correct answer: {question.options[question.correctAnswer]}
                  </p>
                )}
              </div>
            ))}

            {showResults && (
              <div className="mt-4 p-4 bg-muted rounded-lg dark:bg-muted/50">
                <p className="text-center font-medium">
                  Your score: {score} out of {questions.length}
                  {score === questions.length && (
                    <span className="block text-green-500 mt-1">Perfect Score! 🎉</span>
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            {questions.length > 0 && !showResults && (
              <Button onClick={checkAnswers}>Check Answers</Button>
            )}
            {questions.length > 0 && showResults && (
              <Button onClick={() => {
                const textToQuiz = Object.values(pagesContent).join('\n\n');
                handleGenerateQuiz(textToQuiz);
              }}>
                Try New Quiz
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
        <ChromeAINotice/>
      </Dialog>
  )
} 