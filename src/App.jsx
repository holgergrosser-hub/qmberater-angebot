import React, { useState, useEffect } from 'react';
import { Check, Mail, Phone, Building2, User, FileText, Clock, Award, TrendingUp, Send, CheckCircle2 } from 'lucide-react';

// GOOGLE APPS SCRIPT URL - HIER DEINE URL EINFÜGEN!
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJan8Xcebhr2upSMgLVcowOzGcffH90hMTvV4ebfmmwkvXPadSoK-erUKW5NeP83vs/exec';

// Paket-Definitionen
const PACKAGES = [
  {
    id: 'kleinbetriebe',
     name: 'Kleinere Betriebe',
    subtitle: 'Kleinbetriebe & Inhaber (0, 1-2 Mitarbeiter)',
    basePrice: 3500,
    hours: '20-30',
    features: [
      'Perfekt für Ein-Personen-Betriebe und kleine Partnerschaften',
      'Kompakte Dokumentation – schnell umsetzbar'
    ],
    accent: '#03468f',
    popular: false
  },
  {
    id: 'wachsende-teams',
    name: 'Wachsende Teams',
    subtitle: 'Wachsende Teams (3-10 Mitarbeiter)',
    basePrice: 4500,
    hours: '30-40',
    features: [
      'Klare Rollen und Verantwortlichkeiten',
      'Skalierbare Prozesse für weiteres Wachstum'
    ],
    accent: '#c9a027',
    popular: false
  },
  {
    id: 'etablierte-unternehmen',
    name: 'Etablierte Unternehmen',
    subtitle: 'Etablierte Unternehmen (11-50 Mitarbeiter)',
    basePrice: 7500,
    hours: '40-70',
    features: [
      'Mehrere Prozess-Ebenen professionell dokumentiert',
      'Abteilungsübergreifende Koordination'
    ],
    accent: '#102942',
    popular: false
  },
  {
    id: 'grosse-strukturen',
    name: 'Große Strukturen',
    subtitle: 'Große Strukturen (51-150 Mitarbeiter)',
    basePrice: 12000,
    hours: '70-90',
    features: [
      'Mehrere Standorte oder Geschäftsbereiche',
      'Umfangreiches Stakeholder-Management'
    ],
    accent: '#03468f',
    popular: false
  }
];

const NORMS = [
  { value: 'ISO 9001:2015', label: 'ISO 9001:2015' },
  { value: 'ISO 14001:2015', label: 'ISO 14001:2015' },
  { value: 'ISO 45001:2018', label: 'ISO 45001:2018' }
];

const NORM_PRICING_BY_COUNT = {
  1: { label: '1 Norm', multiplier: 1.0 },
  2: { label: '2 Normen', multiplier: 1.7 },
  3: { label: 'Mehrere Normen', multiplier: 2.0 }
};


export default function App() {
  const [selectedPackage, setSelectedPackage] = useState(null);
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

  // Smooth scroll when package is selected
  useEffect(() => {
    if (selectedPackage) {
      setTimeout(() => {
        const formSection = document.getElementById('formular');
        if (formSection) {
          const topBar = document.querySelector('[data-topbar="true"]');
          const topBarHeight = topBar?.offsetHeight || 0;
          const top = formSection.getBoundingClientRect().top + window.scrollY - topBarHeight - 20;
          
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          
          // Add highlight pulse effect
          formSection.style.animation = 'pulse-highlight 1.5s ease-out';
          setTimeout(() => {
            formSection.style.animation = '';
          }, 1500);
        }
      }, 100);
    }
  }, [selectedPackage]);

  const getNormCount = () => {
    const count = Array.isArray(formData.norms) ? formData.norms.length : 0;
    return Math.max(0, Math.min(3, count));
  };

  const getNormPricing = () => {
    const count = getNormCount();
    return NORM_PRICING_BY_COUNT[count] || NORM_PRICING_BY_COUNT[1];
  };

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
    const multiplier = getNormPricing().multiplier || 1.0;
    const min = Math.round(range.min * multiplier);
    const max = Math.round(range.max * multiplier);
    return `${min}-${max}`;
  };

  const getSelectedNormLabels = () => {
    const selectedSet = new Set(formData.norms || []);
    return NORMS.filter(n => selectedSet.has(n.value)).map(n => n.label);
  };

  const getNormsText = () => {
    const labels = getSelectedNormLabels();
    return labels.length ? labels.join(' + ') : 'keine';
  };

  const calculateFinalPrice = () => {
    if (!selectedPackage) return 0;
    const multiplier = getNormPricing().multiplier || 1.0;
    return Math.round(selectedPackage.basePrice * multiplier);
  };

  const scrollToSection = (id) => {
    const target = document.getElementById(id);
    if (!target) return;

    const topBar = document.querySelector('[data-topbar="true"]');
    const topBarHeight = topBar?.offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - topBarHeight - 16;

    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    try {
      window.history.replaceState(null, '', `#${id}`);
    } catch (_) {
      // ignore
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setErrorMsg('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNormToggle = (normValue) => {
    setFormData(prev => {
      const current = Array.isArray(prev.norms) ? prev.norms : [];
      const selected = new Set(current);
      if (selected.has(normValue)) {
        selected.delete(normValue);
      } else {
        selected.add(normValue);
      }

      const next = Array.from(selected);
      next.sort((a, b) => {
        const ai = NORMS.findIndex(n => n.value === a);
        const bi = NORMS.findIndex(n => n.value === b);
        return ai - bi;
      });

      return { ...prev, norms: next };
    });
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

    if (!Array.isArray(formData.norms) || formData.norms.length < 1) {
      setErrorMsg('Bitte wählen Sie mindestens eine ISO-Norm aus');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const finalPrice = calculateFinalPrice();
      const normCount = getNormCount();
      const normInfoLabel = getNormPricing().label;
      const normsText = getNormsText();
      
      const formEncoded = new URLSearchParams();
      formEncoded.append('paket', selectedPackage.name);
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
        setSelectedPackage(null);
        setStatus('idle');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <>
      <style>{`
        @keyframes pulse-highlight {
          0% {
            box-shadow: 0 0 0 0 rgba(3, 70, 143, 0.4);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(3, 70, 143, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(3, 70, 143, 0);
          }
        }
      `}</style>
      
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.heading} 100%)`, padding: 'clamp(18px, 5vw, 54px) clamp(12px, 4vw, 20px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Top bar - SOLID WHITE - STICKY */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'white',
            paddingTop: '12px',
            paddingBottom: '12px',
            marginLeft: 'calc(-1 * clamp(12px, 4vw, 20px))',
            marginRight: 'calc(-1 * clamp(12px, 4vw, 20px))',
            paddingLeft: 'clamp(12px, 4vw, 20px)',
            paddingRight: 'clamp(12px, 4vw, 20px)',
            boxShadow: '0 2px 8px rgba(16, 41, 66, 0.08)',
            marginBottom: '0'
          }}>
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <img src="/qm-guru-logo-v1.svg" alt="QM-Guru" style={{ height: '30px', width: 'auto', display: 'block' }} />
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <a
                  href="#pakete"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('pakete');
                  }}
                  style={{
                    textDecoration: 'none',
                    color: BRAND.heading,
                    fontWeight: 800,
                    fontSize: '13px',
                    padding: '10px 14px',
                    borderRadius: '999px',
                    background: BRAND.accent500,
                    border: `1px solid ${BRAND.accent500}`
                  }}
                >
                  Beratungsangebot anfordern
                </a>
                <a
                  href="https://iso-9001-berater-kosten.qm-guru.de/"
                  style={{
                    textDecoration: 'none',
                    color: BRAND.heading,
                    fontWeight: 700,
                    fontSize: '13px',
                    padding: '10px 12px',
                    borderRadius: '999px',
                    background: 'rgba(16, 41, 66, 0.08)',
                    border: '1px solid rgba(16, 41, 66, 0.14)'
                  }}
                >
                  ISO 9001 Leitfaden
                </a>
                <a
                  href="tel:+4991149522541"
                  style={{
                    textDecoration: 'none',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '13px',
                    padding: '10px 14px',
                    borderRadius: '999px',
                    background: BRAND.primary
                  }}
                >
                  0911-49522541
                </a>
              </div>
            </div>
          </div>

          {/* Progress Indicator - STICKY & OPAQUE */}
          <div style={{
            position: 'sticky',
            top: '54px',
            zIndex: 40,
            background: BRAND.primary,
            borderRadius: '0',
            padding: '20px',
            marginBottom: '40px',
            marginTop: '0',
            boxShadow: '0 4px 12px rgba(16, 41, 66, 0.15)',
            marginLeft: 'calc(-1 * clamp(12px, 4vw, 20px))',
            marginRight: 'calc(-1 * clamp(12px, 4vw, 20px))',
            paddingLeft: 'clamp(12px, 4vw, 20px)',
            paddingRight: 'clamp(12px, 4vw, 20px)'
          }}>
            <div style={{ 
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px', 
              flexWrap: 'wrap' 
            }}>
              {/* Step 1 - Paket wählen */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: selectedPackage ? '#48bb78' : 'rgba(255,255,255,0.2)',
                  color: selectedPackage ? 'white' : 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '16px',
                  transition: 'all 0.3s'
                }}>
                  {selectedPackage ? <CheckCircle2 size={20} /> : '1'}
                </div>
                <span style={{ 
                  color: selectedPackage ? 'white' : 'rgba(255,255,255,0.6)', 
                  fontWeight: selectedPackage ? '800' : '600', 
                  fontSize: '14px' 
                }}>
                  Paket wählen
                </span>
              </div>

              {/* Divider */}
              <div style={{
                width: '60px',
                height: '2px',
                background: selectedPackage ? '#48bb78' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s'
              }} />

              {/* Step 2 - Formular ausfüllen */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isFormComplete ? '#48bb78' : 'rgba(255,255,255,0.2)',
                  color: isFormComplete ? 'white' : 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '16px',
                  transition: 'all 0.3s'
                }}>
                  {isFormComplete ? <CheckCircle2 size={20} /> : '2'}
                </div>
                <span style={{ 
                  color: isFormComplete ? 'white' : 'rgba(255,255,255,0.6)', 
                  fontWeight: isFormComplete ? '800' : '600', 
                  fontSize: '14px' 
                }}>
                  Formular ausfüllen
                </span>
              </div>

              {/* Divider */}
              <div style={{
                width: '60px',
                height: '2px',
                background: isFormComplete ? '#48bb78' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s'
              }} />

              {/* Step 3 - Angebot erhalten */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: status === 'success' ? '#48bb78' : 'rgba(255,255,255,0.2)',
                  color: status === 'success' ? 'white' : 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '16px',
                  transition: 'all 0.3s'
                }}>
                  {status === 'success' ? <CheckCircle2 size={20} /> : '3'}
                </div>
                <span style={{ 
                  color: status === 'success' ? 'white' : 'rgba(255,255,255,0.6)', 
                  fontWeight: status === 'success' ? '800' : '600', 
                  fontSize: '14px' 
                }}>
                  Angebot erhalten
                </span>
              </div>
            </div>
          </div>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '60px', color: 'white' }}>
            <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: '700', marginBottom: '16px', lineHeight: '1.15' }}>
              🎯 Ihr individuelles ISO-Angebot
            </h1>
            <p style={{ fontSize: 'clamp(14px, 2.2vw, 20px)', opacity: 0.95, maxWidth: '1000px', margin: '0 auto', padding: '0 12px' }}>
              ISO-Beratung seit 1994 • transparent • praxisnah
            </p>
          </div>

          {/* Trust Section */}
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: 'clamp(18px, 4vw, 32px)', 
            marginBottom: '40px',
            boxShadow: BRAND.shadow,
            display: 'flex',
            alignItems: 'center',
            gap: '32px',
            flexWrap: 'wrap'
          }}>
            <img 
              src="https://qm-guru.de/wp-content/uploads/holger-grosser-qm-guru-web-1024x977.webp"
              alt="Holger Grosser"
              style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: `4px solid ${BRAND.primary}`
              }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: BRAND.heading }}>
                Holger Grosser
              </h3>
              <p style={{ fontSize: '16px', color: BRAND.text, marginBottom: '16px' }}>
                Der QM-Guru aus Fürth
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ background: BRAND.accent200, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', color: BRAND.heading, border: `1px solid ${BRAND.accent500}` }}>
                  ✓ Erfahrung seit 1994
                </span>
                <span style={{ background: 'rgba(3, 70, 143, 0.08)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', color: BRAND.primary }}>
                  ✓ Klare Pakete
                </span>
                <span style={{ background: 'rgba(16, 41, 66, 0.08)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', color: BRAND.heading }}>
                  ✓ Angebot als PDF per E-Mail
                </span>
              </div>
            </div>
          </div>

          {/* Pay After Certification */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '40px',
            boxShadow: '0 10px 40px rgba(16, 41, 66, 0.10)'
          }}>
            <div style={{
              border: '2px solid rgba(16, 41, 66, 0.12)',
              borderRadius: '14px',
              padding: '20px',
              background: `linear-gradient(135deg, ${BRAND.accent200} 0%, rgba(253, 249, 243, 1) 100%)`,
              color: BRAND.heading
            }}>
              <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '10px' }}>
                💰 SIE ZAHLEN ERST, WENN SIE ZERTIFIZIERT SIND
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                Kein Risiko. Kein Vorschuss. Keine Anzahlung. Ich arbeite – Sie bekommen das Zertifikat – DANN bezahlen Sie. Warum? Weil ich weiß, dass es funktioniert. 1.000+ Audits. Seit 1994.
              </div>
            </div>
          </div>

          {/* Package Cards */}
          <div id="pakete" style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', textAlign: 'center', marginBottom: '18px', color: 'white' }}>
              Wählen Sie Ihr passendes Paket
            </h2>
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.92)', fontSize: '14px', marginBottom: '22px' }}>
              Preis & Stunden passen sich automatisch an (je nach Normen).
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '24px' 
            }}>
              {PACKAGES.map(pkg => {
                const isSelected = selectedPackage?.id === pkg.id;
                
                return (
                  <div
                    key={pkg.id}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '32px',
                      transition: 'all 0.3s',
                      border: isSelected ? `3px solid ${BRAND.primary}` : '3px solid transparent',
                      boxShadow: isSelected ? '0 10px 40px rgba(3, 70, 143, 0.25)' : '0 4px 12px rgba(16, 41, 66, 0.10)',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      position: 'relative'
                    }}
                  >
                    {/* Checkmark when selected */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: '#48bb78',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <CheckCircle2 size={20} />
                      </div>
                    )}

                    <div style={{
                      color: pkg.accent,
                      fontSize: '28px',
                      fontWeight: '700',
                      marginBottom: '8px'
                    }}>
                      {pkg.name}
                    </div>
                    <div style={{ fontSize: '14px', color: BRAND.text, opacity: 0.82, marginBottom: '16px' }}>
                      {pkg.subtitle}
                    </div>
                    <div style={{ fontSize: '42px', fontWeight: '700', color: BRAND.heading, marginBottom: '4px' }}>
                      {pkg.basePrice.toLocaleString('de-DE')}€
                    </div>
                    <div style={{ fontSize: '13px', color: BRAND.text, opacity: 0.82, marginBottom: '24px' }}>
                      Projektzeiten: {pkg.hours} Stunden • ab 1 Norm
                    </div>
                    
                    {/* CTA Button - ALWAYS VISIBLE */}
                    <button
                      onClick={() => handlePackageSelect(pkg)}
                      style={{
                        width: '100%',
                        padding: '14px 24px',
                        fontSize: '16px',
                        fontWeight: '800',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: isSelected ? '#48bb78' : BRAND.primary,
                        color: 'white',
                        marginBottom: '24px',
                        transition: 'all 0.3s',
                        boxShadow: isSelected ? 'none' : '0 4px 12px rgba(3, 70, 143, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(3, 70, 143, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(3, 70, 143, 0.3)';
                        }
                      }}
                    >
                      {isSelected ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <CheckCircle2 size={20} />
                          Ausgewählt
                        </span>
                      ) : (
                        'Jetzt wählen'
                      )}
                    </button>

                    <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: '24px' }}>
                      {pkg.features.map((feature, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                          <Check size={20} style={{ color: BRAND.primary, flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontSize: '14px', color: BRAND.text, lineHeight: '1.6' }}>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Section */}
          <div id="formular" style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '40px',
            boxShadow: BRAND.shadow,
            position: 'relative'
          }}>
            {/* Disabled Overlay when no package selected */}
            {!selectedPackage && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(3px)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                gap: '16px',
                padding: '40px'
              }}>
                <div style={{ fontSize: '64px' }}>☝️</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: BRAND.heading, textAlign: 'center' }}>
                  Bitte wählen Sie zuerst ein Paket aus
                </div>
                <div style={{ fontSize: '16px', color: BRAND.text, textAlign: 'center', maxWidth: '400px' }}>
                  Klicken Sie oben auf "Jetzt wählen" bei Ihrem gewünschten Paket
                </div>
                <button
                  onClick={() => scrollToSection('pakete')}
                  style={{
                    padding: '12px 28px',
                    fontSize: '16px',
                    fontWeight: '800',
                    border: 'none',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    background: BRAND.primary,
                    color: 'white',
                    marginTop: '12px',
                    boxShadow: '0 4px 12px rgba(3, 70, 143, 0.3)'
                  }}
                >
                  Zu den Paketen
                </button>
              </div>
            )}

            {selectedPackage && (
              <div style={{
                background: `linear-gradient(135deg, rgba(3, 70, 143, 0.06) 0%, rgba(201, 160, 39, 0.12) 100%)`,
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '32px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: BRAND.text, opacity: 0.9, marginBottom: '4px' }}>
                  Gewähltes Paket:
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: BRAND.heading }}>
                  {selectedPackage.name} - {finalPrice.toLocaleString('de-DE')}€
                </div>
                <div style={{ fontSize: '13px', color: BRAND.text, opacity: 0.82 }}>
                  {finalHours} Stunden • {selectedPackage.subtitle}
                </div>
                <div style={{ fontSize: '12px', color: BRAND.text, marginTop: '8px' }}>
                  Normen: <strong>{normsText}</strong>
                </div>
                {getNormCount() > 1 && (
                  <div style={{ fontSize: '12px', color: BRAND.primary, marginTop: '8px', fontWeight: '800' }}>
                    Mehrere Normen gewählt (Zuschlag berücksichtigt)
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ opacity: selectedPackage ? 1 : 0.4, pointerEvents: selectedPackage ? 'auto' : 'none' }}>
              {/* Firma */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: BRAND.heading, marginBottom: '8px' }}>
                  <Building2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Firmenname <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <input
                  type="text"
                  name="firma"
                  value={formData.firma}
                  onChange={handleChange}
                  placeholder="z.B. ABC GmbH"
                  required
                  className="qm-field"
                />
              </div>

              {/* Ansprechpartner */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: BRAND.heading, marginBottom: '8px' }}>
                  <User size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Ansprechpartner <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <input
                  type="text"
                  name="ansprechpartner"
                  value={formData.ansprechpartner}
                  onChange={handleChange}
                  placeholder="z.B. Max Mustermann"
                  required
                  className="qm-field"
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: BRAND.heading, marginBottom: '8px' }}>
                  <Mail size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  E-Mail <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="max.mustermann@firma.de"
                  required
                  className="qm-field"
                />
                <div style={{ fontSize: '12px', color: BRAND.text, opacity: 0.82, marginTop: '4px' }}>
                  Hier wird Ihnen das <strong>Beratungsangebot</strong> als PDF zugesendet
                </div>
              </div>

              {/* Telefon */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: BRAND.heading, marginBottom: '8px' }}>
                  <Phone size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Telefon (optional)
                </label>
                <input
                  type="tel"
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleChange}
                  placeholder="z.B. 0911-49522541"
                  className="qm-field"
                />
              </div>

              {/* Norm-Auswahl */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: BRAND.heading, marginBottom: '8px' }}>
                  <Award size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  ISO-Norm <span style={{ color: '#e53e3e' }}>*</span>
                </label>
                <div
                  style={{
                    border: '2px solid rgba(16, 41, 66, 0.18)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ fontSize: '12px', color: BRAND.text, opacity: 0.82, marginBottom: '10px' }}>
                    Wählen Sie bis zu drei Normen (Mehrfachauswahl möglich). Der Preis passt sich automatisch an.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {NORMS.map((norm) => {
                      const checked = Array.isArray(formData.norms) && formData.norms.includes(norm.value);
                      return (
                        <label
                          key={norm.value}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            cursor: 'pointer',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: checked ? `2px solid ${BRAND.primary}` : '2px solid rgba(16, 41, 66, 0.12)',
                            background: checked ? 'rgba(3, 70, 143, 0.06)' : 'transparent',
                            transition: 'all 0.15s'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleNormToggle(norm.value)}
                            style={{ marginTop: '3px' }}
                          />
                          <span style={{ fontSize: '14px', color: BRAND.heading, lineHeight: '1.4' }}>{norm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '12px', color: BRAND.text, opacity: 0.82, marginTop: '10px' }}>
                    {getNormCount() === 1 && 'Basispreis für eine Norm'}
                    {getNormCount() > 1 && 'Mehrnormen-Aufwand wird berücksichtigt'}
                  </div>
                </div>
              </div>

              {/* Geltungsbereich */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: BRAND.heading, marginBottom: '8px' }}>
                  <TrendingUp size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Geltungsbereich
                </label>
                <input
                  type="text"
                  name="geltungsbereich"
                  value={formData.geltungsbereich}
                  onChange={handleChange}
                  placeholder="z.B. Handel, Entwicklung, Vertrieb, Produktion von …"
                  className="qm-field"
                />
              </div>

              {/* Fragen */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: BRAND.heading, marginBottom: '8px' }}>
                  <FileText size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Zusätzliche Fragen (optional)
                </label>
                <textarea
                  name="fragen"
                  value={formData.fragen}
                  onChange={handleChange}
                  placeholder="Haben Sie spezielle Anforderungen oder Fragen?"
                  rows="4"
                  className="qm-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div style={{
                  background: '#fff5f5',
                  border: '2px solid #fc8181',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div style={{ color: '#c53030', fontSize: '14px' }}>{errorMsg}</div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  background: status === 'success' ? BRAND.primary : status === 'loading' ? 'rgba(16, 41, 66, 0.45)' : BRAND.accent500,
                  color: status === 'idle' ? BRAND.heading : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: status === 'idle' ? '0 12px 28px rgba(16, 41, 66, 0.24)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (status === 'idle') e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (status === 'idle') e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {status === 'loading' && (
                  <>
                    <Clock size={20} />
                    Wird verarbeitet...
                  </>
                )}
                {status === 'success' && (
                  <>
                    <Check size={20} />
                    Gesendet! E-Mail ist unterwegs...
                  </>
                )}
                {status === 'idle' && (
                  <>
                    <Send size={20} />
                    Beratungsangebot anfordern (PDF per E-Mail)
                  </>
                )}
                {status === 'error' && '❌ Fehler beim Versenden'}
              </button>

              {/* Success Message */}
              {status === 'success' && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(3, 70, 143, 0.06) 0%, rgba(201, 160, 39, 0.14) 100%)',
                  border: `2px solid rgba(3, 70, 143, 0.20)`,
                  borderRadius: '12px',
                  padding: '24px',
                  marginTop: '24px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: BRAND.heading, marginBottom: '12px' }}>
                    ✅ Ihre Anfrage ist raus!
                  </div>
                  <div style={{ fontSize: '14px', color: BRAND.text, lineHeight: '1.8' }}>
                    📧 Das PDF-Angebot wird in Kürze an <strong>{formData.email}</strong> gesendet.<br/>
                    💡 Absender: Holger.Grosser@iso9001.info • Bitte Spam-Ordner prüfen.<br/>
                    ☎️ Wenn nach 5 Minuten nichts ankommt: <a href="tel:+4991149522541" style={{ color: BRAND.primary, fontWeight: 900, textDecoration: 'none' }}>0911-49522541</a>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div style={{
                background: `linear-gradient(135deg, ${BRAND.bg} 0%, ${BRAND.accent200} 100%)`,
                borderLeft: `4px solid ${BRAND.primary}`,
                borderRadius: '8px',
                padding: '16px',
                marginTop: '24px',
                fontSize: '13px',
                color: BRAND.heading,
                lineHeight: '1.6'
              }}>
                <strong>💡 Automatische E-Mail-Nachverfolgung:</strong> Nach Ihrer Anfrage erhalten Sie automatisch:
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  <li>Tag 0: Ihr persönliches Angebot als PDF</li>
                  <li>Tag 7: Erste Erinnerung mit zusätzlichen Informationen</li>
                  <li>Tag 14: Zweite Erinnerung mit Details zum Ablauf</li>
                  <li>Tag 30: Finale Nachfrage</li>
                </ul>
              </div>
            </form>
          </div>

          {/* Guide teaser */}
          <div style={{
            marginTop: '40px',
            background: 'rgba(255,255,255,0.92)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '40px',
            border: `1px solid rgba(255,255,255,0.35)`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: BRAND.primary, letterSpacing: '0.02em', marginBottom: '6px' }}>
                  ISO 9001 Berater Kosten 2026
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: BRAND.heading, marginBottom: '6px' }}>
                  Der komplette Leitfaden (inkl. Kostenrechner)
                </div>
                <div style={{ fontSize: '14px', color: BRAND.text, opacity: 0.95 }}>
                  Wenn Sie vorab vergleichen möchten: Stundensatz/Tagessatz, Eigenleistung vs. Berater und alle Details zur Kostenstruktur.
                </div>
              </div>
              <a
                href="https://iso-9001-berater-kosten.qm-guru.de/#kontakt"
                style={{
                  textDecoration: 'none',
                  background: 'rgba(16, 41, 66, 0.10)',
                  color: BRAND.heading,
                  fontWeight: 900,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 41, 66, 0.12)'
                }}
              >
                Zum Leitfaden
              </a>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '60px', color: 'white', fontSize: '14px', opacity: 0.9 }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>QM-Guru | Holger Grosser</strong>
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              Simonstr. 14 | 90763 Fürth
            </p>
            <p style={{ margin: '0' }}>
              Tel. 0911-49522541 | Holger.Grosser@iso9001.info
            </p>
            <p style={{ margin: '10px 0 0 0', fontSize: '13px' }}>
              <a href="https://qm-guru.de/sonstiges/impressum/" target="_blank" rel="noopener" style={{ color: 'rgba(255,255,255,0.92)', textDecoration: 'underline' }}>Impressum</a>
              {' '}|{' '}
              <a href="https://qm-guru.de/sonstiges/datenschutz/" target="_blank" rel="noopener" style={{ color: 'rgba(255,255,255,0.92)', textDecoration: 'underline' }}>Datenschutz</a>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
