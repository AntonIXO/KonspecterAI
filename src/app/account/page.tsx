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
import { Label } from '@/components/ui/label'
import { Form } from '@/components/ui/form'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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
      <Form>
        <div className="mb-4">
          <Label htmlFor="name">Name</Label>
          <Input id="name" type="text" defaultValue={user.user_metadata.name} />
        </div>
        <div className="mb-4">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue={user.email} disabled />
        </div>
        {/* Add more fields as needed */}
        <Button type="submit">Update Account</Button>
      </Form>
    </div>
  )
} 