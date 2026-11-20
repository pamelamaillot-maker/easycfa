'use client';

// components/ImagePiece.tsx
// Affiche une image du bucket pieces-justificatives via un lien temporaire.
// Fonctionne que le bucket soit public ou privé.

import { useEffect, useState, type CSSProperties } from 'react';
import { lienTemporaire } from '../lib/storage';

export default function ImagePiece({ url, alt, style }: { url?: string | null; alt: string; style?: CSSProperties }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    setSrc(null);
    lienTemporaire(url).then(lien => { if (actif) setSrc(lien); });
    return () => { actif = false; };
  }, [url]);

  if (!src) return null;
  return <img src={src} alt={alt} style={style} />;
}
