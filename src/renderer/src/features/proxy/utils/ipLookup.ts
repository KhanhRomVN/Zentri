import { ProxyDetails, RDAPResponse } from '../types';

/**
 * Lấy thông tin IP từ RDAP và BrowserLeaks
 * Sử dụng IPC để fetch từ Main process nhằm bypass CORS
 */
export async function lookupIP(ip: string): Promise<ProxyDetails> {
  const details: ProxyDetails = { ip };

  try {
    // 1. Fetch from RDAP
    // @ts-ignore
    const rdapRes = await window.electron.ipcRenderer.invoke(
      'util:fetch',
      `https://rdap.apnic.net/ip/${ip}`,
    );

    if (rdapRes.success && rdapRes.data) {
      const rdapData: RDAPResponse = rdapRes.data;
      console.log(`[IP Lookup] RDAP Raw Data for ${ip}:`, rdapData);
      details.org = rdapData.name;
      details.countryCode = rdapData.country?.toUpperCase();

      // CIDR Range
      if (rdapData.cidr0_cidrs && rdapData.cidr0_cidrs.length > 0) {
        const cidr = rdapData.cidr0_cidrs[0];
        details.networkRange = `${cidr.v4prefix}/${cidr.length}`;
      } else if (rdapData.handle) {
        details.networkRange = rdapData.handle;
      }

      // Registration Date
      if (rdapData.events) {
        const regEvent = rdapData.events.find((e) => e.eventAction === 'registration');
        if (regEvent) {
          details.registeredAt = new Date(regEvent.eventDate).toLocaleDateString();
        }
      }

      // Abuse Contact
      if (rdapData.entities) {
        const abuseEntity = rdapData.entities.find((e) => e.roles.includes('abuse'));
        if (abuseEntity && abuseEntity.vcardArray) {
          const vcard = abuseEntity.vcardArray[1];
          const email = vcard.find((item: any) => item[0] === 'email');
          if (email) details.abuseContact = email[3];
        }
      }

      if (rdapData.remarks && rdapData.remarks.length > 0) {
        const desc = rdapData.remarks.find((r) => r.title === 'description');
        if (desc && desc.description.length > 0) {
          details.isp = desc.description[0];
        }
      }
    }

    // 2. Fetch from BrowserLeaks
    // @ts-ignore
    const blRes = await window.electron.ipcRenderer.invoke(
      'util:fetch',
      `https://browserleaks.com/ip/${ip}`,
    );

    if (blRes.success && blRes.data) {
      console.log(`[IP Lookup] BrowserLeaks fetch success via IPC for ${ip}`);
      const html = blRes.data;

      // Parsing từ HTML của BrowserLeaks
      details.isp = details.isp || extractTag(html, 'ISP');
      details.city = extractTag(html, 'City');
      details.region = extractTag(html, 'State/Region');
      details.usageType = extractTag(html, 'Usage Type');
      details.hostname = extractTag(html, 'Hostname');
      details.timezone = extractTag(html, 'Timezone');
      details.asn = extractTag(html, 'Network', true);
      details.country = extractTag(html, 'Country', false, true);

      if (!details.countryCode) {
        const countryMatch = html.match(/data-iso_code="([^"]+)"/);
        if (countryMatch) {
          details.countryCode = countryMatch[1].toUpperCase();
        }
      }
    } else {
      console.warn(`[IP Lookup] BrowserLeaks fetch failed via IPC for ${ip}:`, blRes.error);
    }

    console.log(`[IP Lookup] Final Result for ${ip}:`, details);
  } catch (error) {
    console.error('[IP Lookup] Error:', error);
  }

  return details;
}

function extractTag(
  html: string,
  label: string,
  isASN = false,
  isCountry = false,
): string | undefined {
  try {
    const regex = new RegExp(`<td>${label}</td>\\s*<td[^>]*>(.*?)</td>`, 'is');
    const match = html.match(regex);
    if (!match) return undefined;

    let content = match[1];

    if (isCountry) {
      const textMatch =
        content.match(/class="flag-text[^>]*>(.*?)<span/i) ||
        content.match(/class="flag-text[^>]*>(.*?)$/i);
      if (textMatch) return textMatch[1].replace(/<[^>]*>?/gm, '').trim();
    }

    let value = content.replace(/<[^>]*>?/gm, '').trim();

    if (isASN) {
      const asnMatch = value.match(/AS\d+/);
      return asnMatch ? asnMatch[0] : value;
    }

    return value || undefined;
  } catch {
    return undefined;
  }
}
