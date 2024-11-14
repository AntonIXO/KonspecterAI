// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "jsr:@supabase/supabase-js@2";
import { Database } from "../_shared/database.types.ts";

import { corsHeaders } from '../_shared/cors.ts'

const session = new Supabase.ai.Session('gte-small')

// Utility function for semantic chunking
// function semanticChunk(text: string, maxChunkSize: number = 500, minChunkSize: number = 50): string[] {
//   // Remove newline characters and split text into sentences
//   const sentences = text.replace(/\n/g, ' ').match(/[^\.!\?]+[\.!\?]+/g) || []
//   const chunks: string[] = []
//   let currentChunk = ''

//   for (const sentence of sentences) {
//     if ((currentChunk + sentence).length > maxChunkSize) {
//       if (currentChunk) {
//         chunks.push(currentChunk.trim())
//         currentChunk = ''
//       }
//       if (sentence.length > maxChunkSize) {
//         // Split long sentences
//         let start = 0
//         while (start < sentence.length) {
//           const part = sentence.substring(start, start + maxChunkSize).trim()
//           if (part.length >= minChunkSize) {
//             chunks.push(part)
//           }
//           start += maxChunkSize
//         }
//       } else {
//         currentChunk = sentence
//       }
//     } else {
//       currentChunk += sentence
//     }
//   }

//   if (currentChunk.trim().length >= minChunkSize) {
//     chunks.push(currentChunk.trim())
//   }

//   return chunks
// }

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient<Database>(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Get the session or user object
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data } = await supabase.auth.getUser(token)
    const user = data.user

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    const { text, path } = await req.json()

    if (!text || !path) {
      throw new Error('Both text and path are required')
    }

    // Generate embedding for the text
    const embedding = await session.run(text, {
      mean_pool: true,
      normalize: true,
    })

    // Insert into the 'books' table
    const { error } = await supabase.from('books').insert({
      user_id: user.id,
      path: path,
      text: text,
      embedding: embedding,
    })
    
    if (error) {
      throw new Error(`Database insertion error: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/embed' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
