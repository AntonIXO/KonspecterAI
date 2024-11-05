'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

// Define form schema
const accountFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
})

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  // Update defaultValues when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.user_metadata.name || "",
        email: user.email || "",
      })
    }
  }, [user, form])

  async function onSubmit(values: z.infer<typeof accountFormSchema>) {
    // Handle form submission
    console.log(values)
  }

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    fetchUser()
  }, [supabase])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Account Information</h1>
      <Avatar className="h-16 w-16 mb-4">
        <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.name} />
        <AvatarFallback>{user.user_metadata.name?.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Update Account</Button>
        </form>
      </Form>
    </div>
  )
} 