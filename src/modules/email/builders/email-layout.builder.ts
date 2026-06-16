/* eslint-disable @cspell/spellchecker */
export interface BuildEmailLayoutOptions {
  title: string;
  content: string;
}

export function buildEmailLayout({ title, content }: BuildEmailLayoutOptions): string {
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 16px;">
          <tr>
            <td style="padding-bottom: 8px; font-size: 20px; font-weight: 600; color: #111827;">
              ${title}
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; padding: 24px; border-radius: 8px; font-size: 15px; line-height: 1.6; color: #374151;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding-top: 16px; font-size: 13px; color: #9ca3af; text-align: center;">
              Regards,<br />Team
            </td>
          </tr>
        </table>
      </body>
    </html>
  `.trim();
}
