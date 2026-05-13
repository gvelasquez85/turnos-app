import { HELP_CATEGORIES } from '@/lib/helpContent'
import { getCachedArticleList } from '@/lib/helpCache'
import HelpCenterClient from './HelpCenterClient'

export const revalidate = 604800 // fallback: 1 week ISR

export default async function HelpCenterPage() {
  const articles = await getCachedArticleList()
  return <HelpCenterClient articles={articles} categories={HELP_CATEGORIES} />
}
