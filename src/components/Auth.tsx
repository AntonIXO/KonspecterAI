"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { login, signup } from "@/app/login/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useState } from 'react'
import type { AuthResponse } from '@/app/login/actions'
import { KeySquare } from "lucide-react"
import { GoogleButton } from "@/components/ui/google-button"
import { createClient } from '@/utils/supabase/client'

export function Auth() {
  const [message, setMessage] = useState<AuthResponse>({})

  const supabase = createClient()

  async function handleLogin(formData: FormData) {
    const response = await login(formData)
    setMessage(response || {})
  }

  async function handleSignup(formData: FormData) {
    const response = await signup(formData)
    setMessage(response || {})
  }

  async function handleTestLogin() {
    const formData = new FormData();
    formData.append('email', 'test@devpins.org');
    formData.append('password', 'test');
    await handleLogin(formData);
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://ai.devpins.org/auth/callback'
      }
    })

    if (error) {
      setMessage({ error: error.message })
    }
  }

  return (
    <div className="space-y-4 w-[400px]">
      {message.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message.error}</AlertDescription>
        </Alert>
      )}
      
      {message.success && (
        <Alert>
          <AlertTitle className="text-green-600 font-bold">Success! 🎉</AlertTitle>
          <AlertDescription>{message.success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <form action={handleLogin}>
              <CardContent className="space-y-4">
                <GoogleButton onClick={handleGoogleLogin} />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email" 
                    type="email"
                    placeholder="me@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <div className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-0 text-muted-foreground hover:text-primary transition-colors flex items-center gap-2" 
                    asChild
                  >
                    <a href="/reset-password">
                      <KeySquare className="h-4 w-4" />
                      Forgot password?
                    </a>
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button type="submit" className="w-full">
                  Login
                </Button>
                <Button 
                  type="button" 
                  className="w-full mt-2 bg-yellow-500 text-black hover:bg-yellow-600 transition-colors animate-flash"
                  onClick={handleTestLogin}
                >
                  Login with Test Account
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>
                Enter your email below to create your account
              </CardDescription>
            </CardHeader>
            <form action={handleSignup}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="me@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Create account
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
