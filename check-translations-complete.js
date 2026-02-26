const fs = require('fs');

// Ler o arquivo de traduções
const content = fs.readFileSync('app/translations.ts', 'utf8');

// Extrair cada objeto de idioma
const extractKeys = (langCode) => {
  const regex = new RegExp(`'${langCode}':\\s*\\{([\\s\\S]*?)\\}(?=\\s*[,}])`, 'm');
  const match = content.match(regex);
  if (!match) return [];
  
  const langContent = match[1];
  const keys = [];
  let depth = 0;
  let currentKey = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < langContent.length; i++) {
    const char = langContent[i];
    const prevChar = i > 0 ? langContent[i - 1] : '';
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
    } else if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') depth--;
      else if (depth === 0 && /[a-zA-Z_$]/.test(char)) {
        // Começar a coletar uma chave
        let key = '';
        let j = i;
        while (j < langContent.length && /[a-zA-Z0-9_$]/.test(langContent[j])) {
          key += langContent[j];
          j++;
        }
        if (key && langContent[j] === ':') {
          keys.push(key);
          i = j;
        }
      }
    }
  }
  
  // Método mais simples: buscar padrão chave:
  const simpleKeys = langContent.match(/(\w+):\s*['"]/g) || [];
  return simpleKeys.map(k => k.replace(/:\s*['"].*/, '').trim()).filter(k => k);
};

const ptKeys = extractKeys('pt-BR');
const esKeys = extractKeys('es');
const frKeys = extractKeys('fr');
const itKeys = extractKeys('it');
const deKeys = extractKeys('de');
const enKeys = extractKeys('en');

console.log('\n=== VERIFICAÇÃO DE TRADUÇÕES ===\n');
console.log(`PT-BR: ${ptKeys.length} chaves`);
console.log(`ES: ${esKeys.length} chaves`);
console.log(`FR: ${frKeys.length} chaves`);
console.log(`IT: ${itKeys.length} chaves`);
console.log(`DE: ${deKeys.length} chaves`);
console.log(`EN: ${enKeys.length} chaves\n`);

// Encontrar chaves faltando
const allKeys = new Set([...ptKeys, ...esKeys, ...frKeys, ...itKeys, ...deKeys, ...enKeys]);
const languages = {
  'pt-BR': ptKeys,
  'es': esKeys,
  'fr': frKeys,
  'it': itKeys,
  'de': deKeys,
  'en': enKeys
};

console.log('=== CHAVES FALTANDO ===\n');
let hasMissing = false;
for (const [lang, keys] of Object.entries(languages)) {
  const missing = Array.from(allKeys).filter(k => !keys.includes(k));
  if (missing.length > 0) {
    hasMissing = true;
    console.log(`${lang.toUpperCase()}: ${missing.length} chaves faltando`);
    if (missing.length <= 20) {
      console.log('  Faltando:', missing.join(', '));
    } else {
      console.log('  Faltando (primeiras 20):', missing.slice(0, 20).join(', '), '...');
    }
    console.log('');
  }
}

if (!hasMissing) {
  console.log('✓ Todas as chaves estão presentes em todos os idiomas!\n');
}

// Verificar duplicatas
console.log('=== DUPLICATAS ===\n');
for (const [lang, keys] of Object.entries(languages)) {
  const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (duplicates.length > 0) {
    console.log(`${lang.toUpperCase()}: ${duplicates.length} chaves duplicadas:`, [...new Set(duplicates)].join(', '));
  }
}
