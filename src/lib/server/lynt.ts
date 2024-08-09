import { fetchReferencedLynts, lyntObj } from "../../routes/api/util";
import { db } from "./db";
import { lynts, users } from "./schema";
import { eq } from "drizzle-orm";

export async function getLynt(lyntId: string){
    if(!lyntId) return

    const lyntobj = lyntObj(null);

    const [lynt] = await db
        .select({ ...lyntobj, parent: lynts.parent })
        .from(lynts)
        .leftJoin(users, eq(lynts.user_id, users.id))
        .where(eq(lynts.id, lyntId))
        .limit(1);

    if (!lynt) {
        return
    }

    const referencedLynts = await fetchReferencedLynts(null, lynt.parent);

    return { ...lynt, referencedLynts };
}