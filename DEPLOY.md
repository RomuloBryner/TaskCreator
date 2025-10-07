# 🚀 Guía de Deploy

## Subir a GitHub

### Opción 1: Usando GitHub CLI (recomendado)

```bash
# Instala GitHub CLI si no lo tienes: https://cli.github.com/

# Autentícate
gh auth login

# Crea el repositorio y súbelo
gh repo create task-creator --public --source=. --push
```

### Opción 2: Manualmente

1. **Crea un nuevo repositorio en GitHub**:
   - Ve a https://github.com/new
   - Nombre: `task-creator`
   - Descripción: `Next.js app para crear tareas en Linear usando IA`
   - **NO inicialices con README, .gitignore o license** (ya los tenemos)

2. **Conecta tu repositorio local**:
```bash
git remote add origin https://github.com/TU_USUARIO/task-creator.git
git branch -M main
git push -u origin main
```

---

## Deploy en Vercel (Recomendado para Next.js)

### 1. Deploy desde GitHub

1. Ve a https://vercel.com
2. Click en **"Add New Project"**
3. Importa tu repositorio de GitHub `task-creator`
4. Configura las **Environment Variables**:
   - `OPENAI_API_KEY`: tu API key de OpenAI
   - `LINEAR_API_KEY`: tu API key de Linear
5. Click en **"Deploy"**

### 2. Deploy desde CLI

```bash
# Instala Vercel CLI
npm i -g vercel

# Deploy
vercel

# Sigue las instrucciones y configura las variables de entorno cuando te lo pida
```

---

## Subir a GitLab

1. **Crea un nuevo proyecto en GitLab**:
   - Ve a https://gitlab.com/projects/new
   - Nombre: `task-creator`

2. **Sube el código**:
```bash
git remote add origin https://gitlab.com/TU_USUARIO/task-creator.git
git branch -M main
git push -u origin main
```

---

## Deploy en Netlify

1. Ve a https://netlify.com
2. Click en **"Add new site"** → **"Import an existing project"**
3. Conecta con GitHub y selecciona tu repositorio
4. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Agrega las **Environment Variables**:
   - `OPENAI_API_KEY`
   - `LINEAR_API_KEY`
6. Click en **"Deploy"**

---

## ⚠️ Importante

### Variables de Entorno en Producción

Asegúrate de configurar estas variables de entorno en tu plataforma de deploy:

```
OPENAI_API_KEY=sk-proj-...
LINEAR_API_KEY=lin_api_...
```

### Seguridad

- ✅ El archivo `.env.local` está en `.gitignore` (no se subirá)
- ✅ Nunca compartas tus API keys
- ✅ Usa `env.example` como referencia para otros colaboradores

### Dominios Personalizados

En Vercel o Netlify puedes configurar un dominio personalizado:
- `task-creator.tudominio.com`
- Sigue las instrucciones de la plataforma para configurar DNS

---

## 🔄 Actualizar el Deploy

Después de hacer cambios:

```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

Vercel/Netlify automáticamente detectarán los cambios y re-deployarán. 🚀
