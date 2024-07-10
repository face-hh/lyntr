import { config } from 'dotenv';
import { error } from "@sveltejs/kit";
import * as jose from "jose";

config({ path: '.env' });

export type JWTPayload = {
    userId: string;
};

export const createAuthJWT = async (data: JWTPayload) => {
    const jwt = await new jose.SignJWT(data)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    return jwt;
};

export const verifyAuthJWT = async (token: string) => {
    try {
        const { payload } = await jose.jwtVerify(
            token,
            new TextEncoder().encode(process.env.JWT_SECRET)
        );
        return payload as JWTPayload;
    } catch {
        throw error(401, "You are not logged in.");
    }
};