import { LandingPage } from '@/components/LandingPage'
import { getSiteContent } from '@/lib/siteContent'

// La home siempre muestra el landing — sin importar si hay sesión activa.
// Los usuarios con sesión pueden ir a /admin o /advisor desde el botón
// "Ir a mi cuenta" en el landing.
export default async function Home() {
  const content = await getSiteContent()
  return <LandingPage content={content} />
}
