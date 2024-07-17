import { db } from '@/server/db';
import { notifications } from '@/server/schema';

export async function createNotification(
    userId: string,
    type: string,
    sourceUserId: string,
    lyntId?: string
) {
    await db.insert(notifications).values({
        userId,
        type,
        sourceUserId,
        lyntId
    });
}