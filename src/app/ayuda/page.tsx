import { HELP_CATEGORIES } from '@/lib/helpContent'
import { getCachedArticleList } from '@/lib/helpCache'
import HelpCenterClient from './HelpCenterClient'

export const revalidate = 600 // fallback: 10 min ISR

export default async function HelpCenterPage() {
  const articles = await getCachedArticleList()
  return <HelpCenterClient articles={articles} categories={HELP_CATEGORIES} />
}
