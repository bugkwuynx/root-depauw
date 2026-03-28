export type CatalogGoalItem = { id: string; label: string };

export type CatalogGoalGroup = { title: string; goals: CatalogGoalItem[] };

export const GOAL_CATALOG: CatalogGoalGroup[] = [
  {
    title: 'Body & rest',
    goals: [
      { id: 'move', label: 'Move my body regularly' },
      { id: 'sleep', label: 'Sleep on a steadier rhythm' },
      { id: 'nourish', label: 'Eat in a way that feels nourishing' },
    ],
  },
  {
    title: 'Mind & mood',
    goals: [
      { id: 'stress', label: 'Ease stress or worry' },
      { id: 'calm', label: 'Build calm and focus' },
      { id: 'reflect', label: 'Reflect or practice gratitude' },
    ],
  },
  {
    title: 'Growth & direction',
    goals: [
      { id: 'learn', label: 'Learn something new' },
      { id: 'purpose', label: 'Progress on work or a creative path' },
      { id: 'money', label: 'Feel clearer about money habits' },
    ],
  },
  {
    title: 'Connection & space',
    goals: [
      { id: 'people', label: 'Spend meaningful time with others' },
      { id: 'space', label: 'Care for my home or surroundings' },
      { id: 'boundaries', label: 'Pull back from habits that drain me' },
    ],
  },
];

const PRESET_LABELS = new Map<string, string>();
for (const g of GOAL_CATALOG) {
  for (const item of g.goals) {
    PRESET_LABELS.set(item.id, item.label);
  }
}

export function getPresetLabel(presetId: string): string {
  return PRESET_LABELS.get(presetId) ?? presetId;
}

export function getAllPresetIds(): string[] {
  return [...PRESET_LABELS.keys()];
}
