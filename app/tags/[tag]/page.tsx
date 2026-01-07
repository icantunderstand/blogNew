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
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const originalTag = tagKeys.find((t) => slug(t) === decodedTag) || decodedTag
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
    const tagSlug = slug(tag)
    // For Chinese characters, slug() returns the original string
    // Next.js static export requires URL-encoded paths for Chinese characters
    // So we encode it here to match what Next.js expects
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
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const originalTag = tagKeys.find((t) => slug(t) === decodedTag) || decodedTag
  // Capitalize first letter and convert space to dash
  const title = originalTag[0].toUpperCase() + originalTag.split(' ').join('-').slice(1)
  const filteredPosts = allCoreContent(
    sortPosts(
      allBlogs.filter((post) => post.tags && post.tags.map((t) => slug(t)).includes(decodedTag))
    )
  )
  return <ListLayout posts={filteredPosts} title={title} />
}
