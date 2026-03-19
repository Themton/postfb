// ==========================================
// FB Bulk Poster Pro — Auto Setup Google Sheets
// ==========================================
// วิธีใช้:
// 1. เปิด Google Sheets ใหม่
// 2. ไปที่ Extensions > Apps Script
// 3. วางโค้ดนี้ทั้งหมด
// 4. กด Run > เลือก "setupAll"
// 5. อนุญาต Permission
// 6. รอจนเสร็จ — จะสร้าง 5 sheets + เมนูอัตโนมัติ
// ==========================================

// ==================== MENU ====================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 FB Poster Pro')
    .addItem('📦 สร้าง Sheets ทั้งหมด', 'setupAll')
    .addSeparator()
    .addItem('📊 สร้างเฉพาะ: groups', 'setupGroups')
    .addItem('💬 สร้างเฉพาะ: captions', 'setupCaptions')
    .addItem('🖼 สร้างเฉพาะ: media', 'setupMedia')
    .addItem('📋 สร้างเฉพาะ: activity', 'setupActivity')
    .addItem('⚙️ สร้างเฉพาะ: settings', 'setupSettings')
    .addSeparator()
    .addItem('🎨 จัดรูปแบบใหม่ทั้งหมด', 'reformatAll')
    .addItem('📝 เพิ่มข้อมูลตัวอย่าง', 'addSampleData')
    .addSeparator()
    .addItem('🗑 ล้างข้อมูลทั้งหมด (เก็บ headers)', 'clearAllData')
    .addItem('ℹ️ แสดง Spreadsheet ID', 'showSpreadsheetId')
    .addToUi();
}

// ==================== MAIN SETUP ====================
function setupAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  try {
    // Track progress
    ss.toast('กำลังสร้าง sheets...', '🚀 FB Poster Pro', 30);

    setupGroups();
    setupCaptions();
    setupMedia();
    setupActivity();
    setupSettings();

    // ลบ Sheet1 default ถ้ามี
    deleteDefaultSheet_(ss);

    // สร้าง Dashboard sheet
    setupDashboard_(ss);

    ss.toast('สร้างเสร็จเรียบร้อย! ✅', '🚀 FB Poster Pro', 5);

    // แสดง Spreadsheet ID
    const id = ss.getId();
    ui.alert(
      '✅ สร้างเสร็จเรียบร้อย!',
      'Spreadsheet ID ของคุณ (คัดลอกไปใส่ในเว็บ):\n\n' + id + '\n\n' +
      'URL:\n' + ss.getUrl(),
      ui.ButtonSet.OK
    );

  } catch (e) {
    ui.alert('❌ เกิดข้อผิดพลาด', e.message, ui.ButtonSet.OK);
  }
}

// ==================== SHEET: groups ====================
function setupGroups() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet_(ss, 'groups');

  // Headers
  const headers = ['id', 'name', 'pageId', 'pageName', 'pageToken', 'color', 'createdAt'];
  const descriptions = ['รหัสกลุ่ม (auto)', 'ชื่อกลุ่มสินค้า', 'Facebook Page ID', 'ชื่อเพจ (auto)', 'Page Access Token', 'สีกลุ่ม (hex)', 'วันที่สร้าง'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, 1, headers.length).setValues([descriptions]);

  // Format
  formatHeader_(sheet, headers.length, '#1877F2');
  formatDescription_(sheet, headers.length);

  // Column widths
  sheet.setColumnWidth(1, 140);  // id
  sheet.setColumnWidth(2, 180);  // name
  sheet.setColumnWidth(3, 160);  // pageId
  sheet.setColumnWidth(4, 200);  // pageName
  sheet.setColumnWidth(5, 280);  // pageToken
  sheet.setColumnWidth(6, 100);  // color
  sheet.setColumnWidth(7, 180);  // createdAt

  // Data validation: color column
  const colorRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['#1877F2', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#607D8B', '#00BCD4', '#FF5722'])
    .setAllowInvalid(true)
    .build();
  sheet.getRange('F3:F1000').setDataValidation(colorRule);

  // Protect token column (warning)
  sheet.getRange('E1').setNote('⚠️ คอลัมน์นี้เก็บ Token สำคัญ อย่าแชร์ให้คนอื่น!');

  // Freeze header
  sheet.setFrozenRows(1);

  // Delete description row (keep only headers for API compatibility)
  // Actually keep row 2 as guide, API reads from row 2 onwards
  // Clear row 2 after setup note
  sheet.getRange(2, 1, 1, headers.length).setFontColor('#999999').setFontSize(9).setFontStyle('italic');

  ss.toast('✅ groups sheet สร้างเสร็จ', 'Setup', 3);
}

// ==================== SHEET: captions ====================
function setupCaptions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet_(ss, 'captions');

  const headers = ['id', 'groupId', 'text', 'createdAt'];
  const descriptions = ['รหัสแคปชั่น (auto)', 'รหัสกลุ่ม / _default', 'ข้อความแคปชั่น', 'วันที่สร้าง'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, 1, headers.length).setValues([descriptions]);

  formatHeader_(sheet, headers.length, '#10B981');
  formatDescription_(sheet, headers.length);

  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(3, 500);
  sheet.setColumnWidth(4, 180);

  // Wrap text for caption column
  sheet.getRange('C:C').setWrap(true);

  sheet.setFrozenRows(1);
  ss.toast('✅ captions sheet สร้างเสร็จ', 'Setup', 3);
}

// ==================== SHEET: media ====================
function setupMedia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet_(ss, 'media');

  const headers = ['id', 'groupId', 'url', 'type', 'createdAt'];
  const descriptions = ['รหัสสื่อ (auto)', 'รหัสกลุ่ม / _default', 'URL รูป/วิดีโอ', 'image / video', 'วันที่สร้าง'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, 1, headers.length).setValues([descriptions]);

  formatHeader_(sheet, headers.length, '#8B5CF6');
  formatDescription_(sheet, headers.length);

  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(3, 500);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 180);

  // Data validation: type
  const typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['image', 'video'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange('D3:D1000').setDataValidation(typeRule);

  sheet.setFrozenRows(1);
  ss.toast('✅ media sheet สร้างเสร็จ', 'Setup', 3);
}

// ==================== SHEET: activity ====================
function setupActivity() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet_(ss, 'activity');

  const headers = ['timestamp', 'action', 'status', 'detail'];
  const descriptions = ['เวลา (ISO)', 'ประเภท', 'สถานะ', 'รายละเอียด'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, 1, headers.length).setValues([descriptions]);

  formatHeader_(sheet, headers.length, '#F59E0B');
  formatDescription_(sheet, headers.length);

  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 400);

  sheet.setFrozenRows(1);
  ss.toast('✅ activity sheet สร้างเสร็จ', 'Setup', 3);
}

// ==================== SHEET: settings ====================
function setupSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet_(ss, 'settings');

  const headers = ['key', 'value'];
  const descriptions = ['ชื่อตั้งค่า', 'ค่า'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, 1, headers.length).setValues([descriptions]);

  formatHeader_(sheet, headers.length, '#607D8B');
  formatDescription_(sheet, headers.length);

  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 400);

  // Default settings
  const defaults = [
    ['defaultDelay', '30'],
    ['maxPosts', '50'],
    ['version', '2.1'],
    ['setupDate', new Date().toISOString()],
  ];
  sheet.getRange(3, 1, defaults.length, 2).setValues(defaults);
  sheet.getRange(3, 1, defaults.length, 2).setFontSize(10);

  sheet.setFrozenRows(1);
  ss.toast('✅ settings sheet สร้างเสร็จ', 'Setup', 3);
}

// ==================== DASHBOARD SHEET ====================
function setupDashboard_(ss) {
  const sheet = getOrCreateSheet_(ss, '📊 Dashboard');

  sheet.clear();
  sheet.setColumnWidth(1, 30);
  sheet.setColumnWidth(2, 300);
  sheet.setColumnWidth(3, 300);

  // Title
  sheet.getRange('B2').setValue('🚀 FB Bulk Poster Pro').setFontSize(24).setFontWeight('bold').setFontColor('#1877F2');
  sheet.getRange('B3').setValue('Auto-Setup by Apps Script • v2.1').setFontSize(11).setFontColor('#8B95A8');

  // Info
  const info = [
    ['', ''],
    ['📋 Spreadsheet ID:', ss.getId()],
    ['🔗 URL:', ss.getUrl()],
    ['📅 สร้างเมื่อ:', new Date().toLocaleString('th-TH')],
    ['', ''],
    ['📊 Sheets ที่สร้าง:', ''],
    ['   • groups', 'เก็บข้อมูลกลุ่มสินค้า + Page Token'],
    ['   • captions', 'เก็บแคปชั่นทั้งหมด (แยกตามกลุ่ม)'],
    ['   • media', 'เก็บ URL รูปภาพ/วิดีโอ'],
    ['   • activity', 'ประวัติการโพสต์'],
    ['   • settings', 'ตั้งค่าระบบ'],
    ['', ''],
    ['⚙️ วิธีใช้งาน:', ''],
    ['   1.', 'คัดลอก Spreadsheet ID ด้านบน'],
    ['   2.', 'ไปที่เว็บ FB Poster Pro > ตั้งค่า'],
    ['   3.', 'วาง Spreadsheet ID + Google OAuth Token'],
    ['   4.', 'กด "บันทึกตั้งค่า"'],
    ['', ''],
    ['⚠️ ข้อควรระวัง:', ''],
    ['   •', 'อย่าเปลี่ยนชื่อ Sheet (groups, captions, media, activity, settings)'],
    ['   •', 'อย่าแก้ไข Row 1 (headers) — ระบบอ่านจาก headers'],
    ['   •', 'Sheet "groups" มี Page Token — อย่าแชร์ให้คนอื่น!'],
    ['   •', 'Row 2 เป็นคำอธิบาย — ระบบจะข้ามไม่อ่าน'],
  ];

  sheet.getRange(4, 2, info.length, 2).setValues(info);
  sheet.getRange(4, 2, info.length, 2).setFontSize(11).setVerticalAlignment('middle');
  sheet.setRowHeights(4, info.length, 26);

  // Highlight ID
  sheet.getRange('C5').setFontWeight('bold').setFontColor('#1877F2').setFontFamily('JetBrains Mono, monospace').setFontSize(10);
  sheet.getRange('C6').setFontColor('#1877F2').setFontSize(9);

  // Color section headers
  ['B10', 'B17', 'B23'].forEach(cell => {
    sheet.getRange(cell).setFontWeight('bold').setFontSize(12);
  });

  // Move dashboard to first position
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);

  // Background
  sheet.getRange('A1:Z100').setBackground('#0A0E17');
  sheet.getRange('A1:Z100').setFontColor('#F0F2F5');
  sheet.getRange('B5:B5').setFontColor('#8B95A8');
}

// ==================== SAMPLE DATA ====================
function addSampleData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const confirm = ui.alert(
    '📝 เพิ่มข้อมูลตัวอย่าง',
    'จะเพิ่มข้อมูลตัวอย่างลงใน groups, captions, media\n\n⚠️ ข้อมูลเดิมจะไม่ถูกลบ (เพิ่มต่อท้าย)\n\nดำเนินการ?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  const now = new Date().toISOString();

  // Sample groups
  const groups = ss.getSheetByName('groups');
  if (groups) {
    const gData = [
      ['grp_demo1', 'เสื้อผ้าแฟชั่น', '100234567890', 'แฟชั่นสตรีท BKK', 'YOUR_PAGE_TOKEN_HERE', '#1877F2', now],
      ['grp_demo2', 'รองเท้า Sneakers', '100987654321', 'Sneaker Hub TH', 'YOUR_PAGE_TOKEN_HERE', '#E74C3C', now],
      ['grp_demo3', 'เครื่องสำอาง', '100567890123', 'Beauty Lab TH', 'YOUR_PAGE_TOKEN_HERE', '#2ECC71', now],
    ];
    const lastRow = Math.max(groups.getLastRow(), 2);
    groups.getRange(lastRow + 1, 1, gData.length, gData[0].length).setValues(gData);
  }

  // Sample captions
  const captions = ss.getSheetByName('captions');
  if (captions) {
    const cData = [
      ['cap_demo1', 'grp_demo1', 'สินค้าใหม่เข้าแล้ว 🔥 แฟชั่นล่าสุด ส่งฟรีทั่วไทย!', now],
      ['cap_demo2', 'grp_demo1', 'FLASH SALE ⚡ ลดสูงสุด 70% เฉพาะวันนี้เท่านั้น!', now],
      ['cap_demo3', 'grp_demo1', 'ลุคนี้ต้องมี! เสื้อผ้าเกรดพรีเมียม ราคาเบาๆ 💎', now],
      ['cap_demo4', '_default', 'สอบถามเพิ่มเติม inbox เลยค่า 💬', now],
      ['cap_demo5', '_default', 'ส่งไว ได้ของภายใน 1-3 วัน 📦 เก็บเงินปลายทางได้', now],
      ['cap_demo6', 'grp_demo2', 'Sneaker แท้ 100% ✅ รับประกันทุกคู่', now],
      ['cap_demo7', 'grp_demo3', 'ผิวสวยใส เริ่มต้นที่ตรงนี้ ✨ ครีมขายดีอันดับ 1', now],
      ['cap_demo8', '_default', 'ของแท้ การันตี คืนได้ภายใน 7 วัน 🛡️', now],
    ];
    const lastRow = Math.max(captions.getLastRow(), 2);
    captions.getRange(lastRow + 1, 1, cData.length, cData[0].length).setValues(cData);
  }

  // Sample media
  const media = ss.getSheetByName('media');
  if (media) {
    const mData = [
      ['med_demo1', 'grp_demo1', 'https://picsum.photos/800/800?random=1', 'image', now],
      ['med_demo2', 'grp_demo1', 'https://picsum.photos/800/800?random=2', 'image', now],
      ['med_demo3', 'grp_demo2', 'https://picsum.photos/800/800?random=3', 'image', now],
      ['med_demo4', 'grp_demo3', 'https://picsum.photos/800/800?random=4', 'image', now],
      ['med_demo5', '_default', 'https://picsum.photos/800/800?random=5', 'image', now],
    ];
    const lastRow = Math.max(media.getLastRow(), 2);
    media.getRange(lastRow + 1, 1, mData.length, mData[0].length).setValues(mData);
  }

  // Log activity
  const activity = ss.getSheetByName('activity');
  if (activity) {
    const lastRow = Math.max(activity.getLastRow(), 2);
    activity.getRange(lastRow + 1, 1, 1, 4).setValues([[now, 'setup', 'ok', 'เพิ่มข้อมูลตัวอย่าง']]);
  }

  ss.toast('เพิ่มข้อมูลตัวอย่างเสร็จ ✅', '📝 Sample Data', 5);
  ui.alert('✅ เสร็จ!', 'เพิ่มข้อมูลตัวอย่าง:\n• 3 กลุ่มสินค้า\n• 8 แคปชั่น\n• 5 URL สื่อ\n\n⚠️ อย่าลืมเปลี่ยน YOUR_PAGE_TOKEN_HERE เป็น Token จริงในแท็บ groups', ui.ButtonSet.OK);
}

// ==================== CLEAR DATA ====================
function clearAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const confirm = ui.alert(
    '🗑 ล้างข้อมูลทั้งหมด',
    '⚠️ จะลบข้อมูลทั้งหมดในทุก sheets!\n(เก็บ headers row 1-2 ไว้)\n\nดำเนินการ?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  ['groups', 'captions', 'media', 'activity', 'settings'].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 2) {
      sheet.getRange(3, 1, sheet.getLastRow() - 2, sheet.getLastColumn()).clearContent();
    }
  });

  // Re-add default settings
  const settings = ss.getSheetByName('settings');
  if (settings) {
    const defaults = [
      ['defaultDelay', '30'],
      ['maxPosts', '50'],
      ['version', '2.1'],
      ['setupDate', new Date().toISOString()],
    ];
    settings.getRange(3, 1, defaults.length, 2).setValues(defaults);
  }

  ss.toast('ล้างข้อมูลเสร็จ ✅', '🗑 Clear', 5);
}

// ==================== REFORMAT ====================
function reformatAll() {
  setupGroups();
  setupCaptions();
  setupMedia();
  setupActivity();
  setupSettings();
  SpreadsheetApp.getActiveSpreadsheet().toast('จัดรูปแบบใหม่เสร็จ ✅', '🎨 Reformat', 5);
}

// ==================== SHOW ID ====================
function showSpreadsheetId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'ℹ️ Spreadsheet ID',
    'ID: ' + ss.getId() + '\n\nURL: ' + ss.getUrl() + '\n\nคัดลอก ID ไปวางในเว็บ FB Poster Pro > ตั้งค่า > Spreadsheet ID',
    ui.ButtonSet.OK
  );
}

// ==================== HELPERS ====================

function getOrCreateSheet_(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  } else {
    sheet.clear();
    sheet.clearFormats();
    sheet.clearNotes();
  }
  return sheet;
}

function formatHeader_(sheet, colCount, color) {
  const range = sheet.getRange(1, 1, 1, colCount);
  range.setBackground(color);
  range.setFontColor('#FFFFFF');
  range.setFontWeight('bold');
  range.setFontSize(11);
  range.setFontFamily('JetBrains Mono, Consolas, monospace');
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);

  // Border
  range.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
}

function formatDescription_(sheet, colCount) {
  const range = sheet.getRange(2, 1, 1, colCount);
  range.setBackground('#F5F5F5');
  range.setFontColor('#999999');
  range.setFontSize(9);
  range.setFontStyle('italic');
  range.setHorizontalAlignment('center');
  sheet.setRowHeight(2, 24);
}

function deleteDefaultSheet_(ss) {
  const sheets = ss.getSheets();
  if (sheets.length > 5) {
    const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('แผ่นงาน1');
    if (defaultSheet) {
      try { ss.deleteSheet(defaultSheet); } catch (e) { /* ignore */ }
    }
  }
}

// ==================== WEB APP API (optional) ====================
// ถ้าต้องการให้เว็บเรียกผ่าน Web App แทน Sheets API

function doGet(e) {
  const action = e.parameter.action;
  const sheet = e.parameter.sheet;

  if (action === 'read' && sheet) {
    return readSheet_(sheet);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'FB Poster Pro Sheets API',
    spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheet = data.sheet;

    if (action === 'append' && sheet && data.values) {
      return appendSheet_(sheet, data.values);
    }
    if (action === 'write' && sheet && data.values) {
      return writeSheet_(sheet, data.values);
    }
    if (action === 'clear' && sheet) {
      return clearSheet_(sheet);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function readSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' })).setMimeType(ContentService.MimeType.JSON);

  const data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', data })).setMimeType(ContentService.MimeType.JSON);
}

function appendSheet_(name, values) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' })).setMimeType(ContentService.MimeType.JSON);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, values.length, values[0].length).setValues(values);

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', rowsAdded: values.length })).setMimeType(ContentService.MimeType.JSON);
}

function writeSheet_(name, values) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' })).setMimeType(ContentService.MimeType.JSON);

  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', rowsWritten: values.length })).setMimeType(ContentService.MimeType.JSON);
}

function clearSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' })).setMimeType(ContentService.MimeType.JSON);

  if (sheet.getLastRow() > 2) {
    sheet.getRange(3, 1, sheet.getLastRow() - 2, sheet.getLastColumn()).clearContent();
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Cleared' })).setMimeType(ContentService.MimeType.JSON);
}
