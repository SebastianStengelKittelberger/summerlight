import { useAppStore } from '../store/useAppStore';

const COUNTRIES = ['DE', 'AT', 'CH', 'FR', 'IT', 'GB', 'US', 'NL', 'ES', 'PL'];
const LANGUAGES = ['de', 'en', 'fr', 'it', 'nl', 'es', 'pl'];

export default function CountryLangSelector() {
  const country = useAppStore((s) => s.country);
  const language = useAppStore((s) => s.language);
  const setCountry = useAppStore((s) => s.setCountry);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <div className="flex gap-2 px-3 py-2">
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="flex-1 bg-slate-700 text-white text-sm rounded px-2 py-1 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {COUNTRIES.map((c) => (
          <option key={c} value={c.toLowerCase()}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="flex-1 bg-slate-700 text-white text-sm rounded px-2 py-1 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        {LANGUAGES.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
