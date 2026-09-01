interface LowRatingEmailInput {
  businessName: string;
  rating: number;
  message: string | undefined;
  customerName: string | undefined;
  customerPhone: string | undefined;
  submittedAt: Date;
  feedbackId: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function renderLowRatingEmail(input: LowRatingEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    businessName,
    rating,
    message,
    customerName,
    customerPhone,
    submittedAt,
    feedbackId,
  } = input;

  const when = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Melbourne",
  }).format(submittedAt);

  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const name = customerName ?? "Not provided";
  const phone = customerPhone ?? "Not provided";
  const body = message ?? "No written message.";

  const subject = `${rating}-star feedback — ${businessName}`;

  const text = [
    `New low rating for ${businessName}`,
    "",
    `Rating: ${rating}/5 (${stars})`,
    `Customer: ${name}`,
    `Phone: ${phone}`,
    `Message: ${body}`,
    "",
    `Submitted: ${when} (Melbourne)`,
    `Reference: ${feedbackId}`,
  ].join("\n");

  const phoneCell = customerPhone
    ? `<a href="tel:${escapeHtml(customerPhone.replace(/[^\d+]/g, ""))}">${escapeHtml(customerPhone)}</a>`
    : "Not provided";

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f5f1e8;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#29261f;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e5dac7;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#47613c;">${escapeHtml(businessName)}</p>
          <h1 style="margin:0 0 16px;font-size:20px;">New ${rating}-star feedback</h1>
          <p style="margin:0 0 20px;font-size:22px;color:#b67c31;letter-spacing:2px;">${stars}</p>
          <table role="presentation" width="100%" style="font-size:14px;line-height:1.6;">
            <tr><td style="padding:6px 0;color:#706b60;width:120px;">Customer</td><td style="padding:6px 0;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:6px 0;color:#706b60;">Phone</td><td style="padding:6px 0;">${phoneCell}</td></tr>
            <tr><td style="padding:6px 0;color:#706b60;vertical-align:top;">Message</td><td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(body)}</td></tr>
            <tr><td style="padding:6px 0;color:#706b60;">Submitted</td><td style="padding:6px 0;">${escapeHtml(when)} (Melbourne)</td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#9a9386;">Reference: ${escapeHtml(feedbackId)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
