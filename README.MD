# iTwin Viewer com Three.js

Este projeto visualiza um iModel exportado da iTwin Platform usando Three.js e autenticação via Bentley IMS.

---

## 🚀 Requisitos

- Node.js 18 ou superior (recomendado)
- Conta no [Bentley Developer Portal](https://developer.bentley.com/)
- Um aplicativo registrado com:
  - `Client ID`
  - Redirect URI (`http://localhost:5173/`)
- Um `iModel` exportado via Mesh Export API

---

## 📦 Instalação

Clone o repositório e instale as dependências:

- git clone <url-do-repo>
- cd iwt
- npm install --legacy-peer-deps

--- 

Crie um arquivo .env na raiz com o seguinte conteúdo:
- VITE_CLIENT_ID=seu-client-id-aqui
- VITE_IMODEL_ID=seu-imodel-id-aqui

---
RODAR O PROJETO
- npm run dev
