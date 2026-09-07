-- Tracks whether a feedback row has actually been written to the Google Sheet.
--
-- Why: a submission first claims its dedupe slot in `feedback`, then appends a
-- row to the Google Sheet. If the Sheet write fails and the customer retries
-- with the same rating/phone/message within the 10-minute dedupe window, the
-- retry must NOT be silently reported as a success unless a Sheet row was
-- actually written for it. This column lets the API tell the two cases apart.
alter table public.feedback
  add column if not exists sheet_synced_at timestamptz;
