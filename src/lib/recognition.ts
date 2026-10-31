export type TeamMember = { id: string; displayName: string; role: string; avatar: string };
export type Badge = { id: string; label: string; icon: string; description: string; color: string };
export type Recognition = {
  id: string;
  senderId: string;
  recipientId: string;
  badgeId: string;
  message: string;
  createdAt: string;
};
export type RecognitionInput = Pick<Recognition, "recipientId" | "badgeId" | "message">;
export type FormErrors = Partial<Record<keyof RecognitionInput, string>>;

export const CURRENT_USER_ID = "alex";
export const STORAGE_KEY = "team-recognition:v1";
export const MAX_MESSAGE_LENGTH = 500;

export const team: TeamMember[] = [
  { id: "alex", displayName: "Alex Morgan", role: "Product designer", avatar: "/avatars/alex.png" },
  { id: "maya", displayName: "Maya Chen", role: "Frontend engineer", avatar: "/avatars/maya.png" },
  { id: "jordan", displayName: "Jordan Ellis", role: "Product manager", avatar: "/avatars/jordan.png" },
  { id: "sam", displayName: "Sam Rivera", role: "Backend engineer", avatar: "/avatars/sam.png" },
  { id: "priya", displayName: "Priya Shah", role: "UX researcher", avatar: "/avatars/priya.png" },
  { id: "leo", displayName: "Leo Park", role: "Quality engineer", avatar: "/avatars/leo.png" },
  { id: "avery", displayName: "Avery Brooks", role: "People partner", avatar: "/avatars/avery.png" },
];

export const badges: Badge[] = [
  { id: "team-player", label: "Team Player", icon: "handshake", description: "Better, together", color: "green" },
  { id: "above-beyond", label: "Above & Beyond", icon: "sparkles", description: "That extra mile", color: "coral" },
  { id: "bright-idea", label: "Bright Idea", icon: "lightbulb", description: "A fresh perspective", color: "gold" },
  { id: "making-impact", label: "Making an Impact", icon: "target", description: "Work that matters", color: "blue" },
];

export function validateRecognition(input: RecognitionInput, senderId = CURRENT_USER_ID): FormErrors {
  const errors: FormErrors = {};
  if (!team.some((member) => member.id === input.recipientId)) errors.recipientId = "Choose a teammate.";
  else if (input.recipientId === senderId) errors.recipientId = "Choose someone other than yourself.";
  if (!badges.some((badge) => badge.id === input.badgeId)) errors.badgeId = "Choose a recognition badge.";
  if (!input.message.trim()) errors.message = "Add a thank-you message.";
  else if (input.message.length > MAX_MESSAGE_LENGTH) errors.message = "Keep your message to 500 characters.";
  return errors;
}

export function seedRecognitions(now = new Date()): Recognition[] {
  return [
    { id: "seed-1", senderId: "jordan", recipientId: "maya", badgeId: "above-beyond", message: "You made a tricky launch feel effortless. Thanks for staying curious, catching the details, and helping everyone get over the finish line.", createdAt: new Date(now.getTime() - 35 * 60_000).toISOString() },
    { id: "seed-2", senderId: "priya", recipientId: "sam", badgeId: "team-player", message: "Thanks for taking the time to walk us through the new API. Your patience made a real difference to the whole team.", createdAt: new Date(now.getTime() - 3 * 3_600_000).toISOString() },
    { id: "seed-3", senderId: "alex", recipientId: "priya", badgeId: "bright-idea", message: "Your research reframed the problem in exactly the way we needed. That small insight turned into a much better experience.", createdAt: new Date(now.getTime() - 22 * 3_600_000).toISOString() },
    { id: "seed-4", senderId: "avery", recipientId: "leo", badgeId: "making-impact", message: "The accessibility issues you spotted helped us make this release better for everyone. Thank you for being so thoughtful about the details.", createdAt: new Date(now.getTime() - 28 * 3_600_000).toISOString() },
  ];
}

export function newestFirst(records: Recognition[]): Recognition[] {
  return [...records].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
}

function isRecognition(value: unknown): value is Recognition {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (!["id", "senderId", "recipientId", "badgeId", "message", "createdAt"].every((key) => typeof record[key] === "string")) return false;
  const typed = record as Recognition;
  return Boolean(typed.id) && team.some((member) => member.id === typed.senderId)
    && Object.keys(validateRecognition(typed, typed.senderId)).length === 0
    && /^\d{4}-\d{2}-\d{2}T/.test(typed.createdAt) && Number.isFinite(Date.parse(typed.createdAt));
}

export function restoreRecognitions(serialized: string | null): Recognition[] {
  if (serialized === null) return seedRecognitions();
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed) || !parsed.every(isRecognition)) return seedRecognitions();
    if (new Set(parsed.map((record) => record.id)).size !== parsed.length) return seedRecognitions();
    return newestFirst(parsed);
  } catch {
    return seedRecognitions();
  }
}

export function loadRecognitions(storage: Pick<Storage, "getItem">): { records: Recognition[]; available: boolean } {
  try {
    return { records: restoreRecognitions(storage.getItem(STORAGE_KEY)), available: true };
  } catch {
    return { records: seedRecognitions(), available: false };
  }
}

export function saveRecognitions(storage: Pick<Storage, "setItem">, records: Recognition[]): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}