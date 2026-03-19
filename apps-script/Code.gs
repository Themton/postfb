// ==========================================
// FB Bulk Poster Pro — Apps Script Backend
// Deploy: Web App → Anyone can access
// ==========================================

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🚀 FB Poster')
    .addItem('📦 สร้าง Sheets ทั้งหมด', 'setupAll')
    .addItem('📝 เพิ่มข้อมูลตัวอย่าง', 'addSampleData')
    .addItem('🗑 ล้างข้อมูล (เก็บ headers)', 'clearAllData')
    .addItem('ℹ️ แสดง Spreadsheet ID', 'showId')
    .addToUi();
}

// ==================== WEB API ====================

function doGet(e) {
  try {
    const action = (e.parameter.action || '').toLowerCase();
    const sheet = e.parameter.sheet;

    if (action === 'ping') {
      return jsonResponse({ status: 'ok', message: 'FB Poster API', ts: new Date().toISOString() });
    }

    if (action === 'read' && sheet) {
      return readSheet(sheet);
    }

    return jsonResponse({ status: 'ok', message: 'FB Poster API ready' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function doPost(e) {
  try {
    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (pe) {
      return jsonResponse({ status: 'error', message: 'Invalid JSON: ' + pe.message });
    }

    var action = (data.action || '').toLowerCase();
    var sheet = data.sheet;
    var values = data.values;

    if (action === 'write' && sheet && values) {
      return writeSheet(sheet, values);
    }
    if (action === 'append' && sheet && values) {
      return appendSheet(sheet, values);
    }
    if (action === 'clear' && sheet) {
      return clearSheet(sheet);
    }
    if (action === 'setup') {
      setupAll();
      return jsonResponse({ status: 'ok', message: 'Sheets created' });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ==================== SHEET OPERATIONS ====================

function readSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    // Auto-create if not exists
    setupAll();
    sheet = ss.getSheetByName(name);
    if (!sheet) return jsonResponse({ status: 'error', message: 'Sheet not found: ' + name });
  }
  var data = sheet.getDataRange().getValues();
  return jsonResponse({ status: 'ok', data: data });
}

function writeSheet(name, values) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    setupAll();
    sheet = ss.getSheetByName(name);
  }
  if (!sheet) return jsonResponse({ status: 'error', message: 'Sheet not found' });

  // Clear old data
  sheet.clear();
  // Write new data
  if (values.length > 0 && values[0].length > 0) {
    sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  }
  return jsonResponse({ status: 'ok', rowsWritten: values.length });
}

function appendSheet(name, values) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    setupAll();
    sheet = ss.getSheetByName(name);
  }
  if (!sheet) return jsonResponse({ status: 'error', message: 'Sheet not found' });

  var lastRow = sheet.getLastRow();
  if (values.length > 0 && values[0].length > 0) {
    sheet.getRange(lastRow + 1, 1, values.length, values[0].length).setValues(values);
  }
  return jsonResponse({ status: 'ok', rowsAdded: values.length });
}

function clearSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) return jsonResponse({ status: 'error', message: 'Sheet not found' });

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  return jsonResponse({ status: 'ok', message: 'Cleared' });
}

// ==================== SETUP ====================

function setupAll() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheets = {
    groups:   ['id', 'name', 'pageId', 'pageName', 'pageToken', 'color', 'createdAt'],
    captions: ['id', 'groupId', 'text', 'createdAt'],
    media:    ['id', 'groupId', 'url', 'type', 'createdAt'],
    activity: ['timestamp', 'action', 'status', 'detail'],
    settings: ['key', 'value']
  };

  for (var name in sheets) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, sheets[name].length).setValues([sheets[name]]);
      sheet.getRange(1, 1, 1, sheets[name].length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }

  // Delete default Sheet1
  try {
    var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('แผ่นงาน1');
    if (def && ss.getSheets().length > 5) ss.deleteSheet(def);
  } catch(e) {}
}

function addSampleData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date().toISOString();

  var captions = ss.getSheetByName('captions');
  if (captions) {
    var data = [
      ['cap1', '_default', 'สินค้าดี ราคาถูก 🔥 จัดส่งฟรี', now],
      ['cap2', '_default', 'FLASH SALE ⚡ ลดสูงสุด 70%', now],
      ['cap3', '_default', 'สอบถามเพิ่มเติม inbox เลย 💬', now],
      ['cap4', '_default', 'ของแท้ 100% ✅ รับประกัน', now],
    ];
    captions.getRange(captions.getLastRow()+1, 1, data.length, 4).setValues(data);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('เพิ่มตัวอย่างเสร็จ ✅');
}

function clearAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ['groups','captions','media','activity'].forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).clearContent();
    }
  });
  ss.toast('ล้างข้อมูลเสร็จ ✅');
}

function showId() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  SpreadsheetApp.getUi().alert('Spreadsheet ID:\n\n' + ss.getId());
}

// ==================== HELPERS ====================

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
