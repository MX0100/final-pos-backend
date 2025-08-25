export const SuccessEnum = {
  TRUE: true,
  FALSE: false,
  PARTIAL: 'partial',
} as const;

export const SuccessEnumValues = [true, false, 'partial'] as const;
export type SuccessEnumType = (typeof SuccessEnumValues)[number];
