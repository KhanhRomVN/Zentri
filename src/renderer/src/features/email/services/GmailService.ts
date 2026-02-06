import { Mail } from '../mock/mails';

export interface GmailFeedEntry {
  id: string;
  title: string;
  summary: string;
  author: {
    name: string;
    email: string;
  };
  modified: string;
  issued: string;
}

class GmailService {
  private readonly FEED_URL = 'https://mail.google.com/mail/u/0/feed/atom';

  /**
   * Fetch inbox from Gmail Atom Feed using session cookies.
   * @param cookies String formatted cookies for the request.
   */
  async fetchInbox(cookies: string): Promise<Mail[]> {
    try {
      const response = await fetch(this.FEED_URL, {
        method: 'GET',
        headers: {
          Cookie: cookies,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Cookies might be expired or invalid.');
        }
        throw new Error(`Failed to fetch Gmail feed: ${response.statusText}`);
      }

      const xmlText = await response.text();
      return this.parseAtomFeed(xmlText);
    } catch (error) {
      console.error('[GmailService] Error fetching inbox:', error);
      throw error;
    }
  }

  private parseAtomFeed(xmlText: string): Mail[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const entries = xmlDoc.getElementsByTagName('entry');
    const mails: Mail[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const id = entry.getElementsByTagName('id')[0]?.textContent || '';
      const title = entry.getElementsByTagName('title')[0]?.textContent || '(No Subject)';
      const summary = entry.getElementsByTagName('summary')[0]?.textContent || '';
      const authorName =
        entry.getElementsByTagName('author')[0]?.getElementsByTagName('name')[0]?.textContent ||
        'Unknown';
      const authorEmail =
        entry.getElementsByTagName('author')[0]?.getElementsByTagName('email')[0]?.textContent ||
        '';
      const modified = entry.getElementsByTagName('modified')[0]?.textContent || '';

      mails.push({
        id,
        from: `${authorName} <${authorEmail}>`,
        subject: title,
        snippet: summary,
        body: summary, // Atom Feed snippet is the same as body usually
        date: this.formatDate(modified),
        read: false, // Feeds usually show unread/recent, we'll mark as unread by default
      });
    }

    return mails;
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();

      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}

export const gmailService = new GmailService();
