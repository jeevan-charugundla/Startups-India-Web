'use strict';

// ── Design tokens ────────────────────────────────────────────────────────────
const BRAND_RED  = '#e63946';
const SITE_URL   = 'https://www.startupsindia.in';
const SUPPORT    = 'admin@startupsindia.in';
const ADDRESS    = '3rd Floor, Block C, Vaishnavi Cymbol, Financial District, HYD, Nanakramguda, Telangana 500032';
const YEAR       = new Date().getFullYear();
const F          = "Poppins,'Segoe UI','Helvetica Neue',Arial,sans-serif";

// ── Preheader (hidden inbox preview text) ────────────────────────────────────
function preheader(text) {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#fefefe;">${text}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`;
}

// ── Top announcement bar ─────────────────────────────────────────────────────
function topBar(text = 'Official communication from Startups India') {
  return `
  <tr>
    <td align="center" style="background:${BRAND_RED};padding:10px 24px;">
      <p style="margin:0;font-family:${F};font-size:11px;font-weight:700;color:#fff;letter-spacing:2px;text-transform:uppercase;">${text}</p>
    </td>
  </tr>`;
}

// ── Header with logo ─────────────────────────────────────────────────────────
function headerBlock() {
  return `
  <tr>
    <td style="background:#ffffff;padding:40px 32px 10px;text-align:center;">
      <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">
        <img src="${SITE_URL}/assets/images/logo.png" alt="Startups India Ecosystem" width="180" style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;" />
      </a>
    </td>
  </tr>`;
}

// ── Pill section label ───────────────────────────────────────────────────────
function pill(text) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
    <tr>
      <td style="padding:5px 16px;border-radius:100px;background:rgba(230,57,70,0.08);border:1px solid rgba(230,57,70,0.22);">
        <span style="font-family:${F};font-size:9.5px;font-weight:800;color:${BRAND_RED};letter-spacing:3px;text-transform:uppercase;">&#11044;&ensp;${text}</span>
      </td>
    </tr>
  </table>`;
}

// ── CTA button ───────────────────────────────────────────────────────────────
function ctaBtn(url, text = 'Learn More') {
  if (!url) return '';
  return `
  <tr>
    <td align="center" style="padding:4px 32px 36px;">
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:52px;v-text-anchor:middle;width:220px;" arcsize="8%" stroke="f" fillcolor="${BRAND_RED}"><w:anchorlock/><center style="color:#fff;font-family:sans-serif;font-size:15px;font-weight:700;">${text} &rarr;</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href="${url}" target="_blank" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#b71c1c 0%,${BRAND_RED} 50%,#ff5252 100%);color:#fff;text-decoration:none;border-radius:6px;font-family:${F};font-size:15px;font-weight:700;letter-spacing:0.3px;box-shadow:0 8px 28px rgba(230,57,70,0.40),0 2px 8px rgba(0,0,0,0.20);">${text}&ensp;&rarr;</a>
      <!--<![endif]-->
    </td>
  </tr>`;
}

// ── Stat strip ───────────────────────────────────────────────────────────────
function statStrip() {
  return `
  <tr>
    <td style="background:#fafafa;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;padding:20px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="border-right:1px solid #eee;padding:0 8px;">
            <p style="margin:0 0 3px;font-family:${F};font-size:20px;font-weight:900;color:#0a0a0a;">1,000+</p>
            <p style="margin:0;font-family:${F};font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1.5px;">Founders</p>
          </td>
          <td align="center" style="border-right:1px solid #eee;padding:0 8px;">
            <p style="margin:0 0 3px;font-family:${F};font-size:20px;font-weight:900;color:#0a0a0a;">50+</p>
            <p style="margin:0;font-family:${F};font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1.5px;">Mentors</p>
          </td>
          <td align="center" style="padding:0 8px;">
            <p style="margin:0 0 3px;font-family:${F};font-size:20px;font-weight:900;color:#0a0a0a;">&#8377;50L+</p>
            <p style="margin:0;font-family:${F};font-size:10px;color:#999;text-transform:uppercase;letter-spacing:1.5px;">Funding Access</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ── Thin divider ─────────────────────────────────────────────────────────────
function hr() {
  return `
  <tr>
    <td style="padding:0 32px 24px;">
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.07),transparent);"></div>
    </td>
  </tr>`;
}

// ── Help row ─────────────────────────────────────────────────────────────────
function helpRow() {
  return `
  <tr>
    <td style="padding:20px 32px;background:#f8f8f8;border-top:1px solid #efefef;">
      <p style="margin:0;font-family:${F};font-size:12.5px;color:#888;line-height:1.6;">
        Need help? Contact us at <a href="mailto:${SUPPORT}" style="color:${BRAND_RED};text-decoration:none;font-weight:600;">${SUPPORT}</a>
      </p>
    </td>
  </tr>`;
}

// ── Footer ───────────────────────────────────────────────────────────────────
function footerBlock(unsubscribeUrl = null) {
  return `
  <tr>
    <td style="background:#fafafa;padding:32px 32px 28px;text-align:center;border-top:1px solid #f0f0f0;">

      <!-- Logo -->
      <a href="${SITE_URL}" target="_blank" style="text-decoration:none; display:inline-block; margin-bottom: 16px;">
         <img src="${SITE_URL}/assets/images/logo.png" alt="Startups India Ecosystem" width="120" style="display:block; border:0;" />
      </a>
      <p style="margin:0 0 22px;font-family:${F};font-size:10px;font-weight:600;color:#888;letter-spacing:1px;text-transform:uppercase;">
        Empowering India's Entrepreneurial Ecosystem
      </p>

      <!-- Nav links -->
      <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 20px;">
        <tr>
          <td style="padding:0 10px;"><a href="${SITE_URL}/programs" style="font-family:${F};font-size:12px;color:#666;text-decoration:none;font-weight:500;">Programs</a></td>
          <td style="font-family:${F};font-size:12px;color:#ddd;">|</td>
          <td style="padding:0 10px;"><a href="${SITE_URL}/mentors" style="font-family:${F};font-size:12px;color:#666;text-decoration:none;font-weight:500;">Mentors</a></td>
          <td style="font-family:${F};font-size:12px;color:#ddd;">|</td>
          <td style="padding:0 10px;"><a href="${SITE_URL}/events" style="font-family:${F};font-size:12px;color:#666;text-decoration:none;font-weight:500;">Events</a></td>
          <td style="font-family:${F};font-size:12px;color:#ddd;">|</td>
          <td style="padding:0 10px;"><a href="${SITE_URL}/community" style="font-family:${F};font-size:12px;color:#666;text-decoration:none;font-weight:500;">Community</a></td>
        </tr>
      </table>

      <!-- Divider -->
      <div style="height:1px;background:#eee;margin:0 0 20px;"></div>

      <!-- Address + legal -->
      <p style="margin:0 0 8px;font-family:${F};font-size:11px;color:#777;line-height:1.6;">${ADDRESS}</p>
      <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
        <tr>
          <td style="padding:0 8px;"><a href="${SITE_URL}/privacy" style="font-family:${F};font-size:11px;color:#777;text-decoration:underline;">Privacy Policy</a></td>
          <td style="font-family:${F};font-size:11px;color:#ddd;">|</td>
          <td style="padding:0 8px;"><a href="${SITE_URL}/terms" style="font-family:${F};font-size:11px;color:#777;text-decoration:underline;">Terms of Service</a></td>
          ${unsubscribeUrl ? `
          <td style="font-family:${F};font-size:11px;color:#ddd;">|</td>
          <td style="padding:0 8px;"><a href="${unsubscribeUrl}" style="font-family:${F};font-size:11px;color:#777;text-decoration:underline;">Unsubscribe</a></td>` : ''}
        </tr>
      </table>
      <p style="margin:0;font-family:${F};font-size:11px;color:#999;">&copy; ${YEAR} Startups India. All rights reserved.</p>
    </td>
  </tr>`;
}

// ── Master wrapper ───────────────────────────────────────────────────────────
function wrap(preheaderText, topBarText, innerRows, unsubscribeUrl = null) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Startups India Ecosystem</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>td{font-family:Arial,sans-serif!important;}a{text-decoration:none;}</style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap');
    body,table,td,p,a,span{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
    @media only screen and (max-width:600px){
      .email-container{width:100%!important;}
      .hero-heading{font-size:26px!important;}
      .body-pad{padding:28px 20px!important;}
      .stat-td{display:block!important;width:100%!important;border-right:none!important;border-bottom:1px solid #eee;padding:12px 0!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#e8e8e8;-webkit-font-smoothing:antialiased;mso-line-height-rule:exactly;">
  ${preheader(preheaderText)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e8e8e8;min-width:100%;">
    <tr>
      <td align="center" style="padding:32px 12px 40px;">
        <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:4px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.12);">

          ${topBar(topBarText)}
          ${headerBlock()}

          <!-- Content card -->
          <tr>
            <td style="background:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${innerRows}
                ${helpRow()}
              </table>
            </td>
          </tr>

          ${footerBlock(unsubscribeUrl)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Exported templates ───────────────────────────────────────────────────────

function getConfirmationEmailTemplate(userName, confirmationLink) {
  const name = userName || 'Founder';
  const inner = `
    <tr>
      <td class="body-pad" style="padding:36px 32px 28px;">
        ${pill('Action Required')}
        <h1 class="hero-heading" style="margin:0 0 12px;font-family:${F};font-size:32px;font-weight:900;color:#0a0a0a;line-height:1.15;letter-spacing:-0.5px;">
          Confirm your<br>email address.
        </h1>
        <p style="margin:0 0 28px;font-family:${F};font-size:15px;color:#555;line-height:1.75;">
          Hi ${name}, you're almost in. One click confirms your email and unlocks full access to mentorship, funding resources, startup courses, and India's most active founder community.
        </p>
      </td>
    </tr>
    ${ctaBtn(confirmationLink, 'Confirm My Email')}
    ${statStrip()}
    ${hr()}
    <tr>
      <td style="padding:0 32px 28px;">
        <p style="margin:0 0 6px;font-family:${F};font-size:11.5px;color:#bbb;">Button not working? Paste this into your browser:</p>
        <p style="margin:0;word-break:break-all;"><a href="${confirmationLink}" style="font-family:${F};font-size:11.5px;color:${BRAND_RED};text-decoration:none;">${confirmationLink}</a></p>
        <p style="margin:12px 0 0;font-family:${F};font-size:11px;color:#ccc;">This link expires in 24 hours for security.</p>
      </td>
    </tr>`;
  const text = `Hi ${name},\n\nConfirm your Startups India account:\n${confirmationLink}\n\nExpires in 24 hours.\n\n-- Startups India Team`;
  return { subject: `${name}, confirm your email - Startups India`, html: wrap(`Confirm your email to access India's top startup ecosystem platform.`, 'Action Required', inner), text };
}

function getWelcomeEmailTemplate(userName) {
  const name = userName || 'Founder';
  const inner = `
    <tr>
      <td class="body-pad" style="padding:36px 32px 24px;">
        ${pill("You're In")}
        <h1 class="hero-heading" style="margin:0 0 12px;font-family:${F};font-size:32px;font-weight:900;color:#0a0a0a;line-height:1.15;letter-spacing:-0.5px;">
          Welcome to the<br>ecosystem, ${name}.
        </h1>
        <p style="margin:0 0 28px;font-family:${F};font-size:15px;color:#555;line-height:1.75;">
          Your account is live. Explore mentors, startup programs, investor connections, and a community of founders building the next wave of Indian startups.
        </p>
      </td>
    </tr>
    ${ctaBtn(`${SITE_URL}/dashboard`, 'Go to My Dashboard')}
    ${statStrip()}
    ${hr()}
    <tr>
      <td style="padding:0 32px 28px;">
        <p style="margin:0 0 14px;font-family:${F};font-size:11px;font-weight:800;color:#aaa;text-transform:uppercase;letter-spacing:2px;">Where to start</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${[
            ['Mentorship', 'Connect with serial founders and investors', `${SITE_URL}/mentors`],
            ['Courses', 'Learn fundraising, product, and growth', `${SITE_URL}/courses`],
            ['Community', 'Network with 1,000+ founders across India', `${SITE_URL}/community`],
            ['Events', 'Pitch competitions, hackathons, and meetups', `${SITE_URL}/events`],
          ].map(([title, desc, url], i, arr) => `
          <tr>
            <td style="padding:10px 0;${i < arr.length - 1 ? 'border-bottom:1px solid #f2f2f2;' : ''}">
              <a href="${url}" style="font-family:${F};font-size:14px;font-weight:700;color:#0a0a0a;text-decoration:none;">${title} &rarr;</a>
              <p style="margin:2px 0 0;font-family:${F};font-size:12px;color:#999;">${desc}</p>
            </td>
          </tr>`).join('')}
        </table>
      </td>
    </tr>`;
  const text = `Welcome to Startups India, ${name}!\n\nYour account is live. Start here:\nhttps://startupsindia.in/dashboard\n\n-- Startups India Team`;
  return { subject: `Welcome aboard, ${name} - Startups India`, html: wrap(`Your Startups India account is live. Explore, connect, and build.`, "You're In", inner), text };
}

function getEventNotificationEmailTemplate(eventTitle, messageBody, recipientName) {
  const name = recipientName || 'Founder';
  const inner = `
    <tr>
      <td class="body-pad" style="padding:36px 32px 28px;">
        ${pill('Event Update')}
        <h1 class="hero-heading" style="margin:0 0 8px;font-family:${F};font-size:28px;font-weight:900;color:#0a0a0a;line-height:1.2;letter-spacing:-0.3px;">
          ${eventTitle}
        </h1>
        <p style="margin:0 0 24px;font-family:${F};font-size:11px;color:#bbb;text-transform:uppercase;letter-spacing:2px;">Important update for registered attendees</p>
        <p style="margin:0 0 4px;font-family:${F};font-size:15px;color:#333;font-weight:600;">Hi ${name},</p>
        <div style="font-family:${F};font-size:15px;color:#555;line-height:1.8;white-space:pre-wrap;">${messageBody}</div>
      </td>
    </tr>
    ${hr()}`;
  const text = `${eventTitle}\n\nHi ${name},\n\n${messageBody}\n\nNeed help? ${SUPPORT}\n\n-- Startups India Team`;
  return { subject: `${eventTitle} - Event Update`, html: wrap(`Important update about ${eventTitle} on Startups India.`, 'Event Update', inner), text };
}

// ── Event ticket / registration confirmation ────────────────────────────────
// Sent after a successful (free or paid) event registration. Acts as the ticket.
function getEventTicketEmailTemplate({
  recipientName,
  eventTitle,
  ticketTypeName,
  ticketCode,
  amountPaidPaise = 0,
  dateText = '',
  timeText = '',
  venueText = '',
  modeText = '',
  meetingLink = '',
  postRegistrationMessage = '',
  eventUrl = '',
}) {
  const name = esc(recipientName || 'Founder');
  const paid = amountPaidPaise > 0 ? `\u20B9${(amountPaidPaise / 100).toLocaleString('en-IN')}` : 'Free';

  const detailRow = (label, value) => value ? `
    <tr>
      <td style="padding:8px 0;font-family:${F};font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;width:130px;vertical-align:top;">${esc(label)}</td>
      <td style="padding:8px 0;font-family:${F};font-size:14px;color:#0a0a0a;font-weight:600;">${esc(value)}</td>
    </tr>` : '';

  const inner = `
    <tr>
      <td class="body-pad" style="padding:36px 32px 12px;">
        ${pill('Registration Confirmed')}
        <h1 class="hero-heading" style="margin:0 0 8px;font-family:${F};font-size:28px;font-weight:900;color:#0a0a0a;line-height:1.2;letter-spacing:-0.3px;">
          You're in! 🎉
        </h1>
        <p style="margin:0 0 4px;font-family:${F};font-size:15px;color:#333;font-weight:600;">Hi ${name},</p>
        <p style="margin:0 0 24px;font-family:${F};font-size:15px;color:#555;line-height:1.75;">
          Your registration for <strong style="color:#0a0a0a;">${esc(eventTitle)}</strong> is confirmed. Here is your ticket - please keep this email for entry.
        </p>
      </td>
    </tr>

    <!-- Ticket card -->
    <tr>
      <td style="padding:0 32px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px dashed #cbd5e1;border-radius:12px;background:#fbfcfe;">
          <tr>
            <td style="padding:20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${detailRow('Ticket', ticketTypeName || 'General')}
                ${ticketCode ? detailRow('Ticket Code', ticketCode) : ''}
                ${detailRow('Amount', paid)}
                ${detailRow('Date', dateText)}
                ${detailRow('Time', timeText)}
                ${detailRow(modeText === 'Online' ? 'Format' : 'Venue', modeText === 'Online' ? 'Online Event' : venueText)}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${meetingLink ? `
    <tr>
      <td style="padding:0 32px 20px;">
        <p style="margin:0 0 6px;font-family:${F};font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Join Link</p>
        <a href="${esc(meetingLink)}" style="font-family:${F};font-size:14px;color:${BRAND_RED};text-decoration:none;word-break:break-all;">${esc(meetingLink)}</a>
      </td>
    </tr>` : ''}

    ${postRegistrationMessage ? `
    <tr>
      <td style="padding:0 32px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:16px 18px;background:rgba(230,57,70,0.05);border-left:3px solid ${BRAND_RED};border-radius:6px;">
              <div style="font-family:${F};font-size:14px;color:#444;line-height:1.7;white-space:pre-wrap;">${esc(postRegistrationMessage)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ''}

    ${eventUrl ? ctaBtn(eventUrl, 'View Event Details') : ''}
    ${hr()}`;

  const textLines = [
    `Hi ${recipientName || 'Founder'},`,
    ``,
    `Your registration for "${eventTitle}" is confirmed. Keep this email as your ticket.`,
    ``,
    `Ticket: ${ticketTypeName || 'General'}`,
    ticketCode ? `Ticket Code: ${ticketCode}` : '',
    `Amount: ${paid}`,
    dateText ? `Date: ${dateText}` : '',
    timeText ? `Time: ${timeText}` : '',
    modeText === 'Online' ? 'Format: Online Event' : (venueText ? `Venue: ${venueText}` : ''),
    meetingLink ? `Join Link: ${meetingLink}` : '',
    postRegistrationMessage ? `\n${postRegistrationMessage}` : '',
    eventUrl ? `\nView event: ${eventUrl}` : '',
    ``,
    `Need help? ${SUPPORT}`,
    ``,
    `-- Startups India Team`,
  ].filter(l => l !== '');

  return {
    subject: `🎟 Your ticket for ${eventTitle}`,
    html: wrap(`Your registration for ${eventTitle} is confirmed.`, 'Registration Confirmed', inner),
    text: textLines.join('\n'),
  };
}

function getBroadcastEmailTemplate({ subject, body, ctaUrl, ctaText }) {
  const inner = `
    <tr>
      <td class="body-pad" style="padding:36px 32px 28px;">
        ${pill('From Startups India')}
        <div style="font-family:${F};font-size:15px;color:#444;line-height:1.85;white-space:pre-wrap;">${body}</div>
      </td>
    </tr>
    ${ctaUrl ? ctaBtn(ctaUrl, ctaText || 'Learn More') : ''}
    ${hr()}`;
  const text = `${body}${ctaUrl ? `\n\n${ctaText || 'Learn More'}: ${ctaUrl}` : ''}\n\n--\nStartups India | ${SUPPORT}`;
  return { subject, html: wrap(`${subject} - An update from the Startups India team.`, 'New Update', inner, `${SITE_URL}/unsubscribe`), text };
}

// ── Security templates (password reset + 2FA) ────────────────────────────────

// Escapes values interpolated into the HTML below. fullName is user-controlled,
// so without this a display name could inject markup into the email body.
function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPasswordResetTemplate(userName, resetLink, expiryMinutes) {
  const name = esc(userName || 'Founder');
  const inner = `
    <tr>
      <td class="body-pad" style="padding:36px 32px 28px;">
        ${pill('Password Reset')}
        <h1 class="hero-heading" style="margin:0 0 12px;font-family:${F};font-size:32px;font-weight:900;color:#0a0a0a;line-height:1.15;letter-spacing:-0.5px;">
          Reset your<br>password.
        </h1>
        <p style="margin:0 0 28px;font-family:${F};font-size:15px;color:#555;line-height:1.75;">
          Hi ${name}, we received a request to reset the password on your Startups India account. Click below to choose a new one.
        </p>
      </td>
    </tr>
    ${ctaBtn(resetLink, 'Reset My Password')}
    ${hr()}
    <tr>
      <td style="padding:0 32px 28px;">
        <p style="margin:0 0 14px;font-family:${F};font-size:13px;color:#555;line-height:1.7;">
          <strong style="color:#0a0a0a;">Didn't request this?</strong> Ignore this email - your password stays exactly as it is, and nobody can get into your account through this link.
        </p>
        <p style="margin:0 0 6px;font-family:${F};font-size:11.5px;color:#bbb;">Button not working? Paste this into your browser:</p>
        <p style="margin:0;word-break:break-all;"><a href="${resetLink}" style="font-family:${F};font-size:11.5px;color:${BRAND_RED};text-decoration:none;">${resetLink}</a></p>
        <p style="margin:12px 0 0;font-family:${F};font-size:11px;color:#ccc;">This link expires in ${expiryMinutes} minutes and can only be used once.</p>
      </td>
    </tr>`;
  const text = `Hi ${userName || 'Founder'},\n\nReset your Startups India password:\n${resetLink}\n\nExpires in ${expiryMinutes} minutes. Single use.\n\nDidn't request this? Ignore this email - your password will not change.\n\n-- Startups India Team`;
  return {
    subject: 'Reset your Startups India password',
    html: wrap('Reset the password on your Startups India account.', 'Password Reset', inner),
    text,
  };
}

// Sent when a reset is requested for an account that has no password (Google
// sign-in only). Tells the real owner what to do, while the API response stays
// identical either way so a stranger learns nothing about whether the email exists.
function getOAuthOnlyResetTemplate(userName, provider, loginLink) {
  const name = esc(userName || 'Founder');
  const providerName = provider === 'facebook' ? 'Facebook' : 'Google';
  const inner = `
    <tr>
      <td class="body-pad" style="padding:36px 32px 28px;">
        ${pill('Password Reset')}
        <h1 class="hero-heading" style="margin:0 0 12px;font-family:${F};font-size:32px;font-weight:900;color:#0a0a0a;line-height:1.15;letter-spacing:-0.5px;">
          Nothing to reset<br>here.
        </h1>
        <p style="margin:0 0 28px;font-family:${F};font-size:15px;color:#555;line-height:1.75;">
          Hi ${name}, someone asked to reset the password for this email. Your account signs in with <strong>${esc(providerName)}</strong> and doesn't have a password - just use the &ldquo;Continue with ${esc(providerName)}&rdquo; button on the sign-in page.
        </p>
      </td>
    </tr>
    ${ctaBtn(loginLink, 'Go to Sign In')}`;
  const text = `Hi ${userName || 'Founder'},\n\nSomeone asked to reset the password for this email. There's nothing to reset - your account signs in with ${providerName} and has no password.\n\nSign in here: ${loginLink}\n\n-- Startups India Team`;
  return {
    subject: 'About your Startups India password reset request',
    html: wrap('Your account signs in with a social provider.', 'Password Reset', inner),
    text,
  };
}

// The tripwire that lets a user notice an account takeover, so it goes out on
// every successful password change.
function getPasswordChangedTemplate(userName, changedAt, signInLink) {
  const name = esc(userName || 'Founder');
  const inner = `
    <tr>
      <td class="body-pad" style="padding:36px 32px 28px;">
        ${pill('Security Alert')}
        <h1 class="hero-heading" style="margin:0 0 12px;font-family:${F};font-size:32px;font-weight:900;color:#0a0a0a;line-height:1.15;letter-spacing:-0.5px;">
          Your password<br>was changed.
        </h1>
        <p style="margin:0 0 20px;font-family:${F};font-size:15px;color:#555;line-height:1.75;">
          Hi ${name}, the password on your Startups India account was changed on <strong>${esc(changedAt)}</strong>. You've been signed out everywhere and will need to sign in again.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
          <tr>
            <td style="padding:16px;background:rgba(230,57,70,0.05);border-left:3px solid ${BRAND_RED};border-radius:4px;">
              <p style="margin:0;font-family:${F};font-size:13.5px;color:#555;line-height:1.7;">
                <strong style="color:#0a0a0a;">Wasn't you?</strong> Your account may be compromised. Contact us immediately at
                <a href="mailto:${SUPPORT}" style="color:${BRAND_RED};text-decoration:none;font-weight:600;">${SUPPORT}</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${ctaBtn(signInLink, 'Sign In')}`;
  const text = `Hi ${userName || 'Founder'},\n\nYour Startups India password was changed on ${changedAt}. You've been signed out everywhere.\n\nWasn't you? Contact ${SUPPORT} immediately.\n\n-- Startups India Team`;
  return {
    subject: 'Your Startups India password was changed',
    html: wrap('Your account password was just changed.', 'Security Alert', inner),
    text,
  };
}

module.exports = {
  getConfirmationEmailTemplate,
  getWelcomeEmailTemplate,
  getEventNotificationEmailTemplate,
  getEventTicketEmailTemplate,
  getBroadcastEmailTemplate,
  getPasswordResetTemplate,
  getOAuthOnlyResetTemplate,
  getPasswordChangedTemplate,
  wrap,
  pill,
  ctaBtn,
  hr,
  statStrip,
};
