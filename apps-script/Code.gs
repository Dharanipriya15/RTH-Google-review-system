/**
 * Raade's Tea House — Feedback sheet notifier.
 *
 * Installable trigger (Apps Script editor ▸ Triggers ▸ Add trigger):
 *   Function:      onNewFeedbackRow
 *   Event source:  From spreadsheet
 *   Event type:    On edit  (fires whenever a row is appended/edited in the
 *                  Feedback sheet — including programmatic appendRow calls
 *                  made from another bound script)
 *
 * Feedback sheet columns:
 *   A Rating | B Name | C Phone | D Customer Email | E Message
 *   F Created At | G Notification Status
 *
 * Ratings 1–3 email the owner. Ratings 4–5 are ignored — no email, no
 * status write. Column G is stamped EMAIL_SENT once the email goes out,
 * and the same guard is mirrored in PropertiesService, so a retriggered
 * edit on an already-processed row (or two triggers racing each other)
 * never sends a second email. LockService serializes concurrent runs.
 *
 * Run testNotificationWithFakeRow() from the editor to exercise the whole
 * path (append a fake row → send → stamp column G) without waiting on a
 * real submission.
 */

var SHEET_NAME = 'Feedback';
var TO_EMAIL = 'aramfoodsau@gmail.com';
var NOTIFY_RATINGS = [1, 2, 3];
var SENT_STATUS = 'EMAIL_SENT';
var COL = { RATING: 1, NAME: 2, PHONE: 3, EMAIL: 4, MESSAGE: 5, CREATED_AT: 6, STATUS: 7 };

function onNewFeedbackRow(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return; // another execution is already handling an edit

  try {
    var sheet = e && e.range
      ? e.range.getSheet()
      : SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getName() !== SHEET_NAME) return;

    var startRow = e && e.range ? e.range.getRow() : sheet.getLastRow();
    var numRows = e && e.range ? e.range.getNumRows() : 1;

    for (var i = 0; i < numRows; i++) {
      var row = startRow + i;
      if (row < 2) continue; // header row
      if (row > sheet.getLastRow()) break;
      processFeedbackRow_(sheet, row);
    }
  } finally {
    lock.releaseLock();
  }
}

function processFeedbackRow_(sheet, row) {
  var values = sheet.getRange(row, COL.RATING, 1, COL.STATUS).getValues()[0];

  var rating = Number(values[COL.RATING - 1]);
  var name = values[COL.NAME - 1] ? String(values[COL.NAME - 1]) : '';
  var phone = values[COL.PHONE - 1] ? String(values[COL.PHONE - 1]) : '';
  var customerEmail = values[COL.EMAIL - 1] ? String(values[COL.EMAIL - 1]) : '';
  var message = values[COL.MESSAGE - 1] ? String(values[COL.MESSAGE - 1]) : '';
  var createdAt = values[COL.CREATED_AT - 1] ? String(values[COL.CREATED_AT - 1]) : '';
  var status = values[COL.STATUS - 1] ? String(values[COL.STATUS - 1]) : '';

  if (!rating || NOTIFY_RATINGS.indexOf(rating) === -1) return; // 4★/5★, or not a rated row yet

  var props = PropertiesService.getScriptProperties();
  var dedupeKey = 'sent:' + sheet.getSheetId() + ':' + row;

  // Duplicate protection: column G AND PropertiesService must both be clear.
  if (status === SENT_STATUS || props.getProperty(dedupeKey)) return;

  MailApp.sendEmail({
    to: TO_EMAIL,
    subject: 'New ' + rating + "-Star Feedback - Raade's Tea House",
    body:
      'New customer feedback has been received.\n\n' +
      'Rating: ' + rating + ' Star\n' +
      'Name: ' + (name || '-') + '\n' +
      'Phone: ' + (phone || '-') + '\n' +
      'Customer Email: ' + (customerEmail || '-') + '\n' +
      'Message: ' + (message || '-') + '\n' +
      'Created At: ' + (createdAt || '-') + '\n\n' +
      'Row ' + row + ' in the ' + SHEET_NAME + ' sheet.',
  });

  sheet.getRange(row, COL.STATUS).setValue(SENT_STATUS);
  props.setProperty(dedupeKey, new Date().toISOString());
}

/**
 * Manual test: appends a fake 2★ row to the Feedback sheet and runs it
 * through the same notification path as a real edit, so email + column G
 * behavior can be verified from the Apps Script editor.
 */
function testNotificationWithFakeRow() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet tab "' + SHEET_NAME + '" not found');

  ensureHeaders_(sheet);

  sheet.appendRow([
    2,
    'Test Customer',
    '555-0100',
    'test-customer@example.com',
    'This is a test message from testNotificationWithFakeRow().',
    new Date().toISOString(),
    '',
  ]);

  processFeedbackRow_(sheet, sheet.getLastRow());
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() >= 1) return;
  sheet.getRange(1, 1, 1, 7).setValues([
    ['Rating', 'Name', 'Phone', 'Customer Email', 'Message', 'Created At', 'Notification Status'],
  ]);
}
