import { useState, useEffect, useRef } from "react";

export function useVideoPlayer({
  durations,
  onSceneChange,
}: {
  durations: Record<string, number>;
  onSceneChange?: (scene: number) => void;
}) {
  const [currentScene, setCurrentScene] = useState(0);
  const durationsRef = useRef(durations);
  const onSceneChangeRef = useRef(onSceneChange);
  onSceneChangeRef.current = onSceneChange;

  useEffect(() => {
    const sequence = Object.values(durationsRef.current);
    if (sequence.length === 0) return;

    let isCancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const playSequence = async () => {
      if (typeof window !== "undefined" && (window as any).startRecording) {
        (window as any).startRecording();
      }

      while (!isCancelled) {
        for (let i = 0; i < sequence.length; i++) {
          if (isCancelled) return;
          setCurrentScene(i);
          onSceneChangeRef.current?.(i);
          await new Promise((resolve) => {
            timer = setTimeout(resolve, sequence[i]);
          });
        }
        if (isCancelled) return;

        if (typeof window !== "undefined" && (window as any).stopRecording) {
          (window as any).stopRecording();
          (window as any).stopRecording = undefined;
        }
      }
    };

    playSequence();

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return { currentScene };
}
