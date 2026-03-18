# Gestão Técnica da Nonato Service

Sistema de gestão técnica desenvolvido com Next.js.

## Instalação

```bash
npm install
```

## Executar em desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Tradução de relatórios (DeepSeek)

No **Relatório de Serviço** (formulário completo), pode traduzir textos descritivos com a API **DeepSeek**.

1. Crie uma chave em [platform.deepseek.com](https://platform.deepseek.com).
2. No `.env` local ou nas variáveis do **Railway**, defina:
   ```bash
   DEEPSEEK_API_KEY=sua_chave_aqui
   ```
3. Reinicie o servidor. Sem a chave, o botão de tradução mostrará erro ao pedir tradução.

## Estrutura de Cores

- **Fundo da tela**: Preto (#000000)
- **Containers e Modais**: Cinza (#2a2a2a)
- **Bordas dos botões**: Verde (#00ff00)
