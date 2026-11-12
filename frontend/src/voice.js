// Voice, using only the browser (no backend, no audio is stored or sent).
//   1. Speech to text: SpeechRecognition (Chrome / Edge)
//   2. Text to speech: speechSynthesis (most browsers)
// If the browser does not support one of these, its button is hidden.

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition

export const canListen = Boolean(Recognition)
export const canSpeak = 'speechSynthesis' in window

// 1. Listen once and call onText with what the user said.
//    lang: "en-IN" (English, India) or "hi-IN" (Hindi).
export function listen(lang, onText, onEnd) {
  const recognition = new Recognition()
  recognition.lang = lang
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => onText(event.results[0][0].transcript)
  recognition.onerror = () => onEnd()
  recognition.onend = () => onEnd()

  recognition.start()
  return recognition // call .stop() on it to stop early
}

// 2. Read an answer aloud. Markdown symbols and [Source n] are removed first.
export function speak(text, onEnd) {
  const plain = text
    .replace(/[[【]\s*Source\s*\d+\s*[\]】]/g, '')
    .replace(/[*#_`>|]/g, '')
    .replace(/\s+/g, ' ')

  const utterance = new SpeechSynthesisUtterance(plain)
  utterance.lang = 'en-IN'
  utterance.onend = onEnd
  utterance.onerror = onEnd

  window.speechSynthesis.cancel() // stop anything already playing
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  window.speechSynthesis.cancel()
}
