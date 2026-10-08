import React, { useState, useEffect } from 'react';

// Global cache for transparent logo data URL
let cachedTransparentLogo = null;

/**
 * VeraLogoImage
 * Dynamically processes /vera-logo-icon.png using an offscreen canvas
 * to cleanly key out the white background with antialiased edge blending.
 */
export default function VeraLogoImage({ className = 'w-full h-full object-contain', alt = 'VERA' }) {
  const [dataUrl, setDataUrl] = useState(cachedTransparentLogo || '/vera-logo-icon.png');

  useEffect(() => {
    if (cachedTransparentLogo) {
      setDataUrl(cachedTransparentLogo);
      return;
    }

    const img = new Image();
    img.src = '/vera-logo-icon.png';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        // Process pixels: remove white background with smooth feathering
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];

          // Check if pixel is white or near-white background
          if (r > 240 && g > 240 && b > 240) {
            d[i + 3] = 0; // 100% transparent
          } else if (r > 215 && g > 215 && b > 215) {
            // Anti-aliased feather edge
            const minChannel = Math.min(r, g, b);
            const factor = (minChannel - 215) / 25;
            d[i + 3] = Math.max(0, Math.round(d[i + 3] * (1 - factor)));
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentUrl = canvas.toDataURL('image/png');
        cachedTransparentLogo = transparentUrl;
        setDataUrl(transparentUrl);
      } catch (err) {
        console.warn('Canvas transparency processing error, fallback to raw icon:', err);
      }
    };
  }, []);

  return (
    <img
      src={dataUrl}
      alt={alt}
      className={className}
      draggable="false"
    />
  );
}
