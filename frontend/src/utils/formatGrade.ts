export function formatGrade(score: number | null | undefined, maxScore: number | null | undefined) {
  if (score == null || maxScore == null) {
    return 'Not graded';
  }
  return `${Math.round(score)} / ${Math.round(maxScore)}`;
}
