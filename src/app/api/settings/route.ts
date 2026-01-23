import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          notificationTime: '09:00',
          notificationsEnabled: true,
          dailyHighlightsCount: 5,
          timezone: 'UTC',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationTime, notificationsEnabled, dailyHighlightsCount, timezone } = body;

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          notificationTime: notificationTime || '09:00',
          notificationsEnabled: notificationsEnabled ?? true,
          dailyHighlightsCount: dailyHighlightsCount || 5,
          timezone: timezone || 'UTC',
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          ...(notificationTime && { notificationTime }),
          ...(typeof notificationsEnabled === 'boolean' && { notificationsEnabled }),
          ...(dailyHighlightsCount && { dailyHighlightsCount }),
          ...(timezone && { timezone }),
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
