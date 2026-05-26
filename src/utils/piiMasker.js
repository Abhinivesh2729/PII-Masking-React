const NAME_STOP_WORDS = new Set([
  "My", "Your", "His", "Her", "Their", "Our",
  "First", "Last", "Full", "Good", "Hi", "Hello", "Hey",
  "Thank", "Thanks", "Real", "New", "Old", "Dear",
  "The", "A", "An", "This", "That", "These", "Those",
  "I", "You", "He", "She", "We", "They", "It",
  "Am", "Are", "Is", "Was", "Were", "Be", "Been", "Being",
  "Will", "Would", "Should", "Could", "Can", "May", "Might",
  "Yes", "No", "Okay", "Ok",
  "Mr", "Mrs", "Ms", "Dr",
  "At", "On", "In", "By", "To", "From", "With", "For", "Of",
  "And", "Or", "But", "So", "Then", "Than",
]);

const PATTERNS = [
  { type: "SSN", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "CREDIT_CARD", regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
  { type: "DOB", regex: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g },
  {
    type: "PHONE",
    regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  },
  { type: "EMAIL", regex: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  {
    type: "ADDRESS",
    regex:
      /\b\d+\s+(?:[A-Z][a-z]+\.?\s){1,4}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Lane|Ln|Dr|Drive|Way|Ct|Court|Terrace|Ter|Place|Pl|Pkwy|Parkway|Hwy|Highway)\b\.?/g,
  },
  {
    type: "ORG",
    regex:
      /\b(?:[A-Z][a-z]+\s){1,4}(?:Inc|LLC|Corp|Corporation|Hospital|Clinic|University|Bank)\b\.?/g,
  },
  {
    type: "NAME",
    regex: /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g,
    filter: (match) => {
      const [first, second] = match.split(/\s+/);
      return !NAME_STOP_WORDS.has(first) && !NAME_STOP_WORDS.has(second);
    },
  },
  {
    type: "NAME",
    regex:
      /\b(?:my (?:first |last |full )?name is|i'?m|i am|this is|call me|name's)\s+([a-zA-Z][a-zA-Z'-]{2,})/gi,
    captureGroup: 1,
    filter: (captured) => {
      const word = captured.trim();
      if (word.length < 3) return false;
      const titleCase = word[0].toUpperCase() + word.slice(1).toLowerCase();
      return !NAME_STOP_WORDS.has(titleCase);
    },
  },
];

export function maskPII(text) {
  if (!text) return { maskedText: "", piiMap: {} };

  const piiMap = {};
  const reverseMap = new Map();
  const counters = {};
  let masked = text;

  for (const { type, regex, captureGroup, filter } of PATTERNS) {
    masked = masked.replace(regex, (...args) => {
      const fullMatch = args[0];
      const groups = args.slice(1, -2);
      const target = captureGroup ? groups[captureGroup - 1] : fullMatch;
      if (!target) return fullMatch;
      if (filter && !filter(target)) return fullMatch;

      const dedupeKey = `${type}::${target}`;
      let placeholder;
      if (reverseMap.has(dedupeKey)) {
        placeholder = reverseMap.get(dedupeKey);
      } else {
        counters[type] = (counters[type] || 0) + 1;
        placeholder = `[${type}_${counters[type]}]`;
        piiMap[placeholder] = target;
        reverseMap.set(dedupeKey, placeholder);
      }

      if (!captureGroup) return placeholder;
      const idx = fullMatch.lastIndexOf(target);
      return fullMatch.slice(0, idx) + placeholder + fullMatch.slice(idx + target.length);
    });
  }

  return { maskedText: masked, piiMap };
}

export function restorePII(text, piiMap) {
  if (!text || !piiMap) return text;
  let restored = text;
  const keys = Object.keys(piiMap).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    restored = restored.split(key).join(piiMap[key]);
  }
  return restored;
}

const PLACEHOLDER_REGEX = /\[(?:NAME|EMAIL|PHONE|CREDIT_CARD|SSN|DOB|ADDRESS|ORG)_\d+\]/g;

export function segmentText(text, { piiMap = {}, mode = "raw" } = {}) {
  if (!text) return [];

  if (mode === "placeholder") {
    return splitOnRegex(text, PLACEHOLDER_REGEX, "placeholder");
  }

  const piiValues = Object.values(piiMap);
  if (piiValues.length === 0) return [{ text, kind: "plain" }];

  const escaped = piiValues
    .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length);
  const compoundRegex = new RegExp(`(${escaped.join("|")})`, "g");

  return splitOnRegex(text, compoundRegex, mode === "restored" ? "restored" : "pii");
}

function splitOnRegex(text, regex, matchKind) {
  const segments = [];
  let lastIndex = 0;
  for (const match of text.matchAll(regex)) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), kind: "plain" });
    }
    segments.push({ text: match[0], kind: matchKind });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), kind: "plain" });
  }
  return segments;
}
