export type LaborStageKey = 'early' | 'active' | 'transition' | 'unknown' | 'not_enough_data';

interface Contraction {
  startTime: number;
  endTime: number | null;
}

interface LaborStageResult {
  stage: LaborStageKey;
  title: string;
  description: string;
  recommendation: string;
  color: string;
}

export function determineLaborStage(contractions: Contraction[]): LaborStageResult {
  // Filter only completed contractions or valid ones
  // We need at least 3 contractions to establish a pattern (2 intervals)
  const completed = contractions.filter(c => c.endTime !== null);
  
  if (completed.length < 3) {
    return {
      stage: 'not_enough_data',
      title: 'אין מספיק נתונים',
      description: 'המערכת צריכה לפחות 3 צירים מלאים כדי לנתח את השלב.',
      recommendation: 'המשיכי לתזמן עוד קצת...',
      color: 'bg-gray-100 text-gray-800'
    };
  }

  // Analyze the last 3 contractions/intervals
  const recent = completed.slice(0, 5); // Take last 5 for better average if available
  const count = recent.length;

  // Calculate average duration
  const avgDurationMs = recent.reduce((sum, c) => sum + ((c.endTime || 0) - c.startTime), 0) / count;
  const avgDurationSec = avgDurationMs / 1000;

  // Calculate average interval (frequency)
  // Interval is Start(current) - Start(prev)
  // Since our array is usually newest first (descending time), interval is start(current) - start(next)
  // But wait, in App.tsx `contractions` state: "return [newContraction, ...prev];" -> Newest is at index 0.
  
  let totalIntervalMs = 0;
  let intervalCount = 0;

  for (let i = 0; i < count - 1; i++) {
    const current = recent[i]; // Newest
    const older = recent[i + 1]; // Older
    const interval = current.startTime - older.startTime;
    totalIntervalMs += interval;
    intervalCount++;
  }

  const avgIntervalMs = intervalCount > 0 ? totalIntervalMs / intervalCount : 0;
  const avgIntervalMin = avgIntervalMs / 1000 / 60;

  console.log({ avgDurationSec, avgIntervalMin });

  // Logic based on researching standard 5-1-1 and stages
  
  // Transition: < 3 min apart, > 60s long
  // Often 60-90s duration, 2-3 min frequency
  if (avgIntervalMin <= 3 && avgIntervalMin > 1 && avgDurationSec >= 60) {
    return {
      stage: 'transition',
      title: 'שלב המעבר (Transition)',
      description: 'זהו השלב האינטנסיבי ביותר לפני הלידה. הצירים תכופים (כל 2-3 דקות) וארוכים (מעל דקה).',
      recommendation: 'זה הזמן להיות בבית החולים או לקרוא למיילדת. נשמי עמוק, את קרובה מאוד!',
      color: 'bg-purple-100 text-purple-900 border-purple-200'
    };
  }

  // Active Labor: 3-5 min apart, 45-60s long
  // 5-1-1 Rule: 5 min apart, 1 min long, for 1 hour.
  if (avgIntervalMin <= 5 && avgIntervalMin > 3 && avgDurationSec >= 45) {
    return {
      stage: 'active',
      title: 'לידה פעילה (Active Labor)',
      description: 'הצירים סדירים, כל 3-5 דקות, ונמשכים כ-45-60 שניות (חוק 5-1-1).',
      recommendation: 'אם דפוס זה נמשך כשעה, מומלץ ליצור קשר עם חדר הלידה ולהתארגן ליציאה.',
      color: 'bg-rose-100 text-rose-900 border-rose-200'
    };
  }

  // Early Labor: > 5 min apart, < 45s long usually, or irregular
  if (avgIntervalMin > 5 || avgDurationSec < 45) {
    return {
      stage: 'early',
      title: 'שלב לטנטי (Early Labor)',
      description: 'הצירים עדיין רחוקים יחסית (מעל 5 דקות) או קצרים. זהו השלב הראשון והארוך ביותר.',
      recommendation: 'נסי לנוח, לשתות מים, ולהעביר את הזמן בנעימים בבית. אין צורך לרוץ עדיין.',
      color: 'bg-blue-50 text-blue-900 border-blue-200'
    };
  }

  return {
    stage: 'unknown',
    title: 'דפוס לא ברור',
    description: 'הנתונים עדיין לא מראים דפוס מובהק של אחד משלבי הלידה המוכרים.',
    recommendation: 'המשיכי לעקוב. אם את חשה כאב חריג או ירידת מים, פני לייעוץ רפואי.',
    color: 'bg-gray-50 text-gray-900 border-gray-200'
  };
}
