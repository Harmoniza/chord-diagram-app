import type { FC } from "react";

type ProgressionTemplate = {
  name: string;
  chords: string[];
  genre: string;
  mood: string;
  description: string;
};

type Props = {
  onSelect: (chords: string[]) => void;
};

const templates: ProgressionTemplate[] = [
  {
    name: "Romantic Trap Ballad",
    chords: ["Dm7", "G7", "Cmaj7", "Fmaj7"],
    genre: "Trap/R&B",
    mood: "Romantic",
    description:
      "Smooth emotional progressions with jazzy overtones for vocals or melodies.",
  },
  {
    name: "Lofi Chill Set",
    chords: ["Am7", "Em7", "Fmaj7", "G6"],
    genre: "Lofi",
    mood: "Relaxed",
    description: "Great for ambient, cozy beats. Jazzy and relaxed tone.",
  },
  {
    name: "Bedroom Pop Vibe",
    chords: ["Cmaj7", "Am", "Fmaj7", "G"],
    genre: "Pop",
    mood: "Intimate",
    description:
      "Sweet and vibrant feel good chords for vocal tracks and hooks.",
  },
  {
    name: "Boom Bap Groove",
    chords: ["Cm7", "Abmaj7", "Bb7", "G7"],
    genre: "Boom Bap",
    mood: "Classic / Underground",
    description:
      "Old-school vibe with a jazzy swing – perfect for laid-back beats.",
  },
];

const ChordProgressionSection: FC<Props> = ({ onSelect }) => {
  return (
    <div className="mt-12 p-6 bg-gray-100 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        🎼 Explore More Progression Ideas
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.name}
            onClick={() => onSelect(template.chords)}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:bg-blue-50 cursor-pointer transition"
          >
            <h3 className="text-lg font-semibold text-indigo-700">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Genre:</strong> {template.genre} &nbsp;|&nbsp;
              <strong>Mood:</strong> {template.mood}
            </p>
            <p className="text-gray-700 mt-2 text-sm">{template.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {template.chords.map((chord) => (
                <span
                  key={chord}
                  className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs border"
                >
                  {chord}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChordProgressionSection;
