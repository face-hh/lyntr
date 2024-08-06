import { json } from '@sveltejs/kit';
import tf, { type Tensor3D } from '@tensorflow/tfjs-node';
import nsfw from 'nsfwjs';

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
	const tfImage = (await tf.node.decodeImage(image, 3)) as Tensor3D;
	const predictions = await model.classify(tfImage);
	for (const prediction of predictions) {
		if (
			prediction.probability > PREDICTION_TRESHOLD &&
			BAD_PREDICTION_TYPES.includes(prediction.className)
		)
			return true;
	}

	return false;
}
