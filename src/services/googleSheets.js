// ==========================================
// Google Sheets Database Service
// ==========================================
// Sheet structure:
//   Sheet "groups":   [id, name, pageId, pageName, pageToken, color, createdAt]
//   Sheet "captions": [id, groupId, text, createdAt]
//   Sheet "media":    [id, groupId, url, type, createdAt]
//   Sheet "activity": [timestamp, action, status, detail]
//   Sheet "settings": [key, value]

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

class GoogleSheetsDB {
  constructor() {
    this.apiKey = '';
    this.spreadsheetId = '';
    this.accessToken = ''; // OAuth token for write access
  }

  configure({ apiKey, spreadsheetId, accessToken }) {
    if (apiKey) this.apiKey = apiKey;
    if (spreadsheetId) this.spreadsheetId = spreadsheetId;
    if (accessToken) this.accessToken = accessToken;
  }

  isConfigured() {
    return !!(this.spreadsheetId && (this.apiKey || this.accessToken));
  }

  // ---- GENERIC READ/WRITE ----

  async readSheet(sheetName, range = '') {
    if (!this.isConfigured()) throw new Error('Google Sheets not configured');
    
    const fullRange = range ? `${sheetName}!${range}` : sheetName;
    const authParam = this.accessToken 
      ? '' 
      : `key=${this.apiKey}`;
    
    const headers = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const url = `${SHEETS_API}/${this.spreadsheetId}/values/${encodeURIComponent(fullRange)}?${authParam}&valueRenderOption=UNFORMATTED_VALUE`;
    
    const res = await fetch(url, { headers });
    const data = await res.json();
    
    if (data.error) throw new Error(data.error.message);
    return data.values || [];
  }

  async writeSheet(sheetName, values, range = '') {
    if (!this.accessToken) throw new Error('Write access requires OAuth token');

    const fullRange = range ? `${sheetName}!${range}` : sheetName;
    const url = `${SHEETS_API}/${this.spreadsheetId}/values/${encodeURIComponent(fullRange)}?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  }

  async appendSheet(sheetName, values) {
    if (!this.accessToken) throw new Error('Write access requires OAuth token');

    const url = `${SHEETS_API}/${this.spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  }

  async clearSheet(sheetName) {
    if (!this.accessToken) throw new Error('Write access requires OAuth token');

    const url = `${SHEETS_API}/${this.spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
  }

  // ---- GROUPS ----

  async getGroups() {
    try {
      const rows = await this.readSheet('groups');
      if (rows.length <= 1) return []; // only header or empty
      return rows.slice(1).map(row => ({
        id: row[0] || '',
        name: row[1] || '',
        pageId: row[2] || '',
        pageName: row[3] || '',
        pageToken: row[4] || '',
        color: row[5] || '#1877F2',
        createdAt: row[6] || ''
      }));
    } catch (e) {
      console.error('getGroups error:', e);
      return [];
    }
  }

  async saveGroups(groups) {
    const header = [['id', 'name', 'pageId', 'pageName', 'pageToken', 'color', 'createdAt']];
    const rows = groups.map(g => [g.id, g.name, g.pageId, g.pageName, g.pageToken, g.color, g.createdAt]);
    await this.writeSheet('groups', [...header, ...rows], 'A1');
  }

  async addGroup(group) {
    await this.appendSheet('groups', [
      [group.id, group.name, group.pageId, group.pageName, group.pageToken, group.color, group.createdAt]
    ]);
  }

  // ---- CAPTIONS ----

  async getCaptions() {
    try {
      const rows = await this.readSheet('captions');
      if (rows.length <= 1) return [];
      return rows.slice(1).map(row => ({
        id: row[0] || '',
        groupId: row[1] || '_default',
        text: row[2] || '',
        createdAt: row[3] || ''
      }));
    } catch (e) {
      console.error('getCaptions error:', e);
      return [];
    }
  }

  async saveCaptions(captions) {
    const header = [['id', 'groupId', 'text', 'createdAt']];
    const rows = captions.map(c => [c.id, c.groupId, c.text, c.createdAt]);
    await this.writeSheet('captions', [...header, ...rows], 'A1');
  }

  async addCaptions(captionList) {
    const rows = captionList.map(c => [c.id, c.groupId, c.text, c.createdAt]);
    await this.appendSheet('captions', rows);
  }

  // ---- MEDIA ----

  async getMedia() {
    try {
      const rows = await this.readSheet('media');
      if (rows.length <= 1) return [];
      return rows.slice(1).map(row => ({
        id: row[0] || '',
        groupId: row[1] || '_default',
        url: row[2] || '',
        type: row[3] || 'image',
        createdAt: row[4] || ''
      }));
    } catch (e) {
      console.error('getMedia error:', e);
      return [];
    }
  }

  async saveMedia(mediaList) {
    const header = [['id', 'groupId', 'url', 'type', 'createdAt']];
    const rows = mediaList.map(m => [m.id, m.groupId, m.url, m.type, m.createdAt]);
    await this.writeSheet('media', [...header, ...rows], 'A1');
  }

  async addMedia(mediaList) {
    const rows = mediaList.map(m => [m.id, m.groupId, m.url, m.type, m.createdAt]);
    await this.appendSheet('media', rows);
  }

  // ---- ACTIVITY LOG ----

  async getActivity() {
    try {
      const rows = await this.readSheet('activity');
      if (rows.length <= 1) return [];
      return rows.slice(1).map(row => ({
        timestamp: row[0] || '',
        action: row[1] || '',
        status: row[2] || '',
        detail: row[3] || ''
      })).reverse(); // newest first
    } catch (e) {
      console.error('getActivity error:', e);
      return [];
    }
  }

  async logActivity(action, status, detail = '') {
    try {
      await this.appendSheet('activity', [
        [new Date().toISOString(), action, status, detail]
      ]);
    } catch (e) {
      console.error('logActivity error:', e);
    }
  }

  // ---- SETTINGS ----

  async getSettings() {
    try {
      const rows = await this.readSheet('settings');
      if (rows.length <= 1) return {};
      const settings = {};
      rows.slice(1).forEach(row => {
        if (row[0]) settings[row[0]] = row[1] || '';
      });
      return settings;
    } catch (e) {
      console.error('getSettings error:', e);
      return {};
    }
  }

  async saveSetting(key, value) {
    try {
      const rows = await this.readSheet('settings');
      const idx = rows.findIndex(r => r[0] === key);
      if (idx >= 0) {
        await this.writeSheet('settings', [[key, value]], `A${idx + 1}:B${idx + 1}`);
      } else {
        await this.appendSheet('settings', [[key, value]]);
      }
    } catch (e) {
      console.error('saveSetting error:', e);
    }
  }

  // ---- INIT SHEETS (create headers) ----

  async initializeSheets() {
    try {
      // Try to read each sheet, if it fails or is empty, write headers
      const sheets = {
        groups: [['id', 'name', 'pageId', 'pageName', 'pageToken', 'color', 'createdAt']],
        captions: [['id', 'groupId', 'text', 'createdAt']],
        media: [['id', 'groupId', 'url', 'type', 'createdAt']],
        activity: [['timestamp', 'action', 'status', 'detail']],
        settings: [['key', 'value']]
      };

      for (const [sheet, header] of Object.entries(sheets)) {
        try {
          const rows = await this.readSheet(sheet);
          if (!rows || rows.length === 0) {
            await this.writeSheet(sheet, header, 'A1');
          }
        } catch (e) {
          // Sheet might not exist — user needs to create it
          console.warn(`Sheet "${sheet}" not accessible:`, e.message);
        }
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const sheetsDB = new GoogleSheetsDB();
export default GoogleSheetsDB;
