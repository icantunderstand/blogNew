import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { components } from '@/components/MDXComponents';
import PageTitle from '@/components/PageTitle';
import SectionContainer from '@/components/SectionContainer';
import Link from 'next/link';
import 'css/prism.css';
import 'katex/dist/katex.css';

// 生成静态参数，用于预渲染所有草稿页面
export async function generateStaticParams() {
  const draftsDirectory = path.join(process.cwd(), 'draft');
  try {
    const draftFiles = fs.readdirSync(draftsDirectory).filter(file => 
      file.endsWith('.mdx') || file.endsWith('.md')
    );
    
    return draftFiles.map(file => ({
      slug: file.replace(/\.mdx$|\.md$/, '')
    }));
  } catch (error) {
    console.error('Error reading drafts directory:', error);
    return [];
  }
}

export default async function DraftPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const draftsDirectory = path.join(process.cwd(), 'draft');
  
  // 尝试查找 .mdx 或 .md 文件
  let filePath = path.join(draftsDirectory, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(draftsDirectory, `${slug}.md`);
  }
  
  // 如果文件不存在，显示错误信息
  if (!fs.existsSync(filePath)) {
    return (
      <SectionContainer>
        <div className="mt-10 text-center">
          <h1 className="text-3xl font-bold">草稿不存在</h1>
          <p className="mt-4">找不到名为 "{slug}" 的草稿文件</p>
          <Link href="/drafts" className="mt-6 inline-block text-blue-600 dark:text-blue-400">
            返回草稿列表
          </Link>
        </div>
      </SectionContainer>
    );
  }
  
  // 读取并解析草稿内容
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(fileContent);
  
  return (
    <SectionContainer>
      <article className="divide-y divide-gray-200 dark:divide-gray-700">
        <header className="pt-6 pb-6">
          <div className="space-y-1 text-center">
            <div className="mb-4">
              <Link href="/drafts" className="text-blue-600 dark:text-blue-400">
                &larr; 返回草稿列表
              </Link>
            </div>
            <div className="inline-flex items-center justify-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
              草稿预览
            </div>
            <PageTitle>{data.title || slug}</PageTitle>
            {data.date && (
              <dl className="space-y-10">
                <div>
                  <dt className="sr-only">发布日期</dt>
                  <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                    <time dateTime={data.date}>
                      {new Date(data.date).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </header>
        <div className="divide-y divide-gray-200 pb-8 dark:divide-gray-700 xl:divide-y-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-700 xl:col-span-3 xl:row-span-2 xl:pb-0">
            <div className="prose max-w-none pb-8 pt-10 dark:prose-invert">
              <MDXRemote source={content} components={components} />
            </div>
          </div>
        </div>
      </article>
    </SectionContainer>
  );
}