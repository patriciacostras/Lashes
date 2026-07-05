import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal-layout";

export const metadata: Metadata = {
  title: "Termeni si conditii - LustLashes",
  description: "Termenii si conditiile de utilizare pentru programarile LustLashes."
};

export default function TermsPage() {
  return (
    <LegalLayout title="Termeni si conditii">
      <p>
        Prin utilizarea site-ului LustLashes si trimiterea unei cereri de programare,
        accepti termenii de mai jos. Te rugam sa ii citesti cu atentie.
      </p>

      <h2>1. Programarile</h2>
      <p>
        Programarile sunt cereri de rezervare. Vei primi confirmare prin email sau
        Instagram daca intervalul este disponibil. Programarea devine definitiva doar
        dupa confirmare.
      </p>

      <h2>2. Anulari si intarzieri</h2>
      <p>
        Daca nu mai poti veni, anunta cu cel putin 24 de ore inainte. Intarzierile mai
        mari de 15 minute pot duce la anularea programarii, pentru a nu afecta urmatoarele
        cliente.
      </p>

      <h2>3. Igiena si contraindicatii</h2>
      <p>
        Clienta este responsabila pentru curatarea genelor inainte de aplicare. Daca ai
        infectii, iritatii sau afectiuni ale ochilor, te rugam sa reprogramezi.
      </p>

      <h2>4. Preturi si plata</h2>
      <p>
        Preturile sunt in RON si sunt afisate pe site. Pentru serviciile marcate "pret la
        DM", pretul se stabileste in privat pe Instagram. Plata se face la locatie, in
        numerar sau prin metoda agreată.
      </p>

      <h2>5. Protectia datelor</h2>
      <p>
        Datele de contact (nume, telefon, email) sunt folosite doar pentru confirmarea
        programarilor. Nu le vindem si nu le transmitem tertilor in alte scopuri.
      </p>

      <h2>6. Modificari</h2>
      <p>
        Termenii si conditiile pot fi actualizati. Versiunea curenta este cea afisata pe
        site.
      </p>

      <h2>Contact</h2>
      <p>
        Pentru orice intrebare, scrie pe Instagram la{" "}
        <a href="https://instagram.com/lustlashestimisoara">@lustlashestimisoara</a>.
      </p>
    </LegalLayout>
  );
}
