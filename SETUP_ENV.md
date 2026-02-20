# Configuración de Variables de Entorno

Para que el Traductor PDF Pro funcione, necesitas configurar la API Key de Gemini.

## En Vercel (Producción)
1. Ve a tu proyecto en el dashboard de Vercel.
2. Ve a **Settings** > **Environment Variables**.
3. Añade una nueva variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyDXRz22duQ2YzKBW39iH9-AikIzzuFdXxM`
4. Haz clic en **Save**.
5. Ve a **Deployments**, selecciona el último y haz clic en **Redeploy** (o haz un nuevo push a GitHub).

## Localmente (.env.local)
Asegúrate de que tu archivo `.env.local` tenga este contenido:
```env
GEMINI_API_KEY=AIzaSyDXRz22duQ2YzKBW39iH9-AikIzzuFdXxM
```
*(Este archivo es ignorado por Git por seguridad)*
