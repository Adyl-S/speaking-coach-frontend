"use client";

import {
    LiveKitRoom,
    RoomAudioRenderer,
    GridLayout,
    ParticipantTile,
    useTracks,
    useRoomContext,
    ConnectionStateToast,
    VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, createLocalVideoTrack, LocalVideoTrack, RoomEvent, ExternalE2EEKeyProvider } from "livekit-client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Video, Users, ArrowRight, VideoOff, MicOff, Settings, PhoneOff, AlertCircle, Loader2, Lock } from "lucide-react";

export default function SpeakingCoach() {
    const [token, setToken] = useState("");
    const [url, setUrl] = useState("");
    const [connected, setConnected] = useState(false);
    const [isJoinLoading, setIsJoinLoading] = useState(false);
    const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
    const [permissionError, setPermissionError] = useState(false);
    const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Check permission status using the Permissions API
    const checkPermissionState = useCallback(async () => {
        if (typeof navigator !== 'undefined' && navigator.permissions) {
            try {
                const cameraStatus = await navigator.permissions.query({ name: 'camera' as any });
                const micStatus = await navigator.permissions.query({ name: 'microphone' as any });

                if (cameraStatus.state === 'denied' || micStatus.state === 'denied') {
                    setPermissionState('denied');
                    setPermissionError(true);
                } else if (cameraStatus.state === 'granted' && micStatus.state === 'granted') {
                    setPermissionState('granted');
                    setPermissionError(false);
                } else {
                    setPermissionState('prompt');
                }

                // Listen for changes
                cameraStatus.onchange = () => checkPermissionState();
                micStatus.onchange = () => checkPermissionState();
            } catch (e) {
                console.warn("Permissions API not supported or failed", e);
            }
        }
    }, []);

    useEffect(() => {
        checkPermissionState();
    }, [checkPermissionState]);

    const enableVideo = async () => {
        setPermissionError(false);
        try {
            const track = await createLocalVideoTrack({
                resolution: { width: 1280, height: 720 },
            });
            setLocalVideoTrack(track);
            setPermissionState('granted');
        } catch (e: any) {
            console.error("Could not get local video track", e);
            if (e.message?.includes("Permission denied") || e.name === "NotAllowedError") {
                setPermissionError(true);
                setPermissionState('denied');
            }
        }
    };

    useEffect(() => {
        // Only attempt to enable video if we are not connected and haven't already tried successfully
        // And only if we don't explicitly know it's denied
        if (!connected && !localVideoTrack && permissionState !== 'denied') {
            enableVideo();
        }

        return () => {
            if (localVideoTrack) {
                localVideoTrack.stop();
            }
        };
    }, [connected, permissionState]);

    async function connect() {
        setIsJoinLoading(true);
        setConnectionError(null);
        try {
            if (permissionState === 'denied') {
                throw new Error("Camera/Microphone access is blocked. Please reset permissions in your browser address bar.");
            }

            const resp = await fetch("/api/token?room=room-01&username=user");
            if (!resp.ok) {
                throw new Error(`Failed to fetch token: ${resp.statusText}`);
            }
            const data = await resp.json();
            setToken(data.accessToken);
            setUrl(data.url);

            // Stop the preview track so LiveKit can take over
            if (localVideoTrack) {
                localVideoTrack.stop();
                setLocalVideoTrack(null);
            }

            setConnected(true);
        } catch (e: any) {
            console.error("Connection failed:", e);
            setConnectionError(e.message || "Failed to connect. Please try again.");
        } finally {
            setIsJoinLoading(false);
        }
    }

    if (!connected) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white p-6 relative overflow-hidden font-sans">
                {/* Animated Background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[120px] animate-float"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }}></div>
                </div>

                <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left Column: text */}
                    <div className="space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                AI Powered Speaking Coach
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
                                Master Your <br />
                                <span className="text-gradient">Communication</span>
                            </h1>
                            <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
                                Practice real-time conversations with an advanced AI avatar. Get instant feedback on your pacing, tone, and clarity.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 w-full sm:w-auto">
                            {connectionError && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3 text-sm animate-pulse">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    {connectionError}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <button
                                    onClick={connect}
                                    disabled={isJoinLoading || permissionState === 'denied'}
                                    className={`bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto ${permissionState === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isJoinLoading ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
                                    ) : (
                                        <>Start Session <ArrowRight className="w-5 h-5" /></>
                                    )}
                                </button>
                                <button className="px-8 py-4 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 w-full sm:w-auto">
                                    Learn More
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Video Preview Card */}
                    <div className="relative w-full max-w-xl mx-auto lg:mx-0">
                        <div className="glass-panel p-2 rounded-3xl shadow-2xl relative z-10">
                            <div className="aspect-video bg-zinc-900 rounded-2xl overflow-hidden relative border border-white/5 flex items-center justify-center">
                                {localVideoTrack ? (
                                    <VideoPreview track={localVideoTrack} />
                                ) : (
                                    <div className="text-center p-6 space-y-4 w-full flex flex-col items-center">
                                        {permissionState === 'denied' || permissionError ? (
                                            <>
                                                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/20">
                                                    <Lock className="w-10 h-10 text-red-500" />
                                                </div>
                                                <h3 className="text-white font-semibold text-xl">Permission Denied</h3>
                                                <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
                                                    The browser is blocking access. Click the
                                                    <span className="inline-flex items-center justify-center w-6 h-6 mx-1 bg-zinc-800 rounded align-middle"><Lock className="w-3 h-3" /></span>
                                                    icon in your address bar and reset permissions.
                                                </p>
                                                <button
                                                    onClick={() => { checkPermissionState(); enableVideo(); }}
                                                    className="px-6 py-2 bg-white text-black rounded-lg text-sm font-medium transition-colors hover:bg-zinc-200 mt-2 cursor-pointer"
                                                >
                                                    Try Again
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                                    <VideoOff className="w-8 h-8 text-zinc-500" />
                                                </div>
                                                <p className="text-zinc-500 text-sm">Initializing camera...</p>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
                                    <div className="flex gap-2">
                                        <div className={`backdrop-blur-md p-2 rounded-lg ${permissionState === 'denied' ? 'bg-red-500/20 text-red-400' : 'bg-black/50 text-white'}`}>
                                            {permissionState === 'denied' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                        </div>
                                        <div className={`backdrop-blur-md p-2 rounded-lg ${permissionState === 'denied' ? 'bg-red-500/20 text-red-400' : 'bg-black/50 text-white'}`}>
                                            {permissionState === 'denied' ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                        </div>
                                    </div>
                                    <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium text-white/80">
                                        {permissionState === 'denied' ? 'Access Blocked' : 'HD Preview'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl -z-10"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl -z-10"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={url}
            data-lk-theme="default"
            style={{ height: "100vh", backgroundColor: "var(--background)" }}
            onDisconnected={() => setConnected(false)}
            onError={(e) => {
                console.error("LiveKit Room Error:", e);
                setConnectionError("Room error: " + e.message);
            }}
        >
            <div className="flex flex-col h-full relative p-4 lg:p-6 gap-4">
                <ConnectionStateToast />
                {/* Header */}
                <header className="flex items-center justify-between p-4 glass-panel rounded-2xl z-50 h-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-none">Speaking Coach</h2>
                            <span className="text-xs text-green-400 font-medium tracking-wide">● LIVE SESSION</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-xs font-medium text-zinc-300">Recording</span>
                        </div>
                    </div>
                </header>

                {/* Main Grid */}
                <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/5 bg-zinc-900/50 shadow-2xl">
                    {/* Custom Grid Layout to hide audio-only agent */}
                    <MyVideoConference />      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
                        <CustomControlBar onDisconnect={() => setConnected(false)} />
                    </div>
                </div>
            </div>
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
}

function VideoPreview({ track }: { track: LocalVideoTrack }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            track.attach(videoRef.current);
        }
        return () => {
            track.detach();
        };
    }, [track]);

    return <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay muted playsInline />;
}

function MyVideoConference() {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: false },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false },
    );

    return (
        <GridLayout tracks={tracks} style={{ height: '100%' }}>
            <ParticipantTile />
        </GridLayout>
    );
}

function CustomControlBar({ onDisconnect }: { onDisconnect: () => void }) {
    const room = useRoomContext();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const toggleMic = async () => {
        if (room.localParticipant.isMicrophoneEnabled) {
            await room.localParticipant.setMicrophoneEnabled(false);
            setIsMuted(true);
        } else {
            await room.localParticipant.setMicrophoneEnabled(true);
            setIsMuted(false);
        }
    }

    const toggleVideo = async () => {
        if (room.localParticipant.isCameraEnabled) {
            await room.localParticipant.setCameraEnabled(false);
            setIsVideoOff(true);
        } else {
            await room.localParticipant.setCameraEnabled(true);
            setIsVideoOff(false);
        }
    }

    return (
        <div className="flex items-center justify-between gap-4 p-2 rounded-2xl glass-panel shadow-2xl backdrop-blur-2xl border border-white/10">
            <div className="flex items-center gap-2">
                <button onClick={toggleMic} className={`p-4 rounded-xl transition-all duration-300 ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button onClick={toggleVideo} className={`p-4 rounded-xl transition-all duration-300 ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
            </div>

            <button className="p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-all">
                <Settings className="w-5 h-5" />
            </button>

            <button onClick={() => { room.disconnect(); onDisconnect(); }} className="px-6 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all font-medium shadow-lg shadow-red-600/20 flex items-center gap-2 cursor-pointer">
                <PhoneOff className="w-5 h-5" />
                <span className="hidden sm:inline">End Call</span>
            </button>
        </div>
    )
}
