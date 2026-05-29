# Configuración de Microsoft Entra ID (TaskPilot / NeosView)

Guía para rellenar el registro de aplicación en Azure y las variables de entorno del proyecto.

## URLs en producción

Con dominio `https://neosview.estremor.com`:

| Uso | URL |
|-----|-----|
| App (página principal) | `https://neosview.estremor.com/` |
| Política de privacidad | `https://neosview.estremor.com/privacy` |
| Términos del servicio | `https://neosview.estremor.com/terms` |
| Redirect OAuth (Web) | `https://neosview.estremor.com/api/auth/azdo/callback` |

En local (desarrollo):

| Uso | URL |
|-----|-----|
| Redirect OAuth | `http://localhost:3000/api/auth/azdo/callback` |

---

## Personalización de marca y propiedades

| Campo en Azure | Qué colocar |
|----------------|-------------|
| **Nombre** | `NeosView` |
| **Logotipo** | PNG 120×120 px (isotipo morado de NeosView). Ya cargado: `neosview-logo-(120 x 120 px).png` |
| **URL de página principal** | `https://neosview.estremor.com/` |
| **URL de Condiciones del servicio** | `https://neosview.estremor.com/terms` |
| **URL de la declaración de privacidad** | `https://neosview.estremor.com/privacy` |
| **Referencia de administración de servicios** | Opcional. Ej.: `NEOSVIEW-PROD` o ticket interno de IT |
| **Notas internas** | Opcional. Ej.: «App interna Estremor — sprint ADO» |
| **Dominio de editor** | Ideal: dominio verificado `estremor.com` (ver sección abajo) |

---

## Autenticación

1. **Plataformas** → **Agregar una plataforma** → **Web** (si no existe).
2. **URI de redirección**:
   - `https://neosview.estremor.com/api/auth/azdo/callback`
   - `http://localhost:3000/api/auth/azdo/callback` (solo desarrollo)
3. **Tipos de cuenta admitidos** (recomendado uso interno):
   - **Solo cuentas de este directorio organizativo** (single tenant).
4. **Tokens** (opcional): dejar valores por defecto salvo requisito de IT.

---

## Permisos de API

1. **Agregar permiso** → **APIs usadas por mi organización** → **Azure DevOps**.
2. Permiso delegado de acceso a Azure DevOps (p. ej. **user_impersonation** / acceso delegado según el portal).
3. **Conceder consentimiento de administrador para [tu tenant]** (una sola vez).
   - Tras esto, los usuarios ya no deberían ver «necesita aprobación del administrador» en cada login.

Scopes que solicita la app en código: Azure DevOps (`.default`), `offline_access`, `openid`, `profile`.

---

## Certificados y secretos

| Campo | Dónde va en el proyecto |
|-------|-------------------------|
| **Id. de aplicación (cliente)** | `AZURE_AD_CLIENT_ID` |
| **Id. de directorio (inquilino)** | `AZURE_AD_TENANT_ID` |
| **Valor del secreto de cliente** | `AZURE_AD_CLIENT_SECRET` |

Renueva el secreto antes de que expire y actualiza `.env` / variables del hosting.

---

## Variables `.env.local` / producción

```env
AUTH_BASE_URL=https://neosview.estremor.com
NEXT_PUBLIC_SITE_URL=https://neosview.estremor.com

AZDO_AUTH_METHOD=oauth
# o both si también permites PAT

AZURE_AD_CLIENT_ID=<Id. de aplicación>
AZURE_AD_CLIENT_SECRET=<valor del secreto>
AZURE_AD_TENANT_ID=<Id. de directorio>

IRON_SESSION_PASSWORD=<mínimo 32 caracteres aleatorios>

# Opcional — textos legales
NEXT_PUBLIC_LEGAL_PUBLISHER=Estremor
NEXT_PUBLIC_LEGAL_CONTACT_EMAIL=privacidad@estremor.com
```

`AUTH_BASE_URL` y `NEXT_PUBLIC_SITE_URL` deben usar el mismo origen en producción.

---

## Editor verificado (dominio de editor)

Microsoft pide verificar el dominio **raíz** `estremor.com` (no basta con el subdominio `neosview`).

### Archivo requerido

Debe responder en **exactamente** esta URL:

`https://estremor.com/.well-known/microsoft-identity-association.json`

Contenido (ya incluido en el repo en `public/.well-known/microsoft-identity-association.json`):

```json
{
  "associatedApplications": [
    {
      "applicationId": "c7958f47-ce7e-416e-99a7-a8929665bad7"
    }
  ]
}
```

### Importante: dominio raíz vs subdominio

| URL | ¿Sirve para verificar? |
|-----|------------------------|
| `https://estremor.com/.well-known/...` | **Sí** (lo que pide Azure) |
| `https://neosview.estremor.com/.well-known/...` | **No** |

Si la app solo está desplegada en `neosview.estremor.com`, tienes que **también** publicar ese archivo en el dominio raíz. Opciones:

1. **Mismo hosting con dos dominios**: apunta `estremor.com` y `neosview.estremor.com` al mismo despliegue de Next.js (Vercel, Azure, etc.).
2. **Solo el archivo en la raíz**: hosting estático en `estremor.com` con únicamente la carpeta `.well-known`.
3. **Redirect no vale**: Azure comprueba la URL exacta en el dominio raíz.

Comprueba antes de pulsar «Verificar y guardar dominio»:

```bash
curl -s https://estremor.com/.well-known/microsoft-identity-association.json
```

Debe devolver el JSON con `applicationId`.

### Pasos en Azure

1. Entra ID → Registro de aplicaciones → TaskPilot → **Personalización de marca** → **Dominio de editor** → **Verificar un nuevo dominio**.
2. Dominio: `estremor.com`.
3. Publica el archivo en la URL indicada.
4. **Verificar y guardar dominio**.
5. (Opcional) Asociar **MPN ID** en Partner Center para quitar «Editor no verificado» en apps multitenant.

### Alternativa sin verificar editor

Si la app es **solo para tu organización**:

- **Tipos de cuenta** → solo este directorio (single tenant).
- **Permisos de API** → **Conceder consentimiento de administrador** una vez.

No necesitas dominio de editor verificado para uso interno.

---

## Comprobar que todo funciona

1. Despliega con las variables anteriores.
2. Abre `https://neosview.estremor.com/privacy` y `/terms` (deben responder 200).
3. Inicia sesión con Microsoft desde la app.
4. Si falla sin refresh token, repite **Conceder consentimiento de administrador** incluyendo `offline_access`.
