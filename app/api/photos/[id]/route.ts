import { NextRequest, NextResponse } from 'next/server';
import { db, photos } from '@/src/db';
import { eq } from 'drizzle-orm';

/**
 * GET /api/photos/:id - 사진 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photo = await db.query.photos.findFirst({
      where: eq(photos.id, params.id),
      with: {
        project: true,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: photo,
    });
  } catch (error) {
    console.error('[API] GET /api/photos/:id error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/photos/:id - 사진 정보 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    console.log('[API] PATCH /api/photos/:id received data:', JSON.stringify(data, null, 2));

    // Prepare update data with proper type conversions
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Convert displayDate to Date if provided
    if (data.displayDate) {
      updateData.displayDate = new Date(data.displayDate);
      console.log('[API] Converted displayDate:', updateData.displayDate);
    }

    // Include tags if provided (should be an array)
    if (data.tags !== undefined) {
      updateData.tags = Array.isArray(data.tags) ? data.tags : [];
      console.log('[API] Tags:', updateData.tags);
    }

    // Include adjustments if provided (should be an object)
    if (data.adjustments) {
      updateData.adjustments = data.adjustments;
      console.log('[API] Adjustments:', JSON.stringify(updateData.adjustments));
    }

    // Include projectId if provided (can be null)
    if ('projectId' in data) {
      updateData.projectId = data.projectId;
      console.log('[API] ProjectId:', updateData.projectId);
    }

    console.log('[API] Final update data:', JSON.stringify(updateData, null, 2));

    const updated = await db
      .update(photos)
      .set(updateData)
      .where(eq(photos.id, params.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    console.log('[API] Photo updated successfully:', JSON.stringify(updated[0], null, 2));

    return NextResponse.json({
      success: true,
      data: updated[0],
      message: 'Photo updated successfully',
    });
  } catch (error) {
    console.error('[API] PATCH /api/photos/:id error:', error);
    console.error('[API] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update photo',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/photos/:id - 사진 삭제 (소프트 삭제)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await db
      .update(photos)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(photos.id, params.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('[API] DELETE /api/photos/:id error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
