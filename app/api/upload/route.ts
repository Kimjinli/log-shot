import { NextRequest, NextResponse } from 'next/server';
import { db, photos } from '@/src/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

/**
 * POST /api/upload - 사진 업로드
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const metadata = metadataStr ? JSON.parse(metadataStr) : {};

    // Ensure upload directories exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const thumbnailsDir = join(process.cwd(), 'public', 'thumbnails');

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    if (!existsSync(thumbnailsDir)) {
      await mkdir(thumbnailsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedName}`;

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save original/compressed image
    const uploadPath = join(uploadsDir, fileName);
    await writeFile(uploadPath, buffer);

    // Generate thumbnail (300x300)
    const thumbnailFileName = `thumb-${fileName}`;
    const thumbnailPath = join(thumbnailsDir, thumbnailFileName);

    try {
      await sharp(buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    } catch (thumbError) {
      console.error('[API] Thumbnail generation error:', thumbError);
      // Continue without thumbnail
    }

    const photoData = {
      originalFileName: file.name,
      compressedUrl: `/uploads/${fileName}`,
      thumbnailUrl: `/thumbnails/${thumbnailFileName}`,
      fileSize: file.size,
      exifData: metadata.exifData ? JSON.stringify(metadata.exifData) : null,
      capturedAt: metadata.capturedAt ? new Date(metadata.capturedAt) : new Date(),
      displayDate: metadata.capturedAt ? new Date(metadata.capturedAt) : new Date(),
      tags: metadata.tags ? JSON.stringify(metadata.tags) : JSON.stringify([]),
      projectId: metadata.projectId || null,
    };

    const created = await db.insert(photos).values(photoData).returning();

    return NextResponse.json({
      success: true,
      data: created[0],
      message: 'Photo uploaded successfully',
    });
  } catch (error) {
    console.error('[API] POST /api/upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
