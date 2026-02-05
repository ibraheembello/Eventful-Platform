export interface ShareLinks {
  twitter: string;
  facebook: string;
  linkedin: string;
  whatsapp: string;
  email: string;
}

export function generateShareLinks(
  eventTitle: string,
  eventUrl: string,
  eventDescription?: string
): ShareLinks {
  const encodedTitle = encodeURIComponent(eventTitle);
  const encodedUrl = encodeURIComponent(eventUrl);
  const encodedDesc = encodeURIComponent(eventDescription || eventTitle);

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`,
  };
}
