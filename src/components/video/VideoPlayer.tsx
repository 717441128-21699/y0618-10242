import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import { useEditorStore } from '../../store/editorStore';

interface VideoPlayerProps {
  videoUrl: string;
  subtitles?: {
    src: string;
    srclang: string;
    label: string;
  }[];
  onTimeUpdate?: (time: number) => void;
  onReady?: (player: Player) => void;
}

export default function VideoPlayer({ videoUrl, subtitles, onTimeUpdate, onReady }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const { setCurrentTime, setIsPlaying } = useEditorStore();

  useEffect(() => {
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, {
      sources: [{ src: videoUrl, type: 'video/mp4' }],
      controls: true,
      fluid: true,
      aspectRatio: '16:9',
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      controlBar: {
        children: [
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'progressControl',
          'playbackRateMenuButton',
          'fullscreenToggle',
        ],
      },
    });

    playerRef.current = player;

    player.on('timeupdate', () => {
      const time = player.currentTime() * 1000;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    });

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));

    onReady?.(player);

    return () => {
      player.dispose();
    };
  }, [videoUrl, onTimeUpdate, onReady, setCurrentTime, setIsPlaying]);

  const seekTo = (timeMs: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(timeMs / 1000);
    }
  };

  useEditorStore.setState({ seekTo });

  return (
    <div className="video-container rounded-xl overflow-hidden shadow-2xl">
      <div data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered">
          {subtitles?.map((sub, i) => (
            <track
              key={i}
              kind="subtitles"
              src={sub.src}
              srcLang={sub.srclang}
              label={sub.label}
              default={i === 0}
            />
          ))}
        </video>
      </div>
    </div>
  );
}
