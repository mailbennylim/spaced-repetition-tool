import AdmZip from 'adm-zip';
import { writeFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

/**
 * Extract cover image from an EPUB file
 * EPUBs are zip files containing OPF metadata that references the cover image
 */
export async function extractEpubCover(epubPath: string): Promise<string | null> {
  try {
    const fullPath = path.join(process.cwd(), 'public', epubPath.replace(/^\//, ''));
    const zip = new AdmZip(fullPath);
    const zipEntries = zip.getEntries();

    // Common cover image locations in EPUBs
    const coverPatterns = [
      /cover\.(jpg|jpeg|png|gif)/i,
      /cover[-_]?image\.(jpg|jpeg|png|gif)/i,
      /^OEBPS\/images\/cover\.(jpg|jpeg|png|gif)/i,
      /^images\/cover\.(jpg|jpeg|png|gif)/i,
    ];

    // Try to find cover by filename patterns
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      const filename = entry.entryName.toLowerCase();
      if (coverPatterns.some(pattern => pattern.test(filename))) {
        const imageData = entry.getData();

        // Save cover image
        const coverFilename = `cover-${Date.now()}.jpg`;
        const coverPath = path.join(process.cwd(), 'public', 'uploads', coverFilename);

        // Convert to JPG and resize if needed
        await sharp(imageData)
          .resize(800, null, { withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(coverPath);

        return `/uploads/${coverFilename}`;
      }
    }

    // If no cover found by pattern, try the first image in the EPUB
    const firstImage = zipEntries.find(entry =>
      !entry.isDirectory && /\.(jpg|jpeg|png|gif)$/i.test(entry.entryName)
    );

    if (firstImage) {
      const imageData = firstImage.getData();
      const coverFilename = `cover-${Date.now()}.jpg`;
      const coverPath = path.join(process.cwd(), 'public', 'uploads', coverFilename);

      await sharp(imageData)
        .resize(800, null, { withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(coverPath);

      return `/uploads/${coverFilename}`;
    }

    return null;
  } catch (error) {
    console.error('EPUB cover extraction error:', error);
    return null;
  }
}

/**
 * Extract cover from PDF (first page thumbnail)
 * This is a placeholder - actual implementation would require pdf-lib or canvas
 */
export async function extractPdfCover(pdfPath: string): Promise<string | null> {
  // PDF cover extraction requires rendering the first page
  // This would need either pdf-lib or canvas, which adds complexity
  // For now, return null and use gradient fallback
  return null;
}
