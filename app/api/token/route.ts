import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const room = req.nextUrl.searchParams.get("room") || "room-01";
    const username = req.nextUrl.searchParams.get("username") || "user-" + Math.floor(Math.random() * 10000);

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
        return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
    }

    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        {
            identity: username,
        }
    );
    at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });

    return NextResponse.json({
        accessToken: await at.toJwt(),
        url: process.env.LIVEKIT_URL,
    });
}
