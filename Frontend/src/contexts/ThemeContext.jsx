import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { preferencesApi } from '../api'

const ThemeContext = createContext(null)

export const DEFAULT_PREFS = {
  app_name:        'SenMed',
  app_slogan:      'Soins Médicaux',
  app_initial:     'SM',
  primary_color:   '#002f59',
  accent_color:    '#ff7631',
  theme_mode:      'light',
  density:         'normal',
  sidebar_default: 'expanded',
  language:        'fr',
  currency:        'FCFA',
  date_format:     'DD/MM/YYYY',
  default_page:    '/',
}

// Convertit un hex (#rrggbb) + alpha hex 2 chiffres en rgba(...)
function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${(parseInt(a, 16) / 255).toFixed(3)})`
}

// Suffixes hex utilisés dans les composants : fond, bordure, ombre
const ALPHAS = ['04','05','06','08','0d','10','12','14','15','18','1a',
                '20','28','30','35','40','4d','50','59','60','66','80','99','cc']

function applyTheme(p) {
  const root = document.documentElement
  root.style.setProperty('--app-primary', p.primary_color)
  root.style.setProperty('--app-accent',  p.accent_color)

  // Variables alpha pour chaque suffixe hex (ex: --app-accent-20, --app-primary-30)
  ALPHAS.forEach(a => {
    root.style.setProperty(`--app-accent-${a}`,  hexAlpha(p.accent_color,  a))
    root.style.setProperty(`--app-primary-${a}`, hexAlpha(p.primary_color, a))
  })

  document.documentElement.setAttribute('data-theme', p.theme_mode)

  if (p.theme_mode === 'dark') {
    document.body.style.background = '#0f172a'
    document.body.style.color      = '#e2e8f0'
  } else {
    document.body.style.background = ''
    document.body.style.color      = ''
  }

  if (p.app_name) document.title = p.app_name
}

export function ThemeProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('app_prefs')
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS
    } catch {
      return DEFAULT_PREFS
    }
  })

  // Keep a ref always pointing to the latest saved prefs (not previewed)
  const savedPrefsRef = useRef(prefs)

  useEffect(() => {
    applyTheme(prefs)

    preferencesApi.get()
      .then(res => {
        if (res.data?.data) {
          const p = { ...DEFAULT_PREFS, ...res.data.data }
          savedPrefsRef.current = p
          setPrefs(p)
          localStorage.setItem('app_prefs', JSON.stringify(p))
          applyTheme(p)
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Preview without persisting — takes the FULL prefs object
  const previewPrefs = (fullPrefs) => {
    setPrefs(fullPrefs)
    applyTheme(fullPrefs)
  }

  // Restore to last saved state (used by modal Cancel)
  const revertPrefs = () => {
    setPrefs(savedPrefsRef.current)
    applyTheme(savedPrefsRef.current)
  }

  const savePrefs = async (data) => {
    const next = { ...DEFAULT_PREFS, ...data }
    await preferencesApi.save(next)
    savedPrefsRef.current = next
    setPrefs(next)
    localStorage.setItem('app_prefs', JSON.stringify(next))
    applyTheme(next)
    return next
  }

  return (
    <ThemeContext.Provider value={{ prefs, previewPrefs, revertPrefs, savePrefs }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
