import { LegalProse, LegalSection } from "@/components/legal/legal-prose";
import {
  LEGAL_APP_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_PUBLISHER,
} from "@/lib/legal/contact";

export function PrivacyPolicyContent() {
  return (
    <>
      <LegalProse>
        <p>
          Esta política describe cómo {LEGAL_PUBLISHER} («nosotros») trata la información
          cuando utilizas {LEGAL_APP_NAME}, una aplicación web que se conecta a Azure DevOps
          mediante tu cuenta de Microsoft o un token personal (PAT).
        </p>
      </LegalProse>

      <LegalSection title="1. Responsable del tratamiento">
        <LegalProse>
          <p>
            Responsable: <strong className="text-foreground">{LEGAL_PUBLISHER}</strong>.
            Contacto:{" "}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="2. Datos que tratamos">
        <LegalProse>
          <ul>
            <li>
              <strong className="text-foreground">Identidad Microsoft / Azure DevOps:</strong>{" "}
              nombre para mostrar, alias e identificador de perfil al iniciar sesión con OAuth.
            </li>
            <li>
              <strong className="text-foreground">Tokens de acceso:</strong> tokens OAuth o PAT
              cifrados en una cookie de sesión del servidor para llamar a la API de Azure DevOps
              en tu nombre.
            </li>
            <li>
              <strong className="text-foreground">Contexto de trabajo:</strong> organización,
              proyecto, equipo y metadatos de proceso detectados al conectar.
            </li>
            <li>
              <strong className="text-foreground">Datos de Azure DevOps:</strong> elementos de
              trabajo, estados, horas y demás información que consultes o modifiques desde la app;
              estos datos permanecen en Azure DevOps; la app los muestra y actualiza según tus
              acciones.
            </li>
            <li>
              <strong className="text-foreground">Datos locales del navegador:</strong> historial
              reciente de registro de tiempo y preferencias de interfaz, almacenados solo en tu
              dispositivo salvo que indiquemos lo contrario.
            </li>
            <li>
              <strong className="text-foreground">Copiloto IA (opcional):</strong> si está
              configurado, el texto que envíes para interpretar acciones puede procesarse mediante
              un proveedor de modelos de lenguaje; no envíes información clasificada sin
              autorización.
            </li>
          </ul>
        </LegalProse>
      </LegalSection>

      <LegalSection title="3. Finalidad y base legal">
        <LegalProse>
          <p>
            Usamos estos datos para autenticarte, mantener la sesión, operar las funciones de
            gestión del sprint y registrar tiempo en Azure DevOps. La base suele ser la ejecución
            del servicio solicitado por tu organización o tu consentimiento al conectar la cuenta.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="4. Cesiones y encargados">
        <LegalProse>
          <ul>
            <li>
              <strong className="text-foreground">Microsoft</strong> (Entra ID y Azure DevOps) para
              autenticación y almacenamiento de trabajo.
            </li>
            <li>
              <strong className="text-foreground">Proveedor de hosting</strong> donde despliegues
              la aplicación (por ejemplo Azure, Vercel u otro que elijas).
            </li>
            <li>
              <strong className="text-foreground">OpenAI u otro proveedor de IA</strong>, solo si
              activas el copiloto con clave API configurada en el entorno del servidor.
            </li>
          </ul>
          <p>No vendemos tus datos personales.</p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="5. Conservación">
        <LegalProse>
          <p>
            Los tokens de sesión se conservan mientras mantengas la sesión activa o hasta que
            cierres sesión. Los datos en Azure DevOps siguen las políticas de retención de tu
            organización. El historial local del navegador lo puedes borrar limpiando los datos del
            sitio.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="6. Seguridad">
        <LegalProse>
          <p>
            La sesión del servidor se protege con cifrado (cookie firmada). Debes configurar
            secretos fuertes en el entorno de despliegue y usar HTTPS en producción. El PAT y los
            refresh tokens no deben compartirse.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="7. Tus derechos">
        <LegalProse>
          <p>
            Puedes solicitar acceso, rectificación o supresión contactando a{" "}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. Para datos
            alojados en Azure DevOps, tu administrador de ADO también puede atender solicitudes
            según las políticas de tu empresa.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="8. Cambios">
        <LegalProse>
          <p>
            Podemos actualizar esta política. La fecha de «Última actualización» en esta página
            indica la versión vigente.
          </p>
        </LegalProse>
      </LegalSection>
    </>
  );
}
