import React, { useState } from 'react';
import { Check, Mail, Phone, Building2, User, Clock, Send, ShieldCheck, Star } from 'lucide-react';

// GOOGLE APPS SCRIPT URL - HIER DEINE URL EINFÜGEN!
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJan8Xcebhr2upSMgLVcowOzGcffH90hMTvV4ebfmmwkvXPadSoK-erUKW5NeP83vs/exec';

// Paket-Definitionen
const PACKAGES = [
  {
    id: 'kleinbetriebe',
    name: 'Kleinbetrieb',
    submitName: 'Kleinbetriebe',
    subtitle: 'Selbstständig oder bis 2 Mitarbeiter',
    basePrice: 3500,
    hours: '20-30',
    features: [
      'QM-System-Grundstruktur: Prozesse & schlanke Dokumentation',
      'Ideal für Ein-Personen-Betriebe & kleine Partnerschaften; Fördermöglichkeiten prüfen (auf Wunsch)'
    ],
    accent: '#03468f',
    popular: false
  },
  {
    id: 'wachsende-teams',
    name: 'Mittlerer Betrieb',
    subtitle: '3–10 Mitarbeiter',
    basePrice: 4500,
    hours: '30-40',
    features: [
      'QM-System-Aufbau: Verantwortlichkeiten, Kernprozesse & schlanke Dokumentation',
      'Skalierbar für Wachstum; Fördermöglichkeiten prüfen (auf Wunsch)'
    ],
    accent: '#c9a027',
    popular: false
  },
  {
    id: 'etablierte-unternehmen',
    name: 'Mittelstand',
    subtitle: '11–50 Mitarbeiter',
    basePrice: 7500,
    hours: '40-70',
    features: [
      'Mehrstufiges QM-System mit schlanker Dokumentation',
      'Abteilungsübergreifende Umsetzung; Fördermöglichkeiten prüfen (auf Wunsch)'
    ],
    accent: '#102942',
    popular: false
  }
];


export default function App() {
  const [selectedPackage, setSelectedPackage] = useState(() => {
    const preselected = PACKAGES.find(p => p.id === 'wachsende-teams');
    return preselected ?? PACKAGES[0] ?? null;
  });
  const [formData, setFormData] = useState({
    firma: '',
    ansprechpartner: '',
    email: '',
    telefon: '',
    norms: ['ISO 9001:2015'],
    geltungsbereich: '',
    fragen: ''
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Track if form is complete (all required fields filled)
  const isFormComplete = selectedPackage && 
    formData.firma.trim() !== '' && 
    formData.ansprechpartner.trim() !== '' && 
    formData.email.trim() !== '' &&
    Array.isArray(formData.norms) && 
    formData.norms.length >= 1;

  const parseHoursRange = (hoursStr) => {
    if (!hoursStr) return null;
    const match = String(hoursStr).match(/(\d+)\s*-\s*(\d+)/);
    if (!match) return null;
    return { min: Number(match[1]), max: Number(match[2]) };
  };

  const calculateFinalHours = () => {
    if (!selectedPackage) return '';
    const range = parseHoursRange(selectedPackage.hours);
    if (!range) return selectedPackage.hours;
    return `${range.min}-${range.max}`;
  };

  const getNormsText = () => 'ISO 9001:2015';

  const calculateFinalPrice = () => {
    if (!selectedPackage) return 0;
    return Math.round(selectedPackage.basePrice);
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setErrorMsg('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPackage) {
      setErrorMsg('Bitte wählen Sie zuerst ein Paket aus');
      const packagesEl = document.getElementById('pakete');
      if (packagesEl) packagesEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!formData.firma.trim() || !formData.ansprechpartner.trim() || !formData.email.trim()) {
      setErrorMsg('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    // Norm is fixed (reduced form): ISO 9001 always included
    if (!Array.isArray(formData.norms) || formData.norms.length < 1) {
      setFormData(prev => ({ ...prev, norms: ['ISO 9001:2015'] }));
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const finalPrice = calculateFinalPrice();
      const normCount = 1;
      const normInfoLabel = '1 Norm';
      const normsText = getNormsText();
      
      const formEncoded = new URLSearchParams();
      formEncoded.append('paket', selectedPackage.submitName ?? selectedPackage.name);
      formEncoded.append('firma', formData.firma.trim());
      formEncoded.append('ansprechpartner', formData.ansprechpartner.trim());
      formEncoded.append('email', formData.email.trim());
      formEncoded.append('telefon', formData.telefon.trim() || 'nicht angegeben');
      formEncoded.append('norm', normsText);
      formEncoded.append('norms', (formData.norms || []).join(' | '));
      formEncoded.append('normCount', normCount);
      formEncoded.append('normInfo', normInfoLabel);
      formEncoded.append('preis', finalPrice);
      formEncoded.append('kosten', finalPrice);
      formEncoded.append('stunden', calculateFinalHours());
      formEncoded.append('geltungsbereich', formData.geltungsbereich.trim() || 'Nach Vereinbarung');
      formEncoded.append('fragen', formData.fragen.trim() || 'keine');

      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: formEncoded.toString()
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setStatus('success');
      } catch (_) {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: formEncoded.toString()
        });
        setStatus('success');
      }

      setTimeout(() => {
        setFormData({
          firma: '',
          ansprechpartner: '',
          email: '',
          telefon: '',
          norms: ['ISO 9001:2015'],
          geltungsbereich: '',
          fragen: ''
        });
        setSelectedPackage((prev) => prev ?? PACKAGES[0] ?? null);
        setStatus('idle');
      }, 5000);

    } catch (err) {
      console.error('Error:', err);
      setStatus('error');
      setErrorMsg(`Fehler: ${err.message}`);
    }
  };

  const finalPrice = calculateFinalPrice();
  const finalHours = calculateFinalHours();
  const normsText = getNormsText();

  const BRAND = {
    primary: 'var(--qm-primary)',
    heading: 'var(--qm-heading)',
    text: 'var(--qm-text)',
    button: 'var(--qm-button)',
    bg: 'var(--qm-bg)',
    accent500: 'var(--qm-accent-500)',
    accent200: 'var(--qm-accent-200)',
    border: 'var(--qm-border)',
    shadow: 'var(--qm-shadow)',
    radius: 'var(--qm-radius)'
  };

  const displayNorms = normsText;

  return (
    <div className="qm-page">
      <header className="qm-header">
        <div className="qm-brand">
          <div className="qm-avatar" aria-hidden="true">HG</div>
          <div>
            <div className="qm-brand-name">Holger Grosser</div>
            <div className="qm-brand-sub">ISO Lead-Auditor · QM-Berater seit 1994</div>
          </div>
        </div>
        <h1 className="qm-h1">
          In 1–2 Monaten<br />
          <em>ISO 9001-zertifiziert.</em>
        </h1>
        <p className="qm-lead">
          Paket wählen, Daten eingeben – Ihr Angebot kommt sofort per E-Mail. Kein Gespräch vorher nötig.
        </p>
      </header>

      <main className="qm-card" id="mainCard">
        <div className="qm-guarantee" role="note" aria-label="Garantie">
          <div className="qm-guarantee-icon" aria-hidden="true">
            <ShieldCheck size={20} />
          </div>
          <div className="qm-guarantee-text">
            Sie zahlen erst, wenn Sie das Zertifikat <em>in der Hand halten</em>.
          </div>
          <div className="qm-guarantee-pill">Unsere Garantie</div>
        </div>

        {status === 'success' ? (
          <section className="qm-success" role="status" aria-live="polite">
            <div className="qm-success-icon" aria-hidden="true">
              <Check size={22} />
            </div>
            <h2 className="qm-success-title">Ihr Angebot ist unterwegs!</h2>
            <p className="qm-success-text">
              Es landet gleich in Ihrem Postfach.<br />
              Bitte prüfen Sie ggf. auch den Spam-Ordner.
            </p>
            <p className="qm-success-contact">
              <strong>Holger Grosser</strong> · QMberater.info
            </p>
          </section>
        ) : (
          <>
            <section className="qm-step">
              <div className="qm-step-label">Wie groß ist Ihr Betrieb?</div>
              <div className="qm-step-title">Wählen Sie Ihr Paket</div>
            </section>

            <section className="qm-packages" aria-label="Pakete">
              {PACKAGES.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    className={`qm-pkg ${isSelected ? 'selected' : ''}`}
                    onClick={() => handlePackageSelect(pkg)}
                    aria-pressed={isSelected}
                  >
                    <div className="qm-pkg-name">{pkg.name}</div>
                    <div className="qm-pkg-sub">{pkg.subtitle}</div>
                    <div className="qm-pkg-price">
                      {pkg.basePrice.toLocaleString('de-DE')}<span>€</span>
                    </div>
                    <div className="qm-pkg-hours">Projektzeiten: {pkg.hours} Stunden</div>
                  </button>
                );
              })}
            </section>

            <section className="qm-pricebar" aria-label="Preisübersicht">
              <div className="qm-pricebar-left">
                <span>Ihr Paket:</span>
                <strong>{selectedPackage?.name ?? '—'}</strong>
                <div className="qm-pricebar-meta">Norm: {displayNorms}</div>
              </div>
              <div className="qm-pricebar-right">
                <div className="qm-pricebar-price">
                  {finalPrice.toLocaleString('de-DE')} <small>€ netto</small>
                </div>
                <div className="qm-pricebar-note">BAFA-Förderung möglich (je nach Programm)</div>
              </div>
            </section>

            <form onSubmit={handleSubmit} className="qm-form" aria-label="Angebot anfordern">
              <div className="qm-form-head">
                <div className="qm-step-label">Wohin soll das Angebot?</div>
                <div className="qm-form-hint">📄 Ihr Angebot als PDF – direkt in Ihrem Postfach</div>
              </div>

              <div className="qm-form-grid">
                <div className="qm-fieldwrap">
                  <label className="qm-label" htmlFor="firma">
                    <Building2 size={16} aria-hidden="true" /> Firmenname <span className="qm-req">*</span>
                  </label>
                  <input
                    id="firma"
                    type="text"
                    name="firma"
                    value={formData.firma}
                    onChange={handleChange}
                    placeholder="z.B. Müller GmbH"
                    required
                    autoComplete="organization"
                    className="qm-field"
                  />
                </div>

                <div className="qm-fieldwrap">
                  <label className="qm-label" htmlFor="ansprechpartner">
                    <User size={16} aria-hidden="true" /> Ansprechpartner <span className="qm-req">*</span>
                  </label>
                  <input
                    id="ansprechpartner"
                    type="text"
                    name="ansprechpartner"
                    value={formData.ansprechpartner}
                    onChange={handleChange}
                    placeholder="z.B. Max Müller"
                    required
                    autoComplete="name"
                    className="qm-field"
                  />
                </div>

                <div className="qm-fieldwrap full">
                  <label className="qm-label" htmlFor="email">
                    <Mail size={16} aria-hidden="true" /> E-Mail <span className="qm-req">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="max@firma.de"
                    required
                    autoComplete="email"
                    className="qm-field"
                  />
                </div>

                <div className="qm-fieldwrap full">
                  <label className="qm-label" htmlFor="telefon">
                    <Phone size={16} aria-hidden="true" /> Telefon <span className="qm-optional">(optional)</span>
                  </label>
                  <input
                    id="telefon"
                    type="tel"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleChange}
                    placeholder="+49 911 123456"
                    autoComplete="tel"
                    className="qm-field"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="qm-error" role="alert" aria-live="assertive">
                  <span aria-hidden="true">⚠️</span>
                  <div>{errorMsg}</div>
                </div>
              )}

              <div className="qm-submit">
                <button
                  type="submit"
                  className="qm-submit-btn"
                  disabled={status === 'loading' || !isFormComplete}
                  aria-busy={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <>
                      <Clock size={18} /> Wird erstellt…
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Jetzt Angebot anfordern – kostenlos
                    </>
                  )}
                </button>

                <div className="qm-trust" aria-label="Vertrauenssignale">
                  <div className="qm-trust-item">
                    <Check size={16} aria-hidden="true" /> Kostenlos & unverbindlich
                  </div>
                  <div className="qm-trust-item">
                    <Mail size={16} aria-hidden="true" /> Angebot sofort per E-Mail
                  </div>
                  <div className="qm-trust-item">
                    <Star size={16} aria-hidden="true" /> 30 Jahre Erfahrung · 1.000+ Audits
                  </div>
                </div>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
