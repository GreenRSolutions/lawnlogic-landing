export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const data = req.body;
    const name = data.Name || data.name || 'Unknown';
    const phone = data.Phone || data.phone || 'Not provided';
    const email = data.Email || data.email || 'Not provided';
    const projectType = data['Project Type'] || data.projectType || 'General';
    const address = data.Address || data.address || 'Not provided';
    const message = data.Message || data.message || '';
    const source = data.Source || data.source || 'Landing Page';
    const utmSource = data['UTM Source'] || data.utm_source || '';
    const utmCampaign = data['UTM Campaign'] || data.utm_campaign || '';
    const gclid = data['Google Click ID'] || data.gclid || '';
    const sqft = data['Square Footage'] || data.sqft || '';
    const timestamp = data.Timestamp || data.timestamp || new Date().toISOString();
    const formType = data['Form Type'] || data.form_type || 'quote';

    const subject = `New Lead - ${projectType} - ${name}`;

    const textBody = [
      `NEW LEAD FROM ${source.toUpperCase()}`,
      ``,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Project Type: ${projectType}`,
      address !== 'Not provided' ? `Address: ${address}` : null,
      sqft ? `Square Footage: ${sqft}` : null,
      message ? `Message: ${message}` : null,
      ``,
      `--- Tracking ---`,
      utmSource ? `UTM Source: ${utmSource}` : null,
      utmCampaign ? `UTM Campaign: ${utmCampaign}` : null,
      gclid ? `Google Click ID: ${gclid}` : null,
      `Form Type: ${formType}`,
      `Submitted: ${timestamp}`,
    ].filter(Boolean).join('\n');

    const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #16a34a; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0; font-size: 20px;">New Lead - ${projectType}</h2>
  </div>
  <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; font-weight: bold; color: #374151; width: 140px;">Name</td><td style="padding: 8px 0; color: #111827;">${name}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone</td><td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #16a34a; text-decoration: none;">${phone}</a></td></tr>
      <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #16a34a; text-decoration: none;">${email}</a></td></tr>
      <tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Project Type</td><td style="padding: 8px 0; color: #111827;">${projectType}</td></tr>
      ${address !== 'Not provided' ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Address</td><td style="padding: 8px 0; color: #111827;">${address}</td></tr>` : ''}
      ${sqft ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Square Footage</td><td style="padding: 8px 0; color: #111827;">${sqft}</td></tr>` : ''}
      ${message ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #374151;">Message</td><td style="padding: 8px 0; color: #111827;">${message}</td></tr>` : ''}
    </table>
    ${utmSource || utmCampaign || gclid ? `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
    <p style="font-size: 12px; color: #6b7280; margin: 0;">
      ${utmSource ? `UTM Source: ${utmSource} | ` : ''}${utmCampaign ? `Campaign: ${utmCampaign} | ` : ''}${gclid ? `GCLID: ${gclid} | ` : ''}Form: ${formType} | ${timestamp}
    </p>` : ''}
  </div>
</div>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LawnLogic Leads <noreply@mail.lawnlogicturf.com>',
        to: ['dusty@lawnlogicturf.com'],
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    const result = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend error:', result);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, id: result.id });
  } catch (err) {
    console.error('Lead API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
