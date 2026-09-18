import { UserPresence } from '../types/collaboration';

export const USER_PALETTES = [
  { name: 'Indigo', color: '#6366f1', light: 'rgba(99, 102, 241, 0.2)' },
  { name: 'Emerald', color: '#10b981', light: 'rgba(16, 185, 129, 0.2)' },
  { name: 'Rose', color: '#f43f5e', light: 'rgba(244, 63, 94, 0.2)' },
  { name: 'Amber', color: '#f59e0b', light: 'rgba(245, 158, 11, 0.2)' },
  { name: 'Cyan', color: '#06b6d4', light: 'rgba(6, 182, 212, 0.2)' },
  { name: 'Purple', color: '#a855f7', light: 'rgba(168, 85, 247, 0.2)' },
  { name: 'Fuchsia', color: '#d946ef', light: 'rgba(217, 70, 239, 0.2)' },
  { name: 'Blue', color: '#3b82f6', light: 'rgba(59, 130, 246, 0.2)' },
];

const ADJECTIVES = ['Swift', 'Bright', 'Cosmic', 'Solar', 'Lunar', 'Neon', 'Quantum', 'Hyper', 'Velox', 'Stellar', 'Atomic', 'Cyber'];
const NOUNS = ['Falcon', 'Fox', 'Otter', 'Lynx', 'Phoenix', 'Panda', 'Eagle', 'Hawk', 'Wolf', 'Tiger', 'Viper', 'Orbit'];

export function generateRandomUser(customId?: string): UserPresence {
  const id = customId || Math.random().toString(36).substring(2, 9);
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const palette = USER_PALETTES[Math.floor(Math.random() * USER_PALETTES.length)];

  return {
    id,
    name: `${adj} ${noun}`,
    color: palette.color,
    colorLight: palette.light,
  };
}
