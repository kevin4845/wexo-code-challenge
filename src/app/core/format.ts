const countFormat = new Intl.NumberFormat('en');
const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const languageNames: Readonly<Record<string, string>> = {
  en: 'English',
  da: 'Danish',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  hi: 'Hindi',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  nl: 'Dutch',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  ru: 'Russian',
  sv: 'Swedish',
  zh: 'Chinese',
};

export function formatCount(value: number): string {
  return countFormat.format(value);
}

/** `148` becomes `2h 28m`. Missing or zero runtimes are omitted rather than shown as 0. */
export function formatRuntime(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) {
    return null;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest}m`;
  }
  if (rest === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${rest}m`;
}

export function formatReleaseDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return dateFormat.format(date);
}

export function formatVote(value: number | null): string | null {
  if (value === null) {
    return null;
  }
  return value.toFixed(1);
}

export function languageName(code: string | null): string | null {
  if (!code) {
    return null;
  }
  return languageNames[code] ?? code.toUpperCase();
}
