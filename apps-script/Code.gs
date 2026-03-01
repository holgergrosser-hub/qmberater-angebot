/**
 * ================================================================
 * QM-GURU ISO ANGEBOTS-SYSTEM - MULTI-NORM (Checkbox) COMPAT
 * ================================================================
 * 
 * Anpassung 14.01.2026:
 * - Normen kommen jetzt aus dem Formular als:
 *   - norm   (schöner Text, z.B. "ISO 9001... + ISO 14001...")
 *   - norms  (technische Liste, z.B. "ISO 9001:2015 | ISO 14001:2015")
 *   - normCount (1..3) wird vom Formular berechnet
 *   - normInfo  ("1 Norm" / "2 Normen" / "Mehrere Normen")
 * - Script bleibt abwärtskompatibel mit alten Requests.
 */

// ============================================================================
// KONFIGURATION
// ============================================================================

const CONFIG = {
  SHEET_ID: '1jNY1BmHNC-iZK-l7DwSmx6m6rsfPvr6kcXGtvjyparE',
  SHEET_NAME: 'Anfragen',
  TEMPLATE_DOC_ID: '1euEK7gODJ9ULfd4Nrz1v68BlQRqRjLESHzrHqxyxPqA',
  OUTPUT_FOLDER_ID: '1yTa6-IbZ1M4lrFERwWxCWSYaFJBhNEiA',
  HOLGER_EMAIL: 'Holger.Grosser@iso9001.info',
  EMAIL_FROM: 'Holger.Grosser@iso9001.info',
  EMAIL_FROM_NAME: 'Holger Grosser - QM-Guru',
  CC_EMAIL: '',
  ERINNERUNG_1_TAGE: 7,
  ERINNERUNG_2_TAGE: 14,
  ERINNERUNG_3_TAGE: 30,
  // Optional: für doGet-Testaktionen (als Script Property ADMIN_TOKEN setzen)
  // Wenn leer, sind nur "ping" und Status-Infos erlaubt.
  ADMIN_TOKEN: '',
  KONTAKT: {
    name: 'Holger Grosser',
    firma: 'QM-Guru | QM-Dienstleistungen',
    strasse: 'Simonstr. 14',
    plz: '90763 Fürth',
    telefon: '0911-49522541',
    fax: '0911-49522548',
    website1: 'https://QM-Guru.de',
    website2: 'https://ISO9001.info'
  },
  LINKS: {
    TERMIN: 'https://calendly.com/grosser-qmguru/termin-qm-system-iso-9001',
    FOERDERUNG: 'https://docs.google.com/document/d/1NINjOpkJ66vU_uHDJzTx1iqy_AGtxlu8J-t_Foe8iQs/edit',
    ZERTIFIKAT: 'https://qm-guru.de/iso-9001-nicht-akkreditierte-zertifizierung/'
  }
};

// Spalten-Layout im Sheet (A=1)
const SHEET_COL = {
  DATUM: 1,
  FIRMA: 2,
  ANSPRECHPARTNER: 3,
  EMAIL: 4,
  TELEFON: 5,
  NORM: 6,
  NORM_COUNT: 7,
  PAKET: 8,
  KOSTEN: 9,
  STUNDEN: 10,
  GELTUNGSBEREICH: 11,
  FRAGEN: 12,
  STATUS: 13,
  // 14 = Angebot_Datum
  PDF_URL: 15,
  REMINDER_1_SENT: 16,
  REMINDER_2_SENT: 17,
  REMINDER_3_SENT: 18
};

// ============================================================================
// HELPERS
// ============================================================================

function parseNormsFromParams(params) {
  const normsRaw = (params.norms || '').toString().trim();
  const normText = (params.norm || '').toString().trim();

  // Neue Variante: technische Liste mit " | "
  if (normsRaw) {
    const values = normsRaw.split(' | ').map(s => s.trim()).filter(Boolean);
    return {
      normsValues: values,
      normsText: normText || values.join(' + ')
    };
  }

  // Alte Variante: nur ein Feld `norm`
  if (normText) {
    // Kann jetzt auch schon ein Mehrfach-Text sein (z.B. "... + ...")
    return {
      normsValues: [],
      normsText: normText
    };
  }

  // Fallback
  return {
    normsValues: [],
    normsText: 'ISO 9001:2015'
  };
}

function deriveNormCount(params, normsValues, normsText) {
  const explicit = parseInt(params.normCount, 10);
  if (!isNaN(explicit) && explicit >= 1 && explicit <= 3) return explicit;

  if (Array.isArray(normsValues) && normsValues.length) {
    return Math.max(1, Math.min(3, normsValues.length));
  }

  // Heuristik: falls Norm-Text " + " enthält
  if (typeof normsText === 'string' && normsText.indexOf(' + ') !== -1) {
    const count = normsText.split(' + ').map(s => s.trim()).filter(Boolean).length;
    return Math.max(1, Math.min(3, count));
  }

  return 1;
}

function buildNormInfo(params, normCount) {
  const normInfo = (params.normInfo || '').toString().trim();
  if (normInfo) {
    // Entferne sichtbare Prozent-/Mehrfachnormen-Texte aus alten Requests
    return normInfo
      .replace(/\s*\(\+\d+%\)/g, '')
      .replace(/3\s+Normen/gi, 'Mehrere Normen')
      .replace(/\s*\+\d+%/g, '')
      .trim();
  }

  if (normCount === 2) return '2 Normen';
  if (normCount === 3) return 'Mehrere Normen';
  return '1 Norm';
}

function getAdminToken_() {
  const prop = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  return (prop || CONFIG.ADMIN_TOKEN || '').toString().trim();
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  return SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
}

function sheetHasCol_(sheet, col) {
  return sheet && typeof col === 'number' && col >= 1 && sheet.getLastColumn() >= col;
}

function normalizeDate_(value) {
  if (value instanceof Date) return value;
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function daysSince_(date) {
  if (!(date instanceof Date)) return null;
  const ms = Date.now() - date.getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function safeSendEmail_(options) {
  try {
    MailApp.sendEmail(options);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

// ============================================================================
// DIAGNOSTIK (optional)
// ============================================================================

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = (params.action || 'ping').toString();

  if (action === 'ping') {
    return jsonResponse_({
      status: 'ok',
      time: new Date().toISOString(),
      sheet: CONFIG.SHEET_NAME,
      reminders: {
        r1: CONFIG.ERINNERUNG_1_TAGE,
        r2: CONFIG.ERINNERUNG_2_TAGE,
        r3: CONFIG.ERINNERUNG_3_TAGE
      }
    });
  }

  const token = (params.token || '').toString().trim();
  const adminToken = getAdminToken_();
  if (!adminToken || token !== adminToken) {
    return jsonResponse_({ status: 'error', message: 'unauthorized' });
  }

  if (action === 'testEmail') {
    const to = (params.to || CONFIG.HOLGER_EMAIL).toString().trim();
    const res = test_sendErstangebot_(to);
    return jsonResponse_({ status: res.ok ? 'ok' : 'error', result: res });
  }

  if (action === 'runReminders') {
    const res = checkAndSendReminders({ dryRun: false, limit: 10 });
    return jsonResponse_({ status: 'ok', result: res });
  }

  return jsonResponse_({ status: 'error', message: 'unknown action' });
}

// ============================================================================
// HAUPTFUNKTION
// ============================================================================

function doPost(e) {
  try {
    Logger.log('=== NEUE ANFRAGE ===');
    const params = e.parameter || {};

    const parsed = parseNormsFromParams(params);
    const normCount = deriveNormCount(params, parsed.normsValues, parsed.normsText);
    const normInfo = buildNormInfo(params, normCount);

    const anfrage = {
      datum: new Date(),
      firma: params.firma || 'Unbekannt',
      ansprechpartner: params.ansprechpartner || 'Sehr geehrte/r Interessent/in',
      email: params.email || '',
      telefon: params.telefon || 'nicht angegeben',

      // Neu: norm ist der Text (auch bei Mehrfachauswahl)
      norm: parsed.normsText,
      norms: parsed.normsValues, // technische Werte-Liste (optional)
      normCount: normCount,
      normInfo: normInfo,

      paket: params.paket || 'Kleinbetriebe',
      kosten: params.kosten || '3500',
      stunden: params.stunden || '20-30',
      geltungsbereich: params.geltungsbereich || 'Nach Vereinbarung',
      fragen: params.fragen || 'keine',
      status: 'NEU'
    };

    if (!anfrage.email || !anfrage.firma) {
      throw new Error('Pflichtfelder fehlen');
    }

    // PDF generieren
    let pdfFile = null;
    try {
      pdfFile = generatePDF(anfrage);
    } catch (error) {
      Logger.log('⚠️ PDF-Fehler: ' + error.message);
    }

    // In Sheet speichern (Struktur unverändert; norm enthält jetzt den Mehrfach-Text)
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
      sheet.appendRow([
        anfrage.datum,
        anfrage.firma,
        anfrage.ansprechpartner,
        anfrage.email,
        anfrage.telefon,
        anfrage.norm,
        anfrage.normCount,
        anfrage.paket,
        anfrage.kosten,
        anfrage.stunden,
        anfrage.geltungsbereich,
        anfrage.fragen,
        anfrage.status,
        anfrage.datum,
        pdfFile ? pdfFile.getUrl() : '',
        '',
        '',
        ''
      ]);
    } catch (error) {
      Logger.log('⚠️ Sheet-Fehler: ' + error.message);
    }

    // E-Mails senden
    try {
      sendErstangebot(anfrage, pdfFile);
      sendNotificationToHolger(anfrage);
    } catch (error) {
      Logger.log('⚠️ E-Mail-Fehler: ' + error.message);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('❌ Fehler: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// PDF-GENERIERUNG
// ============================================================================

function generatePDF(anfrage) {
  const templateDoc = DriveApp.getFileById(CONFIG.TEMPLATE_DOC_ID);
  const outputFolder = DriveApp.getFolderById(CONFIG.OUTPUT_FOLDER_ID);
  const fileName = `Angebot_${anfrage.firma}_${Utilities.formatDate(new Date(), 'Europe/Berlin', 'yyyy-MM-dd')}`;
  const docCopy = templateDoc.makeCopy(fileName, outputFolder);
  const doc = DocumentApp.openById(docCopy.getId());
  const body = doc.getBody();

  const replacements = {
    '##Firma##': anfrage.firma,
    '##Ansprechpartner##': anfrage.ansprechpartner,
    '##Anprechparternera##': anfrage.ansprechpartner,
    '##Email##': anfrage.email,
    '##Telefon##': anfrage.telefon,
    '##Datum##': Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM.yyyy'),

    // Wichtig: Norm-Platzhalter bekommt jetzt den Mehrfach-Text
    '##Norm##': anfrage.norm,
    '##Norma##': anfrage.norm,

    '##Paket##': anfrage.paket,
    '##Kosten##': anfrage.kosten + ' €',
    '##Stunden##': anfrage.stunden,
    '##Geltungsbereich##': anfrage.geltungsbereich,
    '##Ausschluss##': anfrage.fragen
  };

  for (let key in replacements) {
    body.replaceText(key, replacements[key]);
  }

  doc.saveAndClose();
  const pdfBlob = docCopy.getAs('application/pdf');
  pdfBlob.setName(fileName + '.pdf');
  const pdfFile = outputFolder.createFile(pdfBlob);
  docCopy.setTrashed(true);

  return pdfFile;
}

// ============================================================================
// E-MAIL-FUNKTIONEN
// ============================================================================

function sendErstangebot(anfrage, pdfFile) {
  const paketIcon = {
    'Kleinbetriebe': '🚶',
    'Wachsende Teams': '🚴',
    'Etablierte Unternehmen': '🚗',
    'Große Strukturen': '🚀'
  }[anfrage.paket] || '🚶';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; }
.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
.content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
.package-box { background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
.info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px; }
.angaben-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
.button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
.footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-radius: 0 0 10px 10px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1 style="margin: 0;">🎯 Ihr ${anfrage.norm}-Angebot</h1>
    <p style="margin: 10px 0 0 0;">Ihr Weg zur erfolgreichen Zertifizierung</p>
  </div>

  <div class="content">
    <p>Guten Tag ${anfrage.ansprechpartner},</p>
    <p>vielen Dank für Ihr Interesse an unserer ${anfrage.norm}-Beratung!</p>
    <p><strong>Im Anhang finden Sie Ihr persönliches Angebot als PDF.</strong></p>

    <div class="package-box">
      <div>Gewähltes Paket:</div>
      <div style="font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0;">${paketIcon} ${anfrage.paket}</div>
      <div style="font-size: 36px; font-weight: bold; color: #1a202c; margin: 10px 0;">${anfrage.kosten} €</div>
      <div style="color: #718096;">Projektzeiten: ${anfrage.stunden} Stunden${anfrage.normCount > 1 ? ' • ' + anfrage.normInfo : ''}</div>
    </div>

    <h3 style="color: #667eea;">🚀 Unsere Leistungen:</h3>
    <ul style="line-height: 1.8;">
      <li>Schlanke QM-Dokumentation nach ${anfrage.norm}</li>
      <li>Internes Audit zur Vorbereitung</li>
      <li>Begleitung bei der Zertifizierung</li>
      <li>Online-Betreuung – keine Reisekosten</li>
      <li>Persönlicher Ansprechpartner</li>
    </ul>

    <div class="info-box">
      <strong>💰 Förderung nutzen!</strong><br>
      Bis zu 1.750 Euro Förderung möglich.
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${CONFIG.LINKS.TERMIN}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 14px 28px; text-decoration: none !important; border-radius: 8px; font-weight: bold; margin: 10px 5px;">📅 Beratungstermin vereinbaren</a>
      <a href="${CONFIG.LINKS.FOERDERUNG}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; padding: 14px 28px; text-decoration: none !important; border-radius: 8px; font-weight: bold; margin: 10px 5px;">💰 Fördergeld beantragen</a>
    </div>

    <div class="angaben-box">
      <strong>📋 Ihre Angaben:</strong>
      <ul style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
        <li><strong>Firma:</strong> ${anfrage.firma}</li>
        <li><strong>Norm:</strong> ${anfrage.norm}</li>
        <li><strong>Geltungsbereich:</strong> ${anfrage.geltungsbereich}</li>
      </ul>
    </div>

    <p>Bei Fragen stehe ich Ihnen gerne zur Verfügung!</p>
    <p style="margin-top: 30px;"><strong>Mit freundlichen Grüßen</strong><br>
    ${CONFIG.KONTAKT.name}<br>${CONFIG.KONTAKT.firma}</p>
  </div>

  <div class="footer">
    <p><strong>${CONFIG.KONTAKT.firma}</strong></p>
    <p>${CONFIG.KONTAKT.strasse} | ${CONFIG.KONTAKT.plz}</p>
    <p>Tel. ${CONFIG.KONTAKT.telefon} | Fax: ${CONFIG.KONTAKT.fax}</p>
    <p><a href="${CONFIG.KONTAKT.website1}">${CONFIG.KONTAKT.website1}</a> | <a href="${CONFIG.KONTAKT.website2}">${CONFIG.KONTAKT.website2}</a></p>
  </div>
</div>
</body>
</html>`;

  const emailOptions = {
    to: anfrage.email,
    subject: `Ihr ${anfrage.norm}-Angebot – ${anfrage.paket} Paket`,
    htmlBody: htmlBody,
    name: CONFIG.EMAIL_FROM_NAME
  };

  if (pdfFile) emailOptions.attachments = [pdfFile.getAs(MimeType.PDF)];
  if (CONFIG.CC_EMAIL) emailOptions.cc = CONFIG.CC_EMAIL;

  MailApp.sendEmail(emailOptions);
}

function sendNotificationToHolger(anfrage) {
  MailApp.sendEmail({
    to: CONFIG.HOLGER_EMAIL,
    subject: `🔔 Neue Anfrage: ${anfrage.firma}`,
    htmlBody: `
      <h2>Neue Anfrage</h2>
      <ul>
        <li><strong>Firma:</strong> ${anfrage.firma}</li>
        <li><strong>Ansprechpartner:</strong> ${anfrage.ansprechpartner}</li>
        <li><strong>Email:</strong> ${anfrage.email}</li>
        <li><strong>Telefon:</strong> ${anfrage.telefon}</li>
        <li><strong>Norm:</strong> ${anfrage.norm}</li>
        <li><strong>Norm-Info:</strong> ${anfrage.normInfo}</li>
        <li><strong>Anzahl Normen:</strong> ${anfrage.normCount}</li>
        <li><strong>Paket:</strong> ${anfrage.paket}</li>
        <li><strong>Kosten:</strong> ${anfrage.kosten} €</li>
      </ul>`
  });
}

// ============================================================================
// REMINDER
// ============================================================================

function sendErinnerung_(anfrage, reminderNo) {
  const subject = `Erinnerung ${reminderNo}: Ihr ${anfrage.norm}-Angebot`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color:#1a202c; line-height:1.6;">
      <p>Guten Tag ${anfrage.ansprechpartner},</p>
      <p>kurze Erinnerung zu Ihrem <strong>${anfrage.norm}</strong>-Angebot (${anfrage.paket}).</p>
      <p>Wenn Sie Fragen haben oder direkt starten möchten, antworten Sie einfach auf diese E-Mail.</p>
      <p style="margin-top:18px;"><strong>Mit freundlichen Grüßen</strong><br>${CONFIG.KONTAKT.name}<br>${CONFIG.KONTAKT.firma}</p>
    </div>
  `;

  return safeSendEmail_({
    to: anfrage.email,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.EMAIL_FROM_NAME
  });
}

function shouldProcessRow_(row) {
  const email = (row[SHEET_COL.EMAIL - 1] || '').toString().trim();
  const firma = (row[SHEET_COL.FIRMA - 1] || '').toString().trim();
  const status = (row[SHEET_COL.STATUS - 1] || '').toString().trim().toUpperCase();
  if (!email || !firma) return false;
  if (status === 'ABGESCHLOSSEN' || status === 'STOP' || status === 'STORNO') return false;
  return true;
}

function buildAnfrageFromRow_(row) {
  return {
    datum: normalizeDate_(row[SHEET_COL.DATUM - 1]) || new Date(),
    firma: (row[SHEET_COL.FIRMA - 1] || '').toString(),
    ansprechpartner: (row[SHEET_COL.ANSPRECHPARTNER - 1] || '').toString() || 'Sehr geehrte/r Interessent/in',
    email: (row[SHEET_COL.EMAIL - 1] || '').toString(),
    telefon: (row[SHEET_COL.TELEFON - 1] || '').toString(),
    norm: (row[SHEET_COL.NORM - 1] || '').toString() || 'ISO 9001:2015',
    normCount: Number(row[SHEET_COL.NORM_COUNT - 1] || 1),
    paket: (row[SHEET_COL.PAKET - 1] || '').toString(),
    kosten: (row[SHEET_COL.KOSTEN - 1] || '').toString(),
    stunden: (row[SHEET_COL.STUNDEN - 1] || '').toString(),
    geltungsbereich: (row[SHEET_COL.GELTUNGSBEREICH - 1] || '').toString(),
    fragen: (row[SHEET_COL.FRAGEN - 1] || '').toString(),
    status: (row[SHEET_COL.STATUS - 1] || '').toString()
  };
}

function checkAndSendReminders(options) {
  const opts = options || {};
  const dryRun = !!opts.dryRun;
  const limit = typeof opts.limit === 'number' ? opts.limit : 50;

  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { scanned: 0, sent: 0, dryRun: dryRun };

  let startRowIndex = 0;
  const headerCandidate = (data[0][0] || '').toString().toLowerCase();
  if (headerCandidate.indexOf('datum') !== -1) startRowIndex = 1;

  let scanned = 0;
  let sent = 0;
  const now = new Date();

  for (let i = startRowIndex; i < data.length; i++) {
    if (sent >= limit) break;
    const row = data[i];
    if (!shouldProcessRow_(row)) continue;

    const created = normalizeDate_(row[SHEET_COL.DATUM - 1]);
    const ageDays = daysSince_(created);
    if (ageDays == null) continue;
    scanned++;

    const r1 = row[SHEET_COL.REMINDER_1_SENT - 1];
    const r2 = row[SHEET_COL.REMINDER_2_SENT - 1];
    const r3 = row[SHEET_COL.REMINDER_3_SENT - 1];

    let reminderNo = 0;
    if (!r1 && ageDays >= CONFIG.ERINNERUNG_1_TAGE) reminderNo = 1;
    else if (!r2 && ageDays >= CONFIG.ERINNERUNG_2_TAGE) reminderNo = 2;
    else if (!r3 && ageDays >= CONFIG.ERINNERUNG_3_TAGE) reminderNo = 3;
    else continue;

    const anfrage = buildAnfrageFromRow_(row);
    Logger.log(`⏰ Reminder ${reminderNo} für ${anfrage.firma} (${anfrage.email})`);

    if (!dryRun) {
      const res = sendErinnerung_(anfrage, reminderNo);
      if (res.ok) {
        const sheetRow = i + 1; // 1-based
        const col = reminderNo === 1 ? SHEET_COL.REMINDER_1_SENT : (reminderNo === 2 ? SHEET_COL.REMINDER_2_SENT : SHEET_COL.REMINDER_3_SENT);
        if (sheetHasCol_(sheet, col)) {
          sheet.getRange(sheetRow, col).setValue(now);
        }
        sent++;
      } else {
        Logger.log(`❌ Reminder ${reminderNo} Fehler für ${anfrage.firma}: ${res.error}`);
      }
    } else {
      sent++;
    }
  }

  return { scanned: scanned, sent: sent, dryRun: dryRun };
}

// ============================================================================
// TEST / SETUP
// ============================================================================

function test_sendErstangebot_(toOverride) {
  const to = (toOverride || CONFIG.HOLGER_EMAIL).toString().trim();
  const anfrage = {
    datum: new Date(),
    firma: 'TEST GmbH',
    ansprechpartner: 'Max Mustermann',
    email: to,
    telefon: '0000-000000',
    norm: 'ISO 9001:2015',
    norms: ['ISO 9001:2015'],
    normCount: 1,
    normInfo: '1 Norm',
    paket: 'Kleinbetriebe',
    kosten: '3500',
    stunden: '20-30',
    geltungsbereich: 'Test',
    fragen: 'keine',
    status: 'TEST'
  };

  // Kein PDF im Test
  const res = safeSendEmail_({
    to: anfrage.email,
    subject: `TEST: Ihr ${anfrage.norm}-Angebot – ${anfrage.paket}`,
    htmlBody: `<p>Testmail OK. Norm: <strong>${anfrage.norm}</strong></p>`,
    name: CONFIG.EMAIL_FROM_NAME
  });

  Logger.log(res.ok ? '✅ Testmail gesendet' : '❌ Testmail Fehler: ' + res.error);
  return res;
}

function test_reminderRunDry() {
  const res = checkAndSendReminders({ dryRun: true, limit: 10 });
  Logger.log(JSON.stringify(res));
  return res;
}

function resetReminderTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction && t.getHandlerFunction() === 'checkAndSendReminders') {
      ScriptApp.deleteTrigger(t);
    }
  });
  Logger.log('✅ Reminder-Triggers gelöscht');
}

function setupReminderTriggers() {
  resetReminderTriggers();
  // Läuft 1x täglich morgens
  ScriptApp.newTrigger('checkAndSendReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  Logger.log('✅ Reminder-Trigger erstellt (täglich 09:00)');
}
