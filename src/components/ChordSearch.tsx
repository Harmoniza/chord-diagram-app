import { useState, useEffect, useRef } from "react";
import { Chord, Note, Scale } from "@tonaljs/tonal";
import * as chordType from "@tonaljs/chord-type";
import type { ChordType } from "@tonaljs/chord-type";
import * as Tone from "tone";
import Piano from "./Piano";
import ChordProgressionSection from "./Chord_Progression_Section";
import CollapsibleSection from "./CollapsibleSection";

const allRoots = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const chordTypes = chordType
  .all()
  .map((type: ChordType) => type.aliases?.[0])
  .filter((alias): alias is string => typeof alias === "string");

export default function ChordSearch() {
  const [query, setQuery] = useState("");
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [bassNote, setBassNote] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [playStyle, setPlayStyle] = useState<"chord" | "arpeggio">("chord");
  const [duration, setDuration] = useState<"short" | "medium" | "long">(
    "medium"
  );
  const [velocity, setVelocity] = useState<"low" | "medium" | "high">("medium");
  const [selectedMelody, setSelectedMelody] = useState<string[]>([]);
  const [harmonicsMode, setHarmonicsMode] = useState(false);
  const [loop, setLoop] = useState(false);
  const [eightBarLoop, setEightBarLoop] = useState(false);
  const [progression, setProgression] = useState<string[]>([]);

  const loopInterval = useRef<NodeJS.Timeout | null>(null);
  const velocityMap = { low: -24, medium: -12, high: 0 };
  const timeMap = { short: "4n", medium: "2n", long: "1n" };

  const filteredSuggestions = allRoots
    .flatMap((root) => chordTypes.map((type) => root + type))
    .filter((chordName) =>
      chordName.toLowerCase().startsWith(query.toLowerCase())
    )
    .slice(0, 10);

  useEffect(() => {
    if (loop && selectedChord) {
      loopInterval.current = setInterval(() => playChord(), 2000);
    } else if (loopInterval.current) {
      clearInterval(loopInterval.current);
    }
    return () => {
      if (loopInterval.current) clearInterval(loopInterval.current);
    };
  }, [
    loop,
    selectedChord,
    notes,
    bassNote,
    selectedMelody,
    playStyle,
    duration,
    isMuted,
  ]);

  function getHumanizedVelocity(): number {
    const base = velocityMap[velocity];
    const offset = (Math.random() - 0.5) * 4;
    return base + offset;
  }

  function handleSelect(chordName: string) {
    setSelectedChord(chordName);
    const chordInfo = Chord.get(chordName);
    const baseOctave = 4;
    let fullNotes = chordInfo.notes.map((n) => Note.pitchClass(n) + baseOctave);

    if (harmonicsMode) {
      fullNotes = fullNotes.map(
        (note, i) => Note.pitchClass(note) + (4 + Math.floor(i / 2))
      );
    }

    const root = chordInfo.tonic;
    setBassNote(root ? root + "2" : null);
    setNotes(fullNotes);
    setSelectedMelody([]);
    playChord(fullNotes);
  }

  function playChord(customNotes: string[] = notes) {
    if (isMuted || !customNotes.length) return;
    const allNotes = [
      ...(bassNote ? [bassNote] : []),
      ...customNotes,
      ...selectedMelody,
    ];
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = getHumanizedVelocity();

    Tone.start().then(() => {
      if (playStyle === "chord") {
        synth.triggerAttackRelease(allNotes, timeMap[duration]);
      } else {
        allNotes.forEach((note, i) => {
          synth.triggerAttackRelease(note, timeMap[duration], `+${i * 0.3}`);
        });
      }
    });
  }

  function playMelodyPreview() {
    if (!selectedMelody.length || isMuted) return;
    const synth = new Tone.Synth().toDestination();
    Tone.start().then(() => {
      selectedMelody.forEach((note, i) => {
        synth.triggerAttackRelease(note, "8n", `+${i * 0.3}`);
      });
    });
  }

  function addToProgression() {
    if (selectedChord) setProgression((prev) => [...prev, selectedChord]);
  }

  function playProgression() {
    if (!progression.length) return;
    let i = 0;
    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = getHumanizedVelocity();

    Tone.start().then(() => {
      const playNext = () => {
        if (i >= progression.length) {
          if (eightBarLoop) {
            i = 0;
            setTimeout(playNext, 1500);
            return;
          }
          return;
        }
        const chordInfo = Chord.get(progression[i]);
        const fullNotes = chordInfo.notes.map((n) => Note.pitchClass(n) + "4");
        synth.triggerAttackRelease(fullNotes, timeMap[duration]);
        i++;
        setTimeout(playNext, 1500);
      };
      playNext();
    });
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-20 p-6 bg-white rounded-2xl shadow-lg text-gray-900">
      <input
        type="text"
        placeholder="Type a chord (e.g. Cmaj, Dm7)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {query && filteredSuggestions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {filteredSuggestions.map((chord, index) => (
            <li
              key={index}
              onClick={() => handleSelect(chord)}
              className="cursor-pointer bg-gray-100 hover:bg-blue-100 px-4 py-2 rounded-md"
            >
              {chord}
            </li>
          ))}
        </ul>
      )}

      {selectedChord && (
        <>
          <CollapsibleSection title={`🎶 Chord: ${selectedChord}`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{selectedChord}</h2>
                <p className="text-gray-700">
                  Notes: {notes.map((n) => Note.pitchClass(n)).join(" - ")}
                </p>
              </div>
              <button
                onClick={addToProgression}
                className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                ➕ Add to Progression
              </button>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="🎛 Controls">
            <div className="flex flex-wrap gap-3">
              <label>
                <input
                  type="checkbox"
                  checked={isMuted}
                  onChange={() => setIsMuted(!isMuted)}
                />{" "}
                Mute
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={loop}
                  onChange={() => setLoop(!loop)}
                />{" "}
                Loop
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={eightBarLoop}
                  onChange={() => setEightBarLoop(!eightBarLoop)}
                />{" "}
                8-Bar Loop
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={harmonicsMode}
                  onChange={() => setHarmonicsMode(!harmonicsMode)}
                />{" "}
                Harmonics
              </label>

              <label>
                Style:
                <select
                  value={playStyle}
                  onChange={(e) => setPlayStyle(e.target.value as any)}
                  className="ml-2 border rounded p-1"
                >
                  <option value="chord">Chord</option>
                  <option value="arpeggio">Arpeggio</option>
                </select>
              </label>

              <label>
                Duration:
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as any)}
                  className="ml-2 border rounded p-1"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </label>

              <label>
                Velocity:
                <select
                  value={velocity}
                  onChange={(e) => setVelocity(e.target.value as any)}
                  className="ml-2 border rounded p-1"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="🎵 Melody Suggestions">
            <div className="flex flex-wrap gap-2 mb-3">
              {Scale.get(`${Note.pitchClass(notes[0])} major`).notes.map(
                (n) => (
                  <button
                    key={n}
                    onClick={() =>
                      setSelectedMelody((prev) =>
                        prev.includes(n + "5")
                          ? prev.filter((note) => note !== n + "5")
                          : [...prev, n + "5"]
                      )
                    }
                    className={`px-3 py-1 rounded-lg border text-sm ${
                      selectedMelody.includes(n + "5")
                        ? "bg-blue-400 text-white border-blue-600"
                        : "bg-gray-100 hover:bg-blue-100"
                    }`}
                  >
                    {n + "5"}
                  </button>
                )
              )}
            </div>
            <button
              onClick={playMelodyPreview}
              className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              ▶ Play Melody
            </button>
          </CollapsibleSection>

          <CollapsibleSection title="🎼 Chord Progression">
            <ChordProgressionSection
              onSelect={(chords) => {
                setProgression(chords);
                setSelectedChord(null);
                setNotes([]);
                setBassNote(null);
                setSelectedMelody([]);
              }}
            />
            {progression.length > 0 && (
              <div className="mt-4">
                <div className="flex gap-2 mt-2 flex-wrap">
                  {progression.map((chord, i) => (
                    <div
                      key={i}
                      className="px-3 py-1 bg-gray-100 rounded-md border"
                    >
                      {chord}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={playProgression}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    ▶ Play Progression
                  </button>
                  <button
                    onClick={() => setProgression([])}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    🗑 Clear
                  </button>
                </div>
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="🎹 Piano Visualizer">
            <Piano
              notes={[
                ...notes,
                ...(bassNote ? [bassNote] : []),
                ...selectedMelody,
              ]}
              bassNote={bassNote}
              melodyNotes={selectedMelody}
              muted={isMuted}
              playStyle={playStyle}
              duration={duration}
            />
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}
