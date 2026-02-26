const fs = require('fs');
const path = require('path');

// Ler o arquivo de traduções
const translationsFile = path.join(__dirname, 'app', 'translations.ts');
const content = fs.readFileSync(translationsFile, 'utf-8');

// Extrair todas as chaves do pt-BR (idioma base)
const ptBRMatch = content.match(/'pt-BR':\s*\{([\s\S]*?)\n\s*\},/);
if (!ptBRMatch) {
  console.error('Não foi possível encontrar o objeto pt-BR');
  process.exit(1);
}

const ptBRContent = ptBRMatch[1];
const ptBRKeys = [];
const keyRegex = /(\w+):\s*'([^']+)'/g;
let match;
while ((match = keyRegex.exec(ptBRContent)) !== null) {
  ptBRKeys.push({
    key: match[1],
    value: match[2],
    fullLine: match[0]
  });
}

console.log(`Total de chaves em pt-BR: ${ptBRKeys.length}`);

// Idiomas disponíveis
const languages = ['es', 'fr', 'it', 'de', 'en'];
const missingKeys = {};

// Verificar cada idioma
languages.forEach(lang => {
  // Para 'en' que é o último, não tem vírgula no final
  const isLast = lang === 'en';
  const pattern = isLast 
    ? new RegExp(`'${lang}':\\s*\\{([\\s\\S]*?)\\n\\s*\\}`)
    : new RegExp(`'${lang}':\\s*\\{([\\s\\S]*?)\\n\\s*\\},`);
  const langMatch = content.match(pattern);
  if (!langMatch) {
    console.error(`Não foi possível encontrar o objeto ${lang}`);
    return;
  }

  const langContent = langMatch[1];
  const langKeys = [];
  const langKeyRegex = /(\w+):\s*'[^']+'/g;
  while ((match = langKeyRegex.exec(langContent)) !== null) {
    langKeys.push(match[1]);
  }

  // Encontrar chaves faltantes
  const missing = ptBRKeys.filter(ptKey => !langKeys.includes(ptKey.key));
  if (missing.length > 0) {
    missingKeys[lang] = missing;
    console.log(`\n${lang.toUpperCase()}: ${missing.length} chaves faltando:`);
    missing.forEach(m => {
      console.log(`  - ${m.key}: "${m.value}"`);
    });
  } else {
    console.log(`\n${lang.toUpperCase()}: Todas as chaves estão presentes! ✓`);
  }
});

// Se houver chaves faltantes, oferecer para adicionar
if (Object.keys(missingKeys).length > 0) {
  console.log('\n\n=== RESUMO ===');
  Object.keys(missingKeys).forEach(lang => {
    console.log(`${lang}: ${missingKeys[lang].length} chaves faltando`);
  });
  console.log('\nExecute o script fix-translations.js para adicionar as traduções faltantes automaticamente.');
}

