'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Send } from "lucide-react"
import Link from 'next/link'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ error?: string; success?: string }>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account`,
      })
      
      if (error) throw error
      
      setMessage({
        success: "Check your email for the password reset link"
      })
      setEmail('')
    } catch (error) {
      setMessage({
        error: "Error sending password reset email"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-[400px] space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </Button>
        </div>

        {message.error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message.error}</AlertDescription>
          </Alert>
        )}
        
        {message.success && (
          <Alert>
            <AlertTitle className="text-green-600 font-bold">Success!</AlertTitle>
            <AlertDescription>{message.success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a password reset link
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="me@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4 animate-pulse" /> 
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" /> 
                    Send Reset Link
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
} 