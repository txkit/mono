import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'


// RSS feed for /blog/. Excludes drafts, sorted by pubDate desc.

export const GET = async (context: APIContext) => {
  const posts = await getCollection('blog', ({ data }) => !data.draft)

  const sortedPosts = posts.sort(
    (postA, postB) => postB.data.pubDate.valueOf() - postA.data.pubDate.valueOf(),
  )

  return rss({
    title: 'txKit Blog',
    description: 'Notes on Web3 transaction safety, AI agents, and stablecoin treasury UX.',
    site: context.site!,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${ post.id }/`,
      categories: post.data.tags,
      author: 'Michael Diamond',
    })),
    customData: `<language>en-us</language><copyright>© ${ new Date().getFullYear() } txKit</copyright>`,
  })
}
