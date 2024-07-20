import * as Minio from "minio";
import { config} from 'dotenv';

config({ path: '.env' });

export const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
})