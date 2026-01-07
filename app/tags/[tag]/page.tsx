import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  // params.tag might be URL-encoded or not, try to decode it first
  let decodedTag: string
  try {
    const decoded = decodeURIComponent(params.tag)
    decodedTag = decoded !== params.tag ? decoded : params.tag
  } catch {
    decodedTag = params.tag
  }

  // Find the original tag name from tagData
  // Note: tagData keys are already slugged (from contentlayer.config.ts)
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)

  // Try to find matching tag
  const sluggedDecoded = slug(decodedTag)
  const originalTag =
    tagKeys.find((t) => {
      if (t === decodedTag || slug(t) === decodedTag) return true
      return t === sluggedDecoded || slug(t) === sluggedDecoded
    }) || decodedTag

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
    // Generate both encoded and unencoded paths to handle both cases
    // Most browsers will encode automatically, but some might not
    return {
      tag: encodeURIComponent(tagSlug),
    }
  })
  // Also add unencoded paths for Chinese tags to handle direct access
  // This ensures both /tags/财商构建 and /tags/%E8%B4%A2%E5%95%86%E6%9E%84%E5%BB%BA work
  const unencodedPaths = tagKeys
    .filter((tag) => {
      // Check if tag contains non-ASCII characters (likely Chinese)
      // Use a safer method to detect non-ASCII characters
      return Array.from(tag).some((char) => char.charCodeAt(0) > 127)
    })
    .map((tag) => {
      const tagSlug = slug(tag)
      return {
        tag: tagSlug, // Unencoded path for direct Chinese access
      }
    })
  return [...paths, ...unencodedPaths]
}

export default function TagPage({ params }: { params: { tag: string } }) {
  // params.tag might be URL-encoded or not, try to decode it first
  // If it's already decoded (contains Chinese characters directly), use it as is
  let decodedTag: string
  try {
    // Try to decode, if it fails or doesn't change, use original
    const decoded = decodeURIComponent(params.tag)
    decodedTag = decoded !== params.tag ? decoded : params.tag
  } catch {
    // If decode fails, use original (might be already decoded)
    decodedTag = params.tag
  }

  // Find the original tag name from tagData
  // Note: tagData keys are already slugged (from contentlayer.config.ts)
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)

  // decodedTag might be the original tag name (if user accessed /tags/财商构建 directly)
  // or it might be slugged (if accessed via encoded URL)
  // Try to find matching tag in tagData
  let originalTag = tagKeys.find((t) => {
    // Direct match (both are slugged)
    if (t === decodedTag || slug(t) === decodedTag) return true
    // If decodedTag is original tag name, slug it and compare
    const sluggedDecoded = slug(decodedTag)
    return t === sluggedDecoded || slug(t) === sluggedDecoded
  })

  // If not found, try to find by slugging the decodedTag
  if (!originalTag) {
    const sluggedDecoded = slug(decodedTag)
    originalTag =
      tagKeys.find((t) => t === sluggedDecoded || slug(t) === sluggedDecoded) || decodedTag
  } else {
    originalTag = originalTag || decodedTag
  }

  // Capitalize first letter and convert space to dash
  const title = originalTag[0].toUpperCase() + originalTag.split(' ').join('-').slice(1)

  // Filter posts: compare slugged post tags with the slugged decodedTag
  // post.tags contains original tag names, so we need to slug them before comparing
  const sluggedDecodedTag = slug(decodedTag)
  const filteredPosts = allCoreContent(
    sortPosts(
      allBlogs.filter((post) => {
        if (!post.tags) return false
        // Check if any of the post's tags (after slugging) matches the slugged decodedTag
        return post.tags.some((t) => {
          const sluggedTag = slug(t)
          return sluggedTag === sluggedDecodedTag
        })
      })
    )
  )
  return <ListLayout posts={filteredPosts} title={title} />
}
