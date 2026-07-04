import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/constants';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function getSEO({
  title,
  description = SITE_DESCRIPTION,
  image = `${SITE_URL}/og-image.jpg`,
  url = SITE_URL,
  type = 'website',
}: SEOProps = {}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | ${SITE_DESCRIPTION}`;

  return {
    title: fullTitle,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
  };
}
