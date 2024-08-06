import * as nsfwjs from "/node_modules/nsfwjs/dist/esm";
import * as tf from "@tensorflow/tfjs-node";
import { dev } from "$app/environment";
import sharp from "sharp";

export const getModel = async () => {
	if (!globalThis.model) {
		console.log("loading model");
		if (!dev) {
		        tf.enableProdMode();
		}
		globalThis.model = await nsfwjs.load(`file://./models/mobilenet_v2_mid/`, { type: 'graph' });
	}
	return globalThis.model;
}

export const checkImage = async (img) => {
	const { data, info } = await sharp(img)
		//.resize(224, 224)
		.removeAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	let result = undefined;
	const tensor3d = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels], "int32");
	try {
		result = await (await getModel()).classify(tensor3d);
	} catch (e) {
		tensor3d.dispose();
		throw e;
	}
	tensor3d.dispose();
	return result;
}
