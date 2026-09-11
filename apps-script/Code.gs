/**
 * Raade's Tea House — feedback sink.
 *
 * The Next.js server (POST /api/feedback) calls this web app once per
 * 1–3★ submission. This script:
 *   1. appends ONE row to the "Feedback" sheet, and
 *   2. emails the owner (ratings 1–3 only).
 *
 * It is idempotent on `feedbackId`: calling it again for the same submission
 * (a retry, a double request) re-returns the first result and does NOT write a
 * second row or send a second email.
 *
 * There is NO onEdit / onChange trigger and this script needs NO Google Cloud
 * service account — it runs as you and writes your own sheet.
 *
 * ── Deploy ────────────────────────────────────────────────────────────────
 *  1. Extensions ▸ Apps Script from the Feedback spreadsheet (so it is bound
 *     to that spreadsheet). Paste this file over Code.gs. Save.
 *  2. Project Settings ▸ Script properties ▸ add:
 *       NOTIFY_SHARED_SECRET   = <a long random string>
 *       SPREADSHEET_ID         = <optional; only if the script is NOT bound
 *                                 to the spreadsheet>
 *  3. Deploy ▸ New deployment ▸ Web app
 *       Execute as: Me     Who has access: Anyone
 *     Authorize when prompted. Copy the /exec URL.
 *  4. In the site env (Vercel + .env.local):
 *       APPS_SCRIPT_NOTIFY_URL     = <the /exec URL>
 *       APPS_SCRIPT_NOTIFY_SECRET  = <same string as NOTIFY_SHARED_SECRET>
 *  5. Delete the old "From spreadsheet · On edit · onNewFeedbackRow" trigger.
 *
 * After any code edit: Deploy ▸ Manage deployments ▸ edit ▸ New version.
 */

var SHEET_NAME = 'Feedback';
var TO_EMAIL = 'aramfoodsau@gmail.com';
var NOTIFY_RATINGS = [1, 2, 3];
var HEADERS = ['Rating', 'Name', 'Phone', 'Customer Email', 'Message', 'Created At'];
var DEDUPE_TTL_MS = 3 * 24 * 60 * 60 * 1000; // remember processed ids for 3 days

function getSharedSecret_() {
  return PropertiesService.getScriptProperties().getProperty('NOTIFY_SHARED_SECRET') || '';
}

function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  var ss = id
    ? SpreadsheetApp.openById(id)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet: bind the script to the sheet or set SPREADSHEET_ID');
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet tab "' + SHEET_NAME + '" not found');
  return sheet;
}

function doGet() {
  return json_({ ok: true, service: 'raades-feedback-sink' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json_({ ok: false, error: 'empty body' });
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      return json_({ ok: false, error: 'invalid JSON body' });
    }

    if (!getSharedSecret_() || String(body.secret || '') !== getSharedSecret_()) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    var feedbackId = String(body.feedbackId || '').trim();
    if (!feedbackId) return json_({ ok: false, error: 'missing feedbackId' });

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var props = PropertiesService.getScriptProperties();
      var key = 'done:' + feedbackId;

      var prior = props.getProperty(key);
      if (prior) {
        var cached = JSON.parse(prior);
        cached.deduped = true;
        return json_(cached);
      }

      var rating = Number(body.rating);
      var name = body.customerName ? String(body.customerName) : '';
      var phone = body.customerPhone ? String(body.customerPhone) : '';
      var customerEmail = body.customerEmail ? String(body.customerEmail) : '';
      var message = body.message ? String(body.message) : '';
      var createdAt = body.createdAtIso ? String(body.createdAtIso) : new Date().toISOString();
      var businessName = body.businessName ? String(body.businessName) : "Raade's Tea House";

      // 1. one row
      var sheet = getSheet_();
      ensureHeaders_(sheet);
      sheet.appendRow([rating, name, phone, customerEmail, message, createdAt]);
      var rowNumber = sheet.getLastRow();

      // 2. one email (1–3★ only)
      var emailed = false;
      if (NOTIFY_RATINGS.indexOf(rating) !== -1) {
        MailApp.sendEmail({
          to: TO_EMAIL,
          subject: 'New ' + rating + '-Star Feedback - ' + businessName,
          body:
            'New customer feedback has been received.\n\n' +
            'Rating: ' + rating + ' Star\n' +
            'Name: ' + (name || '-') + '\n' +
            'Phone: ' + (phone || '-') + '\n' +
            'Customer Email: ' + (customerEmail || '-') + '\n' +
            'Message: ' + (message || '-') + '\n' +
            'Created At: ' + createdAt + '\n\n' +
            'Row ' + rowNumber + ' in the ' + SHEET_NAME + ' sheet.',
        });
        emailed = true;
      }

      var result = { ok: true, sheetRow: rowNumber, emailed: emailed };
      props.setProperty(
        key,
        JSON.stringify({ ok: true, sheetRow: rowNumber, emailed: emailed, at: new Date().toISOString() }),
      );
      purgeOldKeys_(props);
      return json_(result);
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() >= 1) return;
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}

function purgeOldKeys_(props) {
  var all = props.getProperties();
  var cutoff = Date.now() - DEDUPE_TTL_MS;
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('done:') !== 0) return;
    var ts;
    try {
      ts = Date.parse(JSON.parse(all[k]).at || 0);
    } catch (e) {
      ts = 0;
    }
    // keys written before we started stamping `at` have no timestamp; drop them
    // once the store gets large rather than tracking each one precisely.
    if (!ts && Object.keys(all).length > 400) props.deleteProperty(k);
    else if (ts && ts < cutoff) props.deleteProperty(k);
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
