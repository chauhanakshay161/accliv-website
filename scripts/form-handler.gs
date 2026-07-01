/**
 * Accliv Group — Contact Form Handler
 * Google Apps Script
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com and click "New project"
 * 2. Delete the default function, paste this entire file
 * 3. Save (Ctrl+S), name it "Accliv Group Form Handler"
 * 4. Click "Deploy" > "New deployment"
 * 5. Choose type: "Web app"
 * 6. Set "Execute as": Me (your Google account)
 * 7. Set "Who has access": Anyone
 * 8. Click Deploy and authorise when prompted
 * 9. Copy the Web App URL that appears
 * 10. In the website HTML files, replace:
 *     const FORM_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
 *     ...with the URL you just copied
 *
 * WHAT THIS DOES:
 * - Receives all form submissions from acclivgroup.com
 * - Emails info@acclivgroup.com immediately with full details
 * - Sends an auto-reply confirmation to the person who submitted
 * - Logs every submission to a Google Sheet (simple CRM)
 */

// ============================================================
// CONFIGURATION — update these if needed
// ============================================================
var CONFIG = {
  recipientEmail: 'info@acclivgroup.com',
  siteName: 'Accliv Group',
  siteUrl: 'https://acclivgroup.com',
  replyFromName: 'Akshay Chauhan — Accliv Group'
};

// ============================================================
// MAIN HANDLER
// ============================================================
function doPost(e) {
  try {
    var params = e.parameter || {};

    var source    = params.source    || 'contact-form';
    var firstName = params.firstName || '';
    var lastName  = params.lastName  || '';
    var email     = params.email     || '';
    var phone     = params.phone     || '';
    var service   = params.service   || '';
    var message   = params.message   || '';
    var resource  = params.resource  || '';

    var fullName = (firstName + ' ' + lastName).trim() || 'Unknown';

    // Log to Google Sheet
    logToSheet({
      timestamp: new Date(),
      source:    source,
      name:      fullName,
      email:     email,
      phone:     phone,
      service:   service || resource,
      message:   message
    });

    // Send notification email to Akshay
    sendNotificationEmail(fullName, email, phone, service, message, source, resource);

    // Send auto-reply to the person who submitted (if email provided)
    if (email && email.indexOf('@') !== -1) {
      sendAutoReply(firstName || fullName, email, source, resource);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Allow GET requests (used to test the script is live)
function doGet(e) {
  return ContentService.createTextOutput('Accliv Group form handler is running.');
}

// ============================================================
// GOOGLE SHEET LOGGING (simple CRM)
// ============================================================
function logToSheet(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Leads');

    if (!sheet) {
      sheet = ss.insertSheet('Leads');
      sheet.appendRow([
        'Timestamp', 'Source', 'Name', 'Email',
        'Phone', 'Service / Resource', 'Message', 'Status'
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      data.timestamp,
      data.source,
      data.name,
      data.email,
      data.phone || '',
      data.service || '',
      data.message || '',
      'New'
    ]);
  } catch (sheetErr) {
    Logger.log('Sheet error: ' + sheetErr.toString());
  }
}

// ============================================================
// NOTIFICATION EMAIL TO AKSHAY
// ============================================================
function sendNotificationEmail(name, email, phone, service, message, source, resource) {
  var sourceLabel = {
    'contact-form':    'Contact Page',
    'listing-notify':  'Listings Page (Notify Me)',
    'resource-buyer':  'Resources Page (Buyer Checklist)',
    'resource-seller': 'Resources Page (Seller Guide)',
    'resource-invest': 'Resources Page (Investment Scorecard)'
  }[source] || source;

  var subject = '[Accliv] New ' + sourceLabel + ' submission';
  if (name) subject += ' from ' + name;

  var html = [
    '<div style="font-family:sans-serif;max-width:640px;color:#0d1f3c;">',
    '<div style="background:#0d1f3c;padding:24px 32px;">',
    '  <h1 style="color:#b8922d;font-size:22px;margin:0;">Accliv Group</h1>',
    '  <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;">New form submission</p>',
    '</div>',
    '<div style="padding:32px;border:1px solid #e8e4dc;">',
    '  <p style="margin:0 0 6px;"><strong>Source:</strong> ' + sourceLabel + '</p>',
    '  <p style="margin:0 0 6px;"><strong>Name:</strong> ' + name + '</p>',
    '  <p style="margin:0 0 6px;"><strong>Email:</strong> <a href="mailto:' + email + '">' + email + '</a></p>',
    '  <p style="margin:0 0 6px;"><strong>Phone:</strong> ' + (phone || 'Not provided') + '</p>',
    (service ? '<p style="margin:0 0 6px;"><strong>Service:</strong> ' + service + '</p>' : ''),
    (resource ? '<p style="margin:0 0 6px;"><strong>Resource requested:</strong> ' + resource + '</p>' : ''),
    (message ? [
      '<hr style="border:none;border-top:1px solid #e8e4dc;margin:20px 0;">',
      '<p style="margin:0 0 8px;font-weight:bold;">Message</p>',
      '<p style="margin:0;line-height:1.7;color:#3c5068;">' + message.replace(/\n/g, '<br>') + '</p>'
    ].join('') : ''),
    '  <hr style="border:none;border-top:1px solid #e8e4dc;margin:24px 0;">',
    '  <a href="mailto:' + email + '?subject=Re: Your Accliv Group enquiry" ',
    '     style="display:inline-block;background:#b8922d;color:#0d1f3c;padding:12px 24px;',
    '            text-decoration:none;font-weight:bold;border-radius:2px;font-size:13px;">',
    '     Reply to ' + name.split(' ')[0],
    '  </a>',
    '</div>',
    '</div>'
  ].join('');

  var text = [
    'New form submission — ' + sourceLabel,
    '========================================',
    'Name: ' + name,
    'Email: ' + email,
    'Phone: ' + (phone || 'Not provided'),
    'Service: ' + (service || resource || 'N/A'),
    '',
    message ? ('Message:\n' + message) : '',
    '',
    'Reply: mailto:' + email
  ].join('\n');

  MailApp.sendEmail({
    to:       CONFIG.recipientEmail,
    replyTo:  email,
    subject:  subject,
    body:     text,
    htmlBody: html
  });
}

// ============================================================
// AUTO-REPLY TO SUBMITTER
// ============================================================
function sendAutoReply(firstName, email, source, resource) {
  var isResourceRequest = source && source.indexOf('resource') !== -1;
  var isListingNotify   = source === 'listing-notify';

  var subject, body, htmlBody;

  if (isListingNotify) {
    subject = 'You are on the Accliv Group listing alert list';
    body = 'Hi ' + firstName + ',\n\nYou are now on our Ottawa listing notification list. We will reach out the moment a relevant property becomes available.\n\nAkshay Chauhan\nAccliv Group\ninfo@acclivgroup.com';
    htmlBody = buildAutoReplyHtml(firstName, 'You\'re on the list.', 'We will reach out the moment a relevant Ottawa property becomes available that matches what you are looking for.');

  } else if (isResourceRequest) {
    var resourceNames = {
      'resource-buyer':  'Ottawa First-Time Buyer Checklist',
      'resource-seller': 'Ottawa Home Seller Prep Guide',
      'resource-invest': 'Ottawa Investment Property Scorecard'
    };
    var resourceName = resourceNames[source] || 'Ottawa Real Estate Resource';
    subject = 'Your ' + resourceName + ' — Accliv Group';
    body = 'Hi ' + firstName + ',\n\nThank you for requesting the ' + resourceName + '. Akshay will send this directly to you shortly.\n\nAkshay Chauhan\nAccliv Group\ninfo@acclivgroup.com';
    htmlBody = buildAutoReplyHtml(firstName, 'Your resource is on the way.', 'Akshay will send your ' + resourceName + ' directly to this email address within the hour. If you have any questions in the meantime, reply to this email.');

  } else {
    subject = 'Received — Accliv Group will be in touch';
    body = 'Hi ' + firstName + ',\n\nThank you for reaching out to Accliv Group. Akshay will personally respond within 24 hours.\n\nAkshay Chauhan\nAccliv Group\ninfo@acclivgroup.com';
    htmlBody = buildAutoReplyHtml(firstName, 'Message received.', 'Akshay will personally respond within 24 hours. If your matter is urgent, call or text directly at +1 (613) 000-0000.');
  }

  MailApp.sendEmail({
    to:       email,
    name:     CONFIG.replyFromName,
    subject:  subject,
    body:     body,
    htmlBody: htmlBody
  });
}

// ============================================================
// AUTO-REPLY HTML TEMPLATE
// ============================================================
function buildAutoReplyHtml(firstName, heading, body) {
  return [
    '<div style="font-family:sans-serif;max-width:580px;color:#0d1f3c;">',
    '<div style="background:#0d1f3c;padding:28px 32px;">',
    '  <div style="font-family:Georgia,serif;font-size:20px;color:#b8922d;font-weight:500;">Accliv Group</div>',
    '  <div style="color:rgba(255,255,255,0.45);font-size:12px;margin-top:4px;letter-spacing:0.1em;">OTTAWA REAL ESTATE</div>',
    '</div>',
    '<div style="padding:36px 32px;border:1px solid #e8e4dc;border-top:none;">',
    '  <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#0d1f3c;margin:0 0 16px;">',
    '    Hi ' + firstName + '. ' + heading,
    '  </h2>',
    '  <p style="font-size:15px;line-height:1.8;color:#3c5068;margin:0 0 28px;">' + body + '</p>',
    '  <div style="background:#f8f5f0;padding:20px 24px;border-left:3px solid #b8922d;border-radius:3px;">',
    '    <p style="margin:0;font-family:Georgia,serif;font-style:italic;color:#0d1f3c;font-size:15px;">',
    '      "Your foundation for everything next."',
    '    </p>',
    '  </div>',
    '  <p style="margin:28px 0 0;font-size:13px;color:#8799b4;">',
    '    Akshay Chauhan, Salesperson at Royal LePage Performance Realty<br>',
    '    <a href="mailto:info@acclivgroup.com" style="color:#b8922d;">info@acclivgroup.com</a>',
    '  </p>',
    '</div>',
    '</div>'
  ].join('');
}
