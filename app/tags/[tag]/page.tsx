import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  // params.tag is URL-encoded, decode it first
  const decodedTag = decodeURIComponent(params.tag)
  // Find the original tag name from tagData
  // Note: tagData keys are already slugged, so we compare directly
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  // decodedTag is already slugged (from URL), and tagKeys are also slugged
  // So we can compare directly, or use slug() for consistency
  const originalTag = tagKeys.find((t) => t === decodedTag || slug(t) === decodedTag) || decodedTag
  return genPageMetadata({
    title: originalTag,
    description: `${siteMetadata.title} ${originalTag} tagged content`,
    alternates: {
      canonical: './',
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/tags/${params.tag}/feed.xml`,
      },
    },
  })
}

export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const paths = tagKeys.map((tag) => {
    // tag is already slugged (from tag-data.json), but we slug it again for consistency
    // For Chinese characters, slug() returns the original string
    // Next.js static export requires URL-encoded paths for Chinese characters
    // So we encode it here to match what Next.js expects
    const tagSlug = slug(tag)
    return {
      tag: encodeURIComponent(tagSlug),
    }
  })
  return paths
}

export default function TagPage({ params }: { params: { tag: string } }) {
  // params.tag is URL-encoded, decode it first
  const decodedTag = decodeURIComponent(params.tag)
  // Find the original tag name from tagData
  // Note: tagData keys are already slugged (from contentlayer.config.ts)
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  // decodedTag is already slugged (from URL), and tagKeys are also slugged
  // So we compare directly first, then fallback to slug comparison
  const originalTag = tagKeys.find((t) => t === decodedTag || slug(t) === decodedTag) || decodedTag
  // Capitalize first letter and convert space to dash
  const title = originalTag[0].toUpperCase() + originalTag.split(' ').join('-').slice(1)
  // Filter posts: compare slugged post tags with the decodedTag (which is already slugged)
  // post.tags contains original tag names, so we need to slug them before comparing
  const filteredPosts = allCoreContent(
    sortPosts(
      allBlogs.filter((post) => {
        if (!post.tags) return false
        // Check if any of the post's tags (after slugging) matches the decodedTag
        return post.tags.some((t) => {
          const sluggedTag = slug(t)
          return sluggedTag === decodedTag
        })
      })
    )
  )
  return <ListLayout posts={filteredPosts} title={title} />
}
