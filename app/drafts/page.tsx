import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import matter from 'gray-matter';
import PageTitle from '@/components/PageTitle';
import SectionContainer from '@/components/SectionContainer';

export default function DraftsPage() {
  // 获取所有草稿文件
  const draftsDirectory = path.join(process.cwd(), 'draft');
  const draftFiles = fs.readdirSync(draftsDirectory).filter(file => 
    file.endsWith('.mdx') || file.endsWith('.md')
  );

  // 读取每个草稿的元数据
  const drafts = draftFiles.map(filename => {
    const filePath = path.join(draftsDirectory, filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);
    
    return {
      slug: filename.replace(/\.mdx$|\.md$/, ''),
      title: data.title || filename,
      date: data.date ? new Date(data.date).toLocaleDateString() : '未知日期'
    };
  });

  return (
    <SectionContainer>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <PageTitle>草稿预览</PageTitle>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            这里列出了所有可用的草稿文件
          </p>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {drafts.map(draft => (
            <li key={draft.slug} className="py-4">
              <article className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                <div className="space-y-3 xl:col-span-3">
                  <h3 className="text-2xl font-bold leading-8 tracking-tight">
                    <Link href={`/drafts/${draft.slug}`} className="text-gray-900 dark:text-gray-100">
                      {draft.title}
                    </Link>
                  </h3>
                  {draft.date && (
                    <dl>
                      <dt className="sr-only">发布日期</dt>
                      <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                        {draft.date}
                      </dd>
                    </dl>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </SectionContainer>
  );
}