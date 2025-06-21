import { useState, useEffect, useRef } from "react";
import { Chord, Note, Scale } from "@tonaljs/tonal";
import * as chordType from "@tonaljs/chord-type";
import type { ChordType } from "@tonaljs/chord-type";
import * as Tone from "tone";
import Piano from "./Piano";

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

// Add progression templates here
const progressionTemplates: { [label: string]: string[] } = {
  "I–V–vi–IV": ["Cmaj", "Gmaj", "Am", "Fmaj"],
  "ii–V–I": ["Dm7", "G7", "Cmaj7"],
  "12-Bar Blues": ["C7", "F7", "C7", "G7"],
};

export default function ChordSearch() {
  const [query, setQuery] = useState("");
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [bassNote, setBassNote] = useState<string | null>(null);
  const [useRootAsBass, setUseRootAsBass] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playStyle, setPlayStyle] = useState<"chord" | "arpeggio">("chord");
  const [duration, setDuration] = useState<"short" | "medium" | "long">(
    "medium"
  );
  const [velocity, setVelocity] = useState<"low" | "medium" | "high">("medium");
  const [selectedMelody, setSelectedMelody] = useState<string[]>([]);
  const [inversion, setInversion] = useState(false);
  const [harmonicsMode, setHarmonicsMode] = useState(false);
  const [loop, setLoop] = useState(false);
  const [eightBarLoop, setEightBarLoop] = useState(false); // new toggle for 8 bar loop
  const [progression, setProgression] = useState<string[]>([]);

  const loopInterval = useRef<NodeJS.Timeout | null>(null);

  // Your velocity map with dB values
  const velocityMap = { low: -24, medium: -12, high: 0 };

  // Your existing time map for durations
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
    } else {
      if (loopInterval.current) clearInterval(loopInterval.current);
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

  // Adds a tiny random velocity offset for humanized feel
  function getHumanizedVelocity(): number {
    // Tone.Volume values are in dB, so small random offset
    const base = velocityMap[velocity];
    const offset = (Math.random() - 0.5) * 4; // ±2 dB random
    return base + offset;
  }

  function handleSelect(chordName: string) {
    setSelectedChord(chordName);
    const chordInfo = Chord.get(chordName);
    const baseOctave = 4;
    let fullNotes = chordInfo.notes.map((n) => Note.pitchClass(n) + baseOctave);

    if (inversion) fullNotes = [...fullNotes.slice(1), fullNotes[0]];
    if (harmonicsMode) {
      fullNotes = fullNotes.map(
        (note, i) => Note.pitchClass(note) + (4 + Math.floor(i / 2))
      );
    }

    const root = chordInfo.tonic;
    setBassNote(useRootAsBass && root ? root + "2" : null);
    setNotes(fullNotes);
    setSelectedMelody([]);
    playChord(fullNotes);
  }

  function suggestBassNotes(): string[] {
    if (!selectedChord) return [];
    const chordInfo = Chord.get(selectedChord);
    return [0, 2, 4].map(
      (i) => chordInfo.notes[i % chordInfo.notes.length] + "2"
    );
  }

  function handleBassClick(note: string) {
    setBassNote(note);
  }

  function suggestMelodyNotes(): string[] {
    if (!selectedChord) return [];
    const chordInfo = Chord.get(selectedChord);
    if (!chordInfo.tonic) return [];
    return Scale.get(`${chordInfo.tonic} major`).notes.map((n) => n + "5");
  }

  function toggleMelodyNote(note: string) {
    setSelectedMelody((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  }

  function clearMelody() {
    setSelectedMelody([]);
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

  // Play progression with optional 8-bar loop toggle
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

  function clearProgression() {
    setProgression([]);
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
          <div className="mt-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{selectedChord}</h2>
              <p className="text-gray-700">
                Notes: {notes.map((n) => n.slice(0, -1)).join(" - ")}
              </p>
            </div>
            <button
              onClick={addToProgression}
              className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              ➕ Add to Progression
            </button>
          </div>

          {/* Suggested Bass Notes */}
          <div className="mt-4">
            <p className="font-medium mb-1">Suggested Bass Notes:</p>
            <div className="flex flex-wrap gap-2">
              {suggestBassNotes().map((note) => (
                <button
                  key={note}
                  onClick={() => handleBassClick(note)}
                  className={`px-3 py-1 rounded-lg border text-sm ${
                    bassNote === note
                      ? "bg-yellow-300 border-yellow-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Melody Suggestions */}
          <div className="mt-6">
            <p className="font-medium text-lg mb-2">🎵 Melody Suggestions</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestMelodyNotes().map((note) => (
                <button
                  key={note}
                  onClick={() => toggleMelodyNote(note)}
                  className={`px-3 py-1 rounded-lg border text-sm ${
                    selectedMelody.includes(note)
                      ? "bg-blue-400 text-white border-blue-600"
                      : "bg-gray-100 hover:bg-blue-100"
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={playMelodyPreview}
                className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                ▶ Play Melody
              </button>
              <button
                onClick={clearMelody}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                ❌ Clear
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex flex-wrap gap-4 items-center">
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
                  checked={inversion}
                  onChange={() => setInversion(!inversion)}
                />{" "}
                Inversion
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
                  checked={useRootAsBass}
                  onChange={() => setUseRootAsBass(!useRootAsBass)}
                />{" "}
                Use Root as Bass
              </label>

              {/* New 8-Bar Loop Toggle */}
              <label>
                <input
                  type="checkbox"
                  checked={eightBarLoop}
                  onChange={() => setEightBarLoop(!eightBarLoop)}
                />{" "}
                8-Bar Loop
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
          </div>

          {/* Progression Templates */}
          <div className="mt-6">
            <label className="font-medium text-sm">
              Progression Templates:
            </label>
            <select
              className="ml-2 border p-1 rounded text-sm"
              onChange={(e) => {
                const selected = e.target.value;
                if (selected && progressionTemplates[selected]) {
                  setProgression(progressionTemplates[selected]);
                  setSelectedChord(null);
                  setNotes([]);
                  setBassNote(null);
                  setSelectedMelody([]);
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Choose a progression
              </option>
              {Object.keys(progressionTemplates).map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Timeline */}
          {progression.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium">Chord Progression</h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                {progression.map((chord, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1 bg-gray-100 rounded-md border cursor-default select-none"
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
                  onClick={clearProgression}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  🗑 Clear
                </button>
              </div>
            </div>
          )}

          {/* Piano UI */}
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
        </>
      )}
    </div>
  );
}
