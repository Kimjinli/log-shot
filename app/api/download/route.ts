import { NextRequest, NextResponse } from 'next/server';
import { db, photos } from '@/src/db';
import { inArray } from 'drizzle-orm';
import archiver from 'archiver';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const { photoIds } = await request.json();

    if (!photoIds || photoIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No photos selected' },
        { status: 400 }
      );
    }

    const selectedPhotos = await db.query.photos.findMany({
      where: inArray(photos.id, photoIds),
      with: { project: true },
    });

    if (selectedPhotos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No photos found' },
        { status: 404 }
      );
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    
    for (const photo of selectedPhotos) {
      let dirPath = '';
      if (photo.project) {
        dirPath = photo.project.name.replace(/[^a-zA-Z0-9가-힣\s]/g, '_');
      } else {
        dirPath = 'No_Project';
      }

      if (photo.tags && Array.isArray(photo.tags) && photo.tags.length > 0) {
        const tagsStr = photo.tags.join('_').replace(/[^a-zA-Z0-9가-힣\s_]/g, '_');
        dirPath += `/${tagsStr}`;
      } else {
        dirPath += '/No_Tags';
      }

      const filePath = join(process.cwd(), 'public', photo.compressedUrl);
      if (existsSync(filePath)) {
        archive.file(filePath, { name: `${dirPath}/${photo.originalFileName}` });
      }
    }

    await archive.finalize();

    const stream = Readable.from(archive as any);
    
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="log-shot-${timestamp}.zip"`,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/download error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download photos' },
      { status: 500 }
    );
  }
}
