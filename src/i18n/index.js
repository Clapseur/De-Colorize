import fr from './fr.js'

// ultra light i18n helper: que FR pour le moment
const messages = { fr }
const current = 'fr'

export function t(key){
  const msg = messages[current]?.[key]
  return typeof msg === 'string' ? msg : key
}

export function useI18n(){
  return { t }
}

