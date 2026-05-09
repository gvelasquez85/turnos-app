import { LandingPage } from '@/components/LandingPage'
import { getSiteContent } from '@/lib/siteContent'

/**
 * Public preview of the landing page — bypasses auth redirect.
 * Used by superadmin CMS editor to preview content changes.
 */
export default async function PreviewPage() {
  const content = await getSiteContent()
  return <LandingPage content={content} />
}
