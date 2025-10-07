# 🚀 Guía de Configuración

## 1. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con tus API keys:

```env
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
LINEAR_API_KEY=lin_api_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Cómo obtener tus API Keys:

#### OpenAI API Key
1. Ve a https://platform.openai.com/api-keys
2. Inicia sesión o crea una cuenta
3. Click en "Create new secret key"
4. Copia la key (empieza con `sk-proj-...`)
5. Pégala en `.env.local` como `OPENAI_API_KEY`

#### Linear API Key
1. Abre Linear
2. Ve a **Settings** → **API** → **Personal API keys**
3. Click en "Create key"
4. Dale un nombre (ej: "Task Creator")
5. Copia la key (empieza con `lin_api_...`)
6. Pégala en `.env.local` como `LINEAR_API_KEY`

## 2. Instalar Dependencias

```bash
npm install
```

## 3. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

## 4. Abrir en el Navegador

Ve a http://localhost:3000

## ⚠️ Solución de Problemas

### Error: "teams.map is not a function"
- **Causa**: Las variables de entorno no están configuradas correctamente
- **Solución**: 
  1. Verifica que el archivo `.env.local` existe en la raíz del proyecto
  2. Verifica que las keys son correctas
  3. Reinicia el servidor (`Ctrl+C` y luego `npm run dev`)

### Error: "LINEAR_API_KEY no está configurado"
- **Causa**: El archivo `.env.local` no existe o está mal configurado
- **Solución**: Crea el archivo `.env.local` siguiendo las instrucciones arriba

### Error de autenticación de Linear
- **Causa**: La API key de Linear es incorrecta o expiró
- **Solución**: Genera una nueva API key en Linear y actualiza `.env.local`

### No se muestran equipos/proyectos
- Abre la **Consola del navegador** (F12) → pestaña **Console**
- Verifica los mensajes de error
- Verifica que tu cuenta de Linear tiene equipos y proyectos creados

## 📝 Notas Importantes

- **Nunca** compartas tus API keys
- **Nunca** subas el archivo `.env.local` a Git (ya está en `.gitignore`)
- Si compartes el código, usa `.env.example` como referencia
- Las API keys de OpenAI tienen costos asociados al uso

## 🔄 Reiniciar desde Cero

Si algo no funciona:

1. Detén el servidor (`Ctrl+C`)
2. Borra la carpeta `.next`:
   ```bash
   rm -rf .next
   # En Windows:
   rmdir /s .next
   ```
3. Verifica `.env.local`
4. Inicia de nuevo:
   ```bash
   npm run dev
   ```
