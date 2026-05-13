import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'


// Blog content collection - long-form posts on Web3 transaction safety,
// AI agents, and stablecoin treasury UX. Drafts excluded by underscore prefix
// (folder _drafts/ or files starting with _). Published posts validated at
// build time via Zod schema below.

const blog = defineCollection({
  loader: glob({
    pattern: '**/[^_]*.{md,mdx}',
    base: './src/content/blog',
  }),
  schema: z.object({
    title: z.string().min(1).max(80),
    description: z.string().min(40).max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    minutesRead: z.number().int().positive().optional(),
  }),
})


export const collections = { blog }
