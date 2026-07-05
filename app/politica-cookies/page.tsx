import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal-layout";

export const metadata: Metadata = {
  title: "Politica cookies - LustLashes",
  description: "Politica de utilizare a cookies pentru LustLashes."
};

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Politica cookies">
      <p>
        Aceasta pagina explica ce cookies folosim pe site-ul LustLashes, de ce sunt
        necesari si cum poti gestiona consimtamantul.
      </p>

      <h2>Ce este un cookie?</h2>
      <p>
        Un cookie este un fisier text de mici dimensiuni, stocat in browser sau pe
        dispozitivul tau, care ne ajuta sa functionam corect si sa intelegem cum este
        folosit site-ul.
      </p>

      <h2>Ce cookies folosim?</h2>
      <ul>
        <li>
          <strong>Cookie de sesiune admin</strong> — folosit doar pentru zona securizata
          de administrare. Este necesar pentru autentificare, nu contine date personale
          ale clientelor si expira automat dupa perioada setata.
        </li>
        <li>
          <strong>Cookie CSRF</strong> — folosit pentru securitatea formularelor din admin,
          ca sa previna atacurile de tip cross-site request forgery.
        </li>
        <li>
          <strong>Cookie de preferinte / functionale</strong> — pot fi folositi pentru a
          memora limba sau alte setari esentiale ale site-ului.
        </li>
      </ul>

      <h2>Cum gestionezi cookies?</h2>
      <p>
        Poti sterge sau bloca cookies din setarile browser-ului. Daca dezactivezi
        cookie-urile, zona de admin nu va mai functiona, dar partea publica de programari
        va ramane accesibila.
      </p>

      <h2>Contact</h2>
      <p>
        Pentru intrebari legate de cookies sau date personale, scrie-mi pe Instagram la{" "}
        <a href="https://instagram.com/lustlashestimisoara">@lustlashestimisoara</a>.
      </p>
    </LegalLayout>
  );
}
