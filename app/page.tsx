"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useState, useEffect } from "react";
import { Mic, Video, Monitor, PhoneOff, Settings, Users, MessageSquare } from "lucide-react";

export default function Home() {
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [connected, setConnected] = useState(false);
  const [isJoinLoading, setIsJoinLoading] = useState(false);

  async function connect() {
    setIsJoinLoading(true);
    try {
      const resp = await fetch("/api/token?room=room-01&username=user");
      const data = await resp.json();
      setToken(data.accessToken);
      setUrl(data.url);
      setConnected(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsJoinLoading(false);
    }
  }

  if (!connected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] text-white p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="z-10 w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl shadow-2xl border border-white/5">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 mb-4 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Speaking Coach AI</h1>
            <p className="text-zinc-400 text-sm">
              Your personal AI assistant for improving presentation and communication skills.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Microphone</span>
                <span className="text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">Ready</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Camera</span>
                <span className="text-green-400 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">Ready</span>
              </div>
            </div>

            <button
              onClick={connect}
              disabled={isJoinLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isJoinLoading ? (
                <span className="animate-pulse">Connecting...</span>
              ) : (
                <>Start Session <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
            <p className="text-center text-xs text-zinc-500">
              Powered by LiveKit & Tavus
            </p>
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
      style={{ height: "100vh", backgroundColor: "#09090b" }}
      onDisconnected={() => setConnected(false)}
    >
      <div className="flex flex-col h-full relative">
        <MyVideoConference />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
          <CustomControlBar onDisconnect={() => setConnected(false)} />
        </div>
      </div>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
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
    <div className="h-full w-full p-4">
      <GridLayout tracks={tracks} style={{ height: '100%' }}>
        <ParticipantTile className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900" />
      </GridLayout>
    </div>
  );
}

function CustomControlBar({ onDisconnect }: { onDisconnect: () => void }) {
  const { room } = useRoomContext();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const toggleMic = () => {
    if (room.localParticipant.isMicrophoneEnabled) {
      room.localParticipant.setMicrophoneEnabled(false);
      setIsMuted(true);
    } else {
      room.localParticipant.setMicrophoneEnabled(true);
      setIsMuted(false);
    }
  }

  const toggleVideo = () => {
    if (room.localParticipant.isCameraEnabled) {
      room.localParticipant.setCameraEnabled(false);
      setIsVideoOff(true);
    } else {
      room.localParticipant.setCameraEnabled(true);
      setIsVideoOff(false);
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl glass-panel shadow-2xl">
      <button onClick={toggleMic} className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}>
        {isMuted ? <MicOffIcon className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      <button onClick={toggleVideo} className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}>
        {isVideoOff ? <VideoOffIcon className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </button>

      <div className="w-px h-8 bg-white/10 mx-1"></div>

      <button onClick={() => room.disconnect()} className="p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/20">
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  )
}

function ArrowRightIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
  )
}

function MicOffIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" x2="23" y1="1" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2" /><line x1="12" x2="12" y1="19" y2="22" /><line x1="8" x2="16" y1="22" y2="22" /></svg>
  )
}

function VideoOffIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><line x1="1" x2="23" y1="1" y2="23" /></svg>
  )
}
