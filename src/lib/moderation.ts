import { json } from '@sveltejs/kit';
import tf, { type Tensor3D } from '@tensorflow/tfjs-node';
import nsfw from 'nsfwjs';
import { db } from './server/db';
import { lynts, users } from './server/schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';
import { deleteLynt } from '../routes/api/util';
import sharp from 'sharp';

config({ path: '.env' });

type ModerationAction = 'ban' | 'delete' | 'neutral';
const BAD_PREDICTION_TYPES = ['Hentai', 'Porn'];
const PREDICTION_TRESHOLD = 0.7;
export const NSFW_ERROR = json(
	{
		error:
			'It seems like you just uploaded an NSFW image. We do not allow this type of content, if you believe this is a mistake, please contact us.'
	},
	{ status: 400 }
);

tf.enableProdMode();
const model = await nsfw.load();

export async function isImageNsfw(image: Buffer) {
	const { data, info } = await sharp(image)
		.removeAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const tfImage = tf.tensor3d(new Int32Array(data), [info.height, info.width, 3], "int32");
	const predictions = await model.classify(tfImage);
	tfImage.dispose();

	for (const prediction of predictions) {
		if (
			prediction.probability > PREDICTION_TRESHOLD &&
			BAD_PREDICTION_TYPES.includes(prediction.className)
		)
			return true;
	}

	return false;
}

export async function moderate(content: string, lyntId: string, userId: string) {
	if (process.env.MODERATION == 'false') return false;

	const user = (await db.select().from(users).where(eq(users.id, userId)))[0];

	const res = await fetch(
		`http://${process.env.MODERATION_SVC_OVERRIDE ?? 'moderation-svc:4000'}/classify`,
		{
			method: 'POST',
			body: JSON.stringify({ content, user })
		}
	).catch(() =>
		console.error(
			'Failed to reach moderation service, likely a self hosted instance without MODERATION=false'
		)
	);
	if (!res || !res.ok) return false;
	const action = (await res.text()) as ModerationAction;
	if (action == 'ban') {
		await db.update(users).set({ banned: true }).where(eq(users.id, userId));
		console.log(`Moderation service requested ban on ${userId}`);
	} else if (action == 'delete') {
		await deleteLynt(lyntId);
	}
}
