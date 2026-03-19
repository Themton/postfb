// ==========================================
// Database Service via Apps Script Web App
// ==========================================

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-tEFbr_QfiiGP7EVtERH8XTbtsKqxsgVOkFUQL34aiS8ZEiAMs07WaMQTfQgLGsuTXw/exec';

class SheetDB {

  async _get(params) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${SCRIPT_URL}?${qs}`);
    const data = await res.json();
    if (data.status === 'error') throw new Error(data.message);
    return data;
  }

  async _post(body) {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.status === 'error') throw new Error(data.message);
    return data;
  }

  // ---- READ ----

  async getGroups() {
    try {
      const res = await this._get({ action: 'read', sheet: 'groups' });
      const rows = res.data || [];
      if (rows.length <= 1) return [];
      return rows.slice(1).filter(r => r[0]).map(row => ({
        id: row[0] || '', name: row[1] || '', pageId: row[2] || '',
        pageName: row[3] || '', pageToken: row[4] || '',
        color: row[5] || '#1877F2', createdAt: row[6] || ''
      }));
    } catch (e) { console.error('getGroups:', e); return []; }
  }

  async getCaptions() {
    try {
      const res = await this._get({ action: 'read', sheet: 'captions' });
      const rows = res.data || [];
      if (rows.length <= 1) return [];
      return rows.slice(1).filter(r => r[0]).map(row => ({
        id: row[0] || '', groupId: row[1] || '_default',
        text: row[2] || '', createdAt: row[3] || ''
      }));
    } catch (e) { console.error('getCaptions:', e); return []; }
  }

  async getMedia() {
    try {
      const res = await this._get({ action: 'read', sheet: 'media' });
      const rows = res.data || [];
      if (rows.length <= 1) return [];
      return rows.slice(1).filter(r => r[0]).map(row => ({
        id: row[0] || '', groupId: row[1] || '_default',
        url: row[2] || '', type: row[3] || 'image', createdAt: row[4] || ''
      }));
    } catch (e) { console.error('getMedia:', e); return []; }
  }

  async getActivity() {
    try {
      const res = await this._get({ action: 'read', sheet: 'activity' });
      const rows = res.data || [];
      if (rows.length <= 1) return [];
      return rows.slice(1).filter(r => r[0]).map(row => ({
        timestamp: row[0] || '', action: row[1] || '',
        status: row[2] || '', detail: row[3] || ''
      })).reverse();
    } catch (e) { console.error('getActivity:', e); return []; }
  }

  // ---- WRITE (full overwrite) ----

  async saveGroups(groups) {
    const header = ['id', 'name', 'pageId', 'pageName', 'pageToken', 'color', 'createdAt'];
    const rows = [header, ...groups.map(g => [g.id, g.name, g.pageId, g.pageName, g.pageToken, g.color, g.createdAt])];
    return this._post({ action: 'write', sheet: 'groups', values: rows });
  }

  async saveCaptions(captions) {
    const header = ['id', 'groupId', 'text', 'createdAt'];
    const rows = [header, ...captions.map(c => [c.id, c.groupId, c.text, c.createdAt])];
    return this._post({ action: 'write', sheet: 'captions', values: rows });
  }

  async saveMedia(mediaList) {
    const header = ['id', 'groupId', 'url', 'type', 'createdAt'];
    const rows = [header, ...mediaList.map(m => [m.id, m.groupId, m.url, m.type, m.createdAt])];
    return this._post({ action: 'write', sheet: 'media', values: rows });
  }

  // ---- APPEND ----

  async logActivity(action, status, detail = '') {
    try {
      return this._post({
        action: 'append', sheet: 'activity',
        values: [[new Date().toISOString(), action, status, detail]]
      });
    } catch (e) { console.error('logActivity:', e); }
  }

  // ---- HEALTH CHECK ----

  async ping() {
    try {
      const res = await this._get({ action: 'ping' });
      return res.status === 'ok';
    } catch { return false; }
  }
}

export const sheetsDB = new SheetDB();
export default SheetDB;
