import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import * as Tone from "tone";

type PianoProps = {
  notes: string[]; // Chord notes
  bassNote?: string | null;
  melodyNotes?: string[];
  muted: boolean;
  playStyle: "chord" | "arpeggio";
  duration: "short" | "medium" | "long";
};

const whiteNotes = ["C", "D", "E", "F", "G", "A", "B"];
const blackNotes = ["C#", "D#", "F#", "G#", "A#"];

const generateWhiteKeys = (startOctave = 3, octaves = 3) => {
  const keys = [];
  for (let i = startOctave; i < startOctave + octaves; i++) {
    for (const note of whiteNotes) {
      keys.push(note + i);
    }
  }
  return keys;
};

const generateBlackKeys = (startOctave = 3, octaves = 3) => {
  const keys: { note: string; position: number }[] = [];
  let index = 0;
  for (let i = startOctave; i < startOctave + octaves; i++) {
    for (let j = 0; j < whiteNotes.length; j++) {
      const note = whiteNotes[j];
      const sharp = note + "#";
      if (blackNotes.includes(sharp)) {
        keys.push({ note: sharp + i, position: index });
      }
      index++;
    }
  }
  return keys;
};

const Piano: FC<PianoProps> = ({
  notes,
  bassNote,
  melodyNotes = [],
  muted,
  playStyle,
  duration,
}) => {
  const whiteKeyWidth = 50;
  const whiteKeyHeight = 200;
  const blackKeyWidth = 30;
  const blackKeyHeight = 120;

  const whiteKeys = generateWhiteKeys(3, 3);
  const blackKeys = generateBlackKeys(3, 3);

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const [playedNotes, setPlayedNotes] = useState<string[]>([]);

  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if ((!notes.length && !melodyNotes.length) || muted) return;

    const timeMap = {
      short: "4n",
      medium: "2n",
      long: "1n",
    };

    const combined = [
      ...(bassNote ? [bassNote] : []),
      ...notes,
      ...melodyNotes,
    ];

    setPlayedNotes(combined);
    setTimeout(() => setPlayedNotes([]), 400); // Reset pulse effect

    Tone.start().then(() => {
      const synth = synthRef.current;
      if (!synth) return;

      if (playStyle === "chord") {
        synth.triggerAttackRelease(combined, timeMap[duration]);
      } else {
        combined.forEach((note, i) => {
          synth.triggerAttackRelease(note, timeMap[duration], `+${i * 0.25}`);
        });
      }
    });
  }, [notes, bassNote, melodyNotes, muted, playStyle, duration]);

  return (
    <div
      className="overflow-x-auto max-w-full px-4 pb-6"
      style={{ minWidth: "700px" }}
    >
      <div
        className="relative mx-auto mt-10 rounded-xl shadow-md"
        style={{
          width: whiteKeys.length * whiteKeyWidth,
          height: whiteKeyHeight,
          userSelect: "none",
          position: "relative",
        }}
      >
        {/* White Keys */}
        <div className="flex relative z-10">
          {whiteKeys.map((note) => {
            const isChordNote = notes.includes(note);
            const isBassNote = bassNote === note;
            const isMelodyNote = melodyNotes.includes(note);
            const isPlayed = playedNotes.includes(note);

            const bg = isBassNote
              ? "#c084fc"
              : isMelodyNote
              ? "#5eead4"
              : isChordNote
              ? "#fde047"
              : "white";

            const glow =
              isBassNote || isMelodyNote || isChordNote
                ? "0 0 10px rgba(253, 224, 71, 0.8)"
                : "none";

            return (
              <div
                key={note}
                style={{
                  width: whiteKeyWidth,
                  height: whiteKeyHeight,
                  backgroundColor: bg,
                  border: "1px solid gray",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  paddingBottom: 8,
                  fontSize: 12,
                  position: "relative",
                  boxShadow: glow,
                  transition: "all 0.3s",
                  borderRadius: "0 0 6px 6px",
                  transform: isPlayed ? "scale(1.05)" : "scale(1)",
                }}
                title={note}
              >
                {note}
              </div>
            );
          })}
        </div>

        {/* Black Keys */}
        {blackKeys.map(({ note, position }) => {
          const isChordNote = notes.includes(note);
          const isBassNote = bassNote === note;
          const isMelodyNote = melodyNotes.includes(note);
          const isPlayed = playedNotes.includes(note);

          const bg = isBassNote
            ? "#c084fc"
            : isMelodyNote
            ? "#2dd4bf"
            : isChordNote
            ? "#facc15"
            : "black";

          const glow =
            isBassNote || isMelodyNote || isChordNote
              ? "0 0 12px rgba(250, 204, 21, 0.9)"
              : "none";

          return (
            <div
              key={note}
              style={{
                position: "absolute",
                top: 0,
                left:
                  position * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2,
                width: blackKeyWidth,
                height: blackKeyHeight,
                backgroundColor: bg,
                zIndex: 20,
                borderRadius: "0 0 6px 6px",
                boxShadow: glow,
                transition: "all 0.3s",
                transform: isPlayed ? "scale(1.05)" : "scale(1)",
              }}
              title={note}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Piano;
