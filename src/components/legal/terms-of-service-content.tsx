import { LegalProse, LegalSection } from "@/components/legal/legal-prose";
import {
  LEGAL_APP_NAME,
  LEGAL_CONTACT_EMAIL,
  LEGAL_PUBLISHER,
} from "@/lib/legal/contact";
import { LEGAL_PATHS } from "@/lib/legal/paths";

export function TermsOfServiceContent() {
  return (
    <>
      <LegalProse>
        <p>
          Al acceder o usar {LEGAL_APP_NAME} («el Servicio»), aceptas estos términos entre tú (o
          la entidad que representas) y {LEGAL_PUBLISHER} («nosotros»).
        </p>
      </LegalProse>

      <LegalSection title="1. Descripción del servicio">
        <LegalProse>
          <p>
            {LEGAL_APP_NAME} es una aplicación web que facilita la visibilidad del sprint, el
            registro de tiempo y operaciones sobre elementos de trabajo en Azure DevOps. El
            Servicio no sustituye Azure DevOps ni los acuerdos de Microsoft que apliquen a tu
            organización.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="2. Cuenta y acceso">
        <LegalProse>
          <ul>
            <li>
              Debes disponer de permisos válidos en Azure DevOps y, si usas OAuth, de una cuenta
              Microsoft autorizada por tu organización.
            </li>
            <li>
              Si usas un token personal (PAT), eres responsable de su custodia, alcance y rotación.
            </li>
            <li>
              No debes compartir credenciales ni usar el Servicio para vulnerar políticas de tu
              empresa o de Microsoft.
            </li>
          </ul>
        </LegalProse>
      </LegalSection>

      <LegalSection title="3. Uso aceptable">
        <LegalProse>
          <p>Te comprometes a no:</p>
          <ul>
            <li>Intentar acceder sin autorización a sistemas, datos o cuentas ajenas.</li>
            <li>Interferir con la disponibilidad o seguridad del Servicio.</li>
            <li>Usar el Servicio de forma que infrinja leyes aplicables o derechos de terceros.</li>
          </ul>
        </LegalProse>
      </LegalSection>

      <LegalSection title="4. Datos y privacidad">
        <LegalProse>
          <p>
            El tratamiento de datos personales se rige por nuestra{" "}
            <a href={LEGAL_PATHS.privacy}>Política de privacidad</a>. Al usar el Servicio,
            confirmas que tienes facultad para conectar la organización o proyecto de Azure DevOps
            indicado.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="5. Propiedad intelectual">
        <LegalProse>
          <p>
            El software, la marca {LEGAL_APP_NAME} y los materiales del Servicio nos pertenecen o
            a nuestros licenciantes. Los datos de tu proyecto en Azure DevOps siguen siendo de tu
            organización.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="6. Disponibilidad y cambios">
        <LegalProse>
          <p>
            El Servicio se ofrece «tal cual». Podemos modificar funciones, suspender temporalmente
            o dejar de ofrecer el Servicio con aviso razonable cuando sea posible.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="7. Limitación de responsabilidad">
        <LegalProse>
          <p>
            En la medida permitida por la ley, no seremos responsables de daños indirectos,
            pérdida de beneficios o de datos derivados del uso del Servicio o de Azure DevOps. La
            responsabilidad total se limita al importe que hayas pagado por el Servicio en los
            doce meses anteriores, o a cero si el uso es gratuito o interno.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="8. Rescisión">
        <LegalProse>
          <p>
            Puedes dejar de usar el Servicio en cualquier momento y cerrar sesión. Podemos
            restringir el acceso si incumples estos términos.
          </p>
        </LegalProse>
      </LegalSection>

      <LegalSection title="9. Ley aplicable y contacto">
        <LegalProse>
          <p>
            Estos términos se interpretan según las leyes que correspondan a {LEGAL_PUBLISHER},
            sin perjuicio de normas imperativas de consumo en tu país. Dudas:{" "}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
          </p>
        </LegalProse>
      </LegalSection>
    </>
  );
}
