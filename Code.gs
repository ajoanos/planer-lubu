/**
 * ALLEMEDIA Wedding Planner for Google Sheets
 * Jak zacząć:
 * 1. Wklej ten kod w Edytorze Apps Script (Extensions → Apps Script).
 * 2. Zapisz projekt i uruchom funkcję InitializePlanner().
 * 3. Przyznaj wymagane uprawnienia przy pierwszym uruchomieniu.
 *
 * Uprawnienia (scope):
 * - SpreadsheetApp: modyfikacja arkusza, zakresów, wykresów, ochron.
 * - DriveApp: tworzenie folderów, plików PDF, miniaturek zdjęć.
 * - SlidesApp: generowanie prezentacji na potrzeby PDF.
 * - CalendarApp: tworzenie i aktualizacja wydarzeń kalendarza.
 * - FormApp: tworzenie formularza RSVP.
 * - MailApp / GmailApp: wysyłka e-maili (save-the-date, vendorzy).
 *
 * FAQ (najczęstsze pytania):
 * P: Jak zmienić czasy przypomnień dla wydarzeń w kalendarzu?
 * O: Edytuj stałą CALENDAR_DEFAULT_REMINDERS w sekcji konfiguracji.
 * P: Jak dodać nową kategorię budżetu?
 * O: Dodaj nowy wiersz w zakładce "Wedding Budget" i uzupełnij kolumny. 
 *    Formuły dynamiczne (SUMIFS/QUERY) uwzględnią kategorię automatycznie.
 * P: Czy mogę zmienić kolory motywu?
 * O: Tak, w zakładce Setup wpisz własne kody HEX, a następnie uruchom
 *    z menu Wedding Planner → Initialize / Rebuild.
 */

/* global SpreadsheetApp, SlidesApp, CalendarApp, DriveApp, FormApp, GmailApp, Utilities, Session */

/**
 * Podstawowa konfiguracja aplikacji.
 */
const CONFIG = {
  version: '1.0.0',
  locale: 'pl',
  defaultCurrency: 'PLN',
  defaultTimeZone: 'Europe/Warsaw',
  namedRanges: {
    setup: 'Setup',
    guestList: 'Guest_List',
    budgetPlan: 'Budget_Plan',
    rsvpFormLink: 'RSVP_Form_Link',
    themePrimary: 'Theme_Primary_Color',
    themeAccent: 'Theme_Accent_Color',
    calendarId: 'Wedding_Calendar_Id',
    driveFolderId: 'Wedding_Drive_Folder_Id',
    slidesTemplateId: 'Wedding_Slides_Template_Id'
  },
  sheetOrder: [
    'Setup',
    'Dashboard',
    'Save the Date',
    'Wedding Timeline',
    'Wedding Itinerary',
    'Packing List',
    'Vendors Choice',
    'Contact Info',
    'Automated Calendar',
    'Wedding Budget',
    'Guest List',
    'Wedding Party',
    'Venue Options',
    'Food & Drinks',
    'Seating Plan',
    'Photo Gallery',
    'Gifts & Thank You',
    'Honeymoon Budget'
  ]
};

const THEMES = {
  neutral: {
    name: 'Neutral Beige',
    primary: '#C9A27C',
    accent: '#E6D5C3',
    cardBackground: '#F7F1EB'
  },
  terracotta: {
    name: 'Terracotta',
    primary: '#B56551',
    accent: '#E8C4B8',
    cardBackground: '#F4E8E1'
  },
  lavender: {
    name: 'Lavender',
    primary: '#7F6A93',
    accent: '#D8CDEB',
    cardBackground: '#F5F1FB'
  },
  ocean: {
    name: 'Ocean Blue',
    primary: '#3F6A8A',
    accent: '#BCD3E5',
    cardBackground: '#ECF4F9'
  }
};

const LOCALIZATION = {
  pl: {
    menu: 'Wedding Planner',
    initialize: 'Initialize / Rebuild',
    demo: 'Generate Demo Data',
    timeline: 'Push Timeline to Calendar',
    form: 'Create RSVP Form + Link',
    saveTheDate: 'Send Save-the-Date Emails',
    pdf: 'Generate PDFs',
    protect: 'Protect Formulas',
    unprotect: 'Unprotect',
    reset: 'Reset Planner'
  },
  en: {
    menu: 'Wedding Planner',
    initialize: 'Initialize / Rebuild',
    demo: 'Generate Demo Data',
    timeline: 'Push Timeline to Calendar',
    form: 'Create RSVP Form + Link',
    saveTheDate: 'Send Save-the-Date Emails',
    pdf: 'Generate PDFs',
    protect: 'Protect Formulas',
    unprotect: 'Unprotect',
    reset: 'Reset Planner'
  }
};

const CALENDAR_DEFAULT_REMINDERS = [
  { method: CalendarApp.NotificationMethod.POPUP, minutes: 60 },
  { method: CalendarApp.NotificationMethod.EMAIL, minutes: 24 * 60 }
];

const CHECKLIST_ICONS = {
  todo: '⏳',
  done: '✅',
  blocked: '⚠️'
};

/**
 * @typedef {Object} SheetDefinition
 * @property {string} name
 * @property {string[][]} headers
 * @property {function(SpreadsheetApp.Sheet):void} formatter
 * @property {boolean} [freezeHeader]
 * @property {number} [columnWidths]
 */

/**
 * Konfiguracja arkuszy z nagłówkami i przykładowymi danymi.
 */
const SHEETS_CONFIG = {
  'Setup': {
    headers: [
      ['Sekcja', 'Pole', 'Wartość', 'Opis']
    ],
    sampleData: [
      ['Para', 'Imię Panny Młodej', 'Anna Kowalska', 'Podaj pełne imię'],
      ['Para', 'Imię Pana Młodego', 'Jan Nowak', 'Podaj pełne imię'],
      ['Para', 'Data ślubu', '=DATE(2025,6,14)', 'Format daty RRRR-MM-DD'],
      ['Para', 'Godzina ślubu', '15:30', 'Czas rozpoczęcia ceremonii'],
      ['Para', 'Strefa czasowa', CONFIG.defaultTimeZone, 'np. Europe/Warsaw'],
      ['Preferencje', 'Język interfejsu', 'PL', 'PL lub EN'],
      ['Preferencje', 'Waluta', CONFIG.defaultCurrency, 'np. PLN, EUR, USD'],
      ['Preferencje', 'Stawka VAT', '23%', 'Opcjonalnie'],
      ['Preferencje', 'Docelowa liczba gości', '120', 'Używane w KPI'],
      ['Styl', 'Kolor główny (HEX)', THEMES.neutral.primary, 'np. #C9A27C'],
      ['Styl', 'Kolor akcentu (HEX)', THEMES.neutral.accent, ''],
      ['Styl', 'Tło kart KPI (HEX)', THEMES.neutral.cardBackground, ''],
      ['Styl', 'Motyw (neutral/terracotta/lavender/ocean)', 'neutral', ''],
      ['Przełączniki', 'Ślub kościelny?', 'TAK', 'TAK/NIE'],
      ['Przełączniki', 'Dwie lokalizacje?', 'NIE', 'TAK/NIE'],
      ['Przełączniki', 'Sesja golden hour?', 'TAK', 'TAK/NIE'],
      ['Integracje', 'ID kalendarza', '', 'Pozostaw puste aby utworzyć'],
      ['Integracje', 'Folder na PDF (Drive)', '', 'Pozostaw puste aby utworzyć'],
      ['Integracje', 'Link do RSVP Form', '', 'Automatycznie generowane'],
      ['Linki', 'Generuj kalendarz', 'Uruchom z menu: Push Timeline to Calendar', ''],
      ['Linki', 'Generuj PDF', 'Menu: Generate PDFs', ''],
      ['Linki', 'Utwórz RSVP Form', 'Menu: Create RSVP Form + Link', '']
    ]
  },
  'Dashboard': {
    headers: [
      ['KPI', 'Metryka', 'Wartość', 'Cel', 'Status'],
      ['Sekcja', 'Opis', 'Wartość']
    ],
    sampleData: [
      ['KPI', 'Dni do ślubu', '=MAX(0;Setup!C3-TODAY())', '', ''],
      ['KPI', '% potwierdzonych RSVP', '=IFERROR(Guest Metrics!B5,0)', '100%', '=IF(C2>=C3,"✅","⏳")'],
      ['KPI', 'Budżet - plan', '=IFNA(Wedding Budget!C102,0)', '', ''],
      ['KPI', 'Budżet - wykonanie', '=IFNA(Wedding Budget!C103,0)', '', ''],
      ['KPI', 'Budżet - odchyłka', '=IFNA(Wedding Budget!C104,0)', '', ''],
      ['Sekcja', 'Postęp checklisty', '=IFNA(Packing List!E2,0)', '100%', ''],
      ['Sekcja', 'Vendorzy opłaceni', "=COUNTIF('Vendors Choice'!H2:H200,\"Wybrany\")", '', ''],
      ['Sekcja', '% miejsc przypisanych', "=IFNA(1-AVERAGE('Seating Plan'!N2:N200)/Setup!C9,0)", '100%', '']
    ]
  },
  'Save the Date': {
    headers: [[
      'Imię', 'Nazwisko', 'Email', 'Telefon', 'Strona', 'Język', 'Tagi', 'Status wysyłki', 'Data wysyłki', 'Uwagi'
    ]],
    sampleData: [
      ['Anna', 'Kowalska', 'anna@example.com', '+48 600 000 001', 'Panna Młoda', 'PL', 'rodzina', '', '', ''],
      ['John', 'Smith', 'john@example.com', '+44 700 000 002', 'Pan Młody', 'EN', 'zagranica', '', '', '']
    ]
  },
  'Wedding Timeline': {
    headers: [[
      'Etap', 'Start', 'Czas trwania (min)', 'Lokalizacja', 'Osoba odpowiedzialna', 'Kontakt', 'Notatki', 'Bufor (min)', 'Koniec'
    ]],
    sampleData: [
      ['Przygotowania', '=DATE(2025,6,14)+TIME(9,0,0)', '120', 'Hotel', 'Koordynator', '+48 600 111 222', 'Make-up, włosy', '15', '=B2+TIME(0,C2,0)+TIME(0,H2,0)'],
      ['First Look', '=B2+TIME(0,C2,0)+TIME(0,H2,0)', '30', 'Ogród', 'Fotograf', '+48 600 333 444', 'Sesja w ogrodzie', '10', '=B3+TIME(0,C3,0)+TIME(0,H3,0)'],
      ['Ceremonia', '=DATE(2025,6,14)+TIME(15,30,0)', '60', 'Kościół', 'Ksiądz', '', 'Ślub kościelny', '15', '=B4+TIME(0,C4,0)+TIME(0,H4,0)'],
      ['Przyjęcie', '=DATE(2025,6,14)+TIME(17,30,0)', '300', 'Sala weselna', 'Manager sali', '+48 600 555 666', 'Kolacja, zabawa', '30', '=B5+TIME(0,C5,0)+TIME(0,H5,0)']
    ]
  },
  'Wedding Itinerary': {
    headers: [[
      'Rola', 'Etap', 'Start', 'Koniec', 'Opis', 'Lokalizacja', 'Kontakt', 'Uwagi'
    ]],
    sampleData: [
      ['Para', 'Przygotowania', "='Wedding Timeline'!B2", "='Wedding Timeline'!I2", 'Gotowość na 11:00', 'Hotel', '+48 600 111 222', 'Zabierz bukiet'],
      ['Świadkowie', 'Ceremonia', "='Wedding Timeline'!B4", "='Wedding Timeline'!I4", 'Pomoc przy obrączkach', 'Kościół', '+48 600 777 888', ''],
      ['Fotograf', 'First Look', "='Wedding Timeline'!B3", "='Wedding Timeline'!I3", 'Zdjęcia pary', 'Ogród', '', 'Golden hour jeśli zaznaczone']
    ]
  },
  'Packing List': {
    headers: [[
      'Kategoria', 'Pozycja', 'Opis', 'Status', 'Notatki'
    ]],
    sampleData: [
      ['Para', 'Suknia ślubna', 'Odebrać 2 dni przed', '⏳', 'Przymiarka w piątek'],
      ['Para', 'Garnitur', 'Prasowanie', '✅', ''],
      ['Beauty', 'Kosmetyczka', 'Wszystkie kosmetyki', '⏳', '']
    ]
  },
  'Vendors Choice': {
    headers: [[
      'Kategoria', 'Nazwa', 'Osoba kontaktowa', 'Telefon', 'Email', 'Adres', 'Link', 'Status', 'Ocena', 'Zaliczka (PLN)', 'Data zaliczki', 'Płatność 1', 'Płatność 2', 'Kwota całkowita', 'Uwagi'
    ]],
    sampleData: [
      ['Fotograf', 'Light Studio', 'Maria Nowak', '+48 600 999 111', 'maria@lightstudio.pl', 'Warszawa', 'https://lightstudio.pl', 'Shortlist', '4.8', '1000', '2025-02-01', '2025-05-30', '', '5000', ''],
      ['Sala', 'Villa Magnolia', 'Piotr Kowal', '+48 600 123 456', 'kontakt@villa.pl', 'Warszawa', 'https://villa.pl', 'Wybrany', '5.0', '3000', '2025-01-10', '2025-06-10', '2025-07-10', '15000', 'Zawiera catering']
    ]
  },
  'Contact Info': {
    headers: [[
      'Imię', 'Nazwisko', 'Rola', 'Telefon', 'Email', 'Strona', 'Notatki'
    ]],
    sampleData: [
      ['Anna', 'Kowalska', 'Mama Panny Młodej', '+48 600 888 777', 'anna.mama@example.com', 'Panna', ''],
      ['Jan', 'Nowak', 'Ojciec Pana Młodego', '+48 600 777 666', 'jan.ojciec@example.com', 'Pan', '']
    ]
  },
  'Automated Calendar': {
    headers: [[
      'Data', 'Etap', 'Event ID', 'Status', 'Uwagi'
    ]],
    sampleData: [
      ['=TODAY()', 'Przygotowania', '', 'Nie wysłano', ''],
      ['=TODAY()', 'Ceremonia', '', 'Nie wysłano', '']
    ]
  },
  'Wedding Budget': {
    headers: [[
      'Kategoria', 'Podkategoria', 'Plan', 'Wykonanie', 'Różnica', 'Status', 'Vendor', 'Uwagi'
    ], [
      'Metryka', 'Opis', 'Wartość'
    ]],
    sampleData: [
      ['Sala', 'Wynajem', '15000', '5000', '=C2-D2', 'zaliczka', "=VLOOKUP(B2,'Vendors Choice'!B:N,1,false)", ''],
      ['Muzyka', 'DJ', '4000', '2000', '=C3-D3', 'unpaid', '', ''],
      ['Transport', 'Bus', '2000', '0', '=C4-D4', 'unpaid', '', ''],
      ['Metryka', 'Plan (suma)', '=SUM(C2:C100)', ''],
      ['Metryka', 'Wykonanie (suma)', '=SUM(D2:D100)', ''],
      ['Metryka', 'Odchyłka', '=C102-D103', '']
    ]
  },
  'Guest List': {
    headers: [[
      'Imię', 'Nazwisko', 'Strona', 'Grupa', 'Email', 'Telefon', 'Adres', 'RSVP', 'Dieta', 'Dzieci', 'Transport', 'Uwagi'
    ]],
    sampleData: [
      ['Anna', 'Nowak', 'Panna Młoda', 'Rodzina', 'anna.nowak@example.com', '+48 600 000 003', 'Warszawa', 'Tak', 'Wege', '0', 'Tak', ''],
      ['Piotr', 'Kowalski', 'Pan Młody', 'Przyjaciele', 'piotr@example.com', '+48 600 000 004', 'Kraków', 'Brak', 'Brak', '2', 'Tak', '']
    ]
  },
  'Wedding Party': {
    headers: [[
      'Rola', 'Imię', 'Nazwisko', 'Telefon', 'Email', 'Obowiązki', 'Notatki'
    ]],
    sampleData: [
      ['Świadkowa', 'Maria', 'Nowak', '+48 600 222 333', 'maria@example.com', 'Koordynacja bukietu', ''],
      ['Świadek', 'Tomasz', 'Kowalski', '+48 600 444 555', 'tomasz@example.com', 'Transport gości', '']
    ]
  },
  'Venue Options': {
    headers: [[
      'Nazwa', 'Pojemność', 'Koszt', 'Catering', 'Dojazd', 'Plusy', 'Minusy', 'Ocena', 'Status'
    ]],
    sampleData: [
      ['Villa Magnolia', '120', '15000', 'Tak', '30 min', 'Piękny ogród', 'Wysoka cena', '4.8', 'Zwycięzca'],
      ['Pałac Róży', '150', '18000', 'Tak', '45 min', 'Sala balowa', 'Dalszy dojazd', '4.5', 'Rezerwowy']
    ]
  },
  'Food & Drinks': {
    headers: [[
      'Kategoria', 'Pozycja', 'Wariant', 'Goście (liczba)', 'Uwagi'
    ]],
    sampleData: [
      ['Przystawki', 'Tatar z łososia', 'Standard', '80', ''],
      ['Dania główne', 'Filet z dorsza', 'Wege', '30', ''],
      ['Napoje', 'Prosecco', 'Standard', '120', 'Toast powitalny']
    ]
  },
  'Seating Plan': {
    headers: [[
      'Stolik', 'Typ', 'Pojemność', 'Gość 1', 'Gość 2', 'Gość 3', 'Gość 4', 'Gość 5', 'Gość 6', 'Gość 7', 'Gość 8', 'Gość 9', 'Gość 10', 'Wolne miejsca'
    ]],
    sampleData: [
      ['Stolik 1', 'Okrągły', '10', 'Anna Nowak', 'Jan Kowalski', '', '', '', '', '', '', '', '', '=C2-COUNTA(D2:M2)'],
      ['Stolik 2', 'Okrągły', '10', 'Maria Nowak', 'Tomasz Kowalski', '', '', '', '', '', '', '', '', '=C3-COUNTA(D3:M3)']
    ]
  },
  'Photo Gallery': {
    headers: [[
      'Numer', 'Ujęcie', 'Osoba odpowiedzialna', 'Status', 'Folder Drive', 'Miniaturka'
    ]],
    sampleData: [
      ['1', 'Preparacje w domu', 'Fotograf', '⏳', '', ''],
      ['2', 'Ceremonia - wejście', 'Fotograf', '⏳', '', '']
    ]
  },
  'Gifts & Thank You': {
    headers: [[
      'Od kogo', 'Kontakt', 'Prezent', 'Wartość', 'Data otrzymania', 'Podziękowanie wysłane?', 'Adres wysyłki', 'Notatki'
    ]],
    sampleData: [
      ['Anna i Piotr', 'anna.piotr@example.com', 'Zestaw porcelany', '500', '2025-06-15', 'Nie', 'Warszawa', '']
    ]
  },
  'Honeymoon Budget': {
    headers: [[
      'Kategoria', 'Plan', 'Wykonanie', 'Różnica', 'Uwagi'
    ], [
      'Dzień', 'Lokalizacja', 'Aktywność', 'Godzina', 'Notatki'
    ], [
      'Checklista', 'Status'
    ]],
    sampleData: [
      ['Transport', '4000', '0', '=B2-C2', 'Loty'],
      ['Hotel', '6000', '0', '=B3-C3', '5 nocy'],
      ['Dzień', '1', 'Przylot', '09:00', ''],
      ['Checklista', 'Paszporty', '✅'],
      ['Checklista', 'Adaptery', '⏳']
    ]
  }
};

/**
 * @return {GoogleAppsScript.Spreadsheet.Sheet} Setup sheet
 */
function getSetupSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName('Setup');
  if (!sheet) {
    sheet = ss.insertSheet('Setup', 0);
  }
  return sheet;
}

/**
 * Tworzy menu po otwarciu arkusza.
 */
function onOpen() {
  const ss = SpreadsheetApp.getActive();
  const language = getInterfaceLanguage_();
  const strings = LOCALIZATION[language] || LOCALIZATION.pl;
  ss.addMenu(strings.menu, [
    { name: strings.initialize, functionName: 'InitializePlanner' },
    { name: strings.demo, functionName: 'GenerateDemoData' },
    { name: strings.timeline, functionName: 'PushTimelineToCalendar' },
    { name: strings.form, functionName: 'CreateRSVPFormAndLink' },
    { name: strings.saveTheDate, functionName: 'SendSaveTheDate' },
    { name: strings.pdf, functionName: 'GeneratePDFs' },
    { name: strings.protect, functionName: 'ProtectPlanner' },
    { name: strings.unprotect, functionName: 'UnprotectPlanner' },
    { name: strings.reset, functionName: 'ResetPlanner' }
  ]);
}

/**
 * @private
 * @return {string} language code (pl/en)
 */
function getInterfaceLanguage_() {
  const setup = getSetupSheet_();
  const data = setup.getRange('A1:C30').getValues();
  const row = data.find(r => r[1] === 'Język interfejsu');
  const lang = row && row[2] ? String(row[2]).toLowerCase() : CONFIG.locale;
  return lang === 'en' ? 'en' : 'pl';
}

/**
 * @private
 * @return {{primary:string, accent:string, cardBackground:string}}
 */
function getThemeFromSetup_() {
  const setup = getSetupSheet_();
  const themeKey = setup.createTextFinder('Motyw (neutral/terracotta/lavender/ocean)').matchCase(false).matchEntireCell(true).findNext();
  if (themeKey) {
    const value = themeKey.offset(0, 1).getValue();
    const theme = THEMES[String(value || '').toLowerCase()] || THEMES.neutral;
    return theme;
  }
  return THEMES.neutral;
}

/**
 * Inicjalizuje cały planer: tworzy zakładki, formatuje, dodaje nazwy zakresów oraz formuły.
 */
function InitializePlanner() {
  const ss = SpreadsheetApp.getActive();
  ss.getSheets().forEach(sheet => {
    if (!CONFIG.sheetOrder.includes(sheet.getName())) {
      ss.deleteSheet(sheet);
    }
  });
  CONFIG.sheetOrder.forEach((name, index) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name, index);
    } else {
      ss.setActiveSheet(sheet);
      sheet.clear({ contentsOnly: false, formatOnly: false });
    }
    populateSheet_(sheet, SHEETS_CONFIG[name]);
    applySheetFormatting_(sheet, name);
    if (CONFIG.sheetOrder[index] !== sheet.getName()) {
      sheet.setName(name);
    }
  });
  ss.setActiveSheet(getSetupSheet_());
  createNamedRanges_();
  ApplyTheme();
  createDashboardCharts_();
  protectSystemRanges_();
  LocalizeUI();
  ensureMetricsSheets_();
  updateCurrencyFormats_();
}

/**
 * @private
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {{headers:string[][], sampleData:string[][]}} def
 */
function populateSheet_(sheet, def) {
  sheet.clear();
  if (!def) {
    return;
  }
  const headers = def.headers || [];
  let startRow = 1;
  headers.forEach((header, idx) => {
    const range = sheet.getRange(startRow, 1, 1, header.length);
    range.setValues([header]);
    range.setFontWeight('bold').setBackground('#F1ECE6');
    sheet.setFrozenRows(idx === 0 ? 1 : sheet.getFrozenRows());
    startRow++;
  });
  if (def.sampleData && def.sampleData.length) {
    sheet.getRange(startRow, 1, def.sampleData.length, def.sampleData[0].length).setValues(def.sampleData);
  }
  sheet.autoResizeColumns(1, Math.max(2, headers[0] ? headers[0].length : 5));
}

/**
 * @private
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string} name
 */
function applySheetFormatting_(sheet, name) {
  sheet.setHiddenGridlines(true);
  if (name === 'Dashboard') {
    sheet.setColumnWidths(1, 5, 160);
    sheet.getRange('A1:E10').setWrap(true);
  }
  if (name === 'Wedding Timeline') {
    sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd hh:mm');
    sheet.getRange('I:I').setNumberFormat('yyyy-mm-dd hh:mm');
  }
  if (name === 'Wedding Budget') {
    sheet.getRange('C:D').setNumberFormat('#,##0.00 [$'+CONFIG.defaultCurrency+']');
  }
  if (name === 'Guest List') {
    const range = sheet.getRange('H2:H500');
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(['Tak', 'Nie', 'Brak']).setAllowInvalid(false).build();
    range.setDataValidation(rule);
  }
  sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).createFilter();
}

/**
 * Tworzy nazwane zakresy.
 */
function createNamedRanges_() {
  const ss = SpreadsheetApp.getActive();
  const setup = getSetupSheet_();
  Object.entries(CONFIG.namedRanges).forEach(([key, name]) => {
    const cell = setup.createTextFinder(key.replace(/([A-Z])/g, ' $1')).findNext();
    if (cell) {
      ss.setNamedRange(name, cell.offset(0, 1));
    }
  });
}

/**
 * Zabezpiecza zakresy systemowe z formułami.
 */
function protectSystemRanges_() {
  const ss = SpreadsheetApp.getActive();
  const sheetsToProtect = ['Dashboard', 'Wedding Budget', 'Wedding Timeline'];
  sheetsToProtect.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    const protection = sheet.protect();
    protection.setDescription('System formulas');
    protection.setWarningOnly(true);
  });
}

/**
 * Zastosowanie motywu kolorystycznego na podstawie zakładki Setup.
 */
function ApplyTheme() {
  const ss = SpreadsheetApp.getActive();
  const theme = getThemeFromSetup_();
  CONFIG.sheetOrder.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    header.setBackground(theme.accent).setFontColor('#3B3B3B');
    sheet.getRange('A1:Z1').setFontWeight('bold');
  });
  const dashboard = ss.getSheetByName('Dashboard');
  if (dashboard) {
    const kpiRange = dashboard.getRange('A2:E6');
    kpiRange.setBackground(theme.cardBackground);
  }
}

/**
 * Lokalizacja etykiet i nagłówków.
 */
function LocalizeUI() {
  const lang = getInterfaceLanguage_();
  if (lang === 'pl') {
    return;
  }
  // TODO: Add actual localization logic for EN. Placeholder for future enhancements.
}

/**
 * Tworzy wykresy na Dashboard.
 */
function createDashboardCharts_() {
  const ss = SpreadsheetApp.getActive();
  const dashboard = ss.getSheetByName('Dashboard');
  const budget = ss.getSheetByName('Wedding Budget');
  if (!dashboard || !budget) return;
  dashboard.clearCharts();
  try {
    const chartBuilder = dashboard.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(budget.getRange('A2:D4'))
      .setOption('title', 'Budżet plan vs wykonanie')
      .setOption('pieHole', 0.5)
      .setPosition(10, 1, 0, 0);
    dashboard.insertChart(chartBuilder.build());
  } catch (err) {
    Logger.log('Chart creation failed: ' + err);
  }
}

/**
 * Generuje przykładowe dane.
 */
function GenerateDemoData() {
  const ss = SpreadsheetApp.getActive();
  Object.entries(SHEETS_CONFIG).forEach(([name, def]) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet || !def.sampleData) return;
    const startRow = def.headers.length + 1;
    sheet.getRange(startRow, 1, def.sampleData.length, def.sampleData[0].length).setValues(def.sampleData);
  });
  createDashboardCharts_();
  updateCurrencyFormats_();
}

/**
 * Resetuje dane użytkownika pozostawiając strukturę.
 */
function ResetPlanner() {
  const ss = SpreadsheetApp.getActive();
  Object.entries(SHEETS_CONFIG).forEach(([name, def]) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    const startRow = def.headers.length + 1;
    const lastRow = sheet.getLastRow();
    if (lastRow >= startRow) {
      sheet.getRange(startRow, 1, lastRow - startRow + 1, sheet.getLastColumn()).clearContent();
    }
  });
}

/**
 * @returns {string} Calendar ID
 */
function ensureCalendar_() {
  const setup = getSetupSheet_();
  const finder = setup.createTextFinder('ID kalendarza').matchCase(false).findNext();
  if (!finder) return '';
  let id = finder.offset(0, 1).getValue();
  if (!id) {
    const calendar = CalendarApp.createCalendar('Wedding Planner');
    id = calendar.getId();
    finder.offset(0, 1).setValue(id);
  }
  return id;
}

/**
 * Publikuje wydarzenia z timeline do kalendarza.
 */
function PushTimelineToCalendar() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Wedding Timeline');
  if (!sheet) return;
  const calendarId = ensureCalendar_();
  if (!calendarId) return;
  const calendar = CalendarApp.getCalendarById(calendarId);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
  data.forEach(row => {
    const [stage, start, duration, location, owner, contact, notes, buffer, end] = row;
    if (!stage || !(start instanceof Date)) return;
    const endDate = end instanceof Date ? end : new Date(start.getTime() + Number(duration) * 60000);
    const event = calendar.createEvent(stage, new Date(start), new Date(endDate), {
      location: location || '',
      description: `${notes || ''}
Osoba odpowiedzialna: ${owner || ''}
Kontakt: ${contact || ''}`
    });
    CALENDAR_DEFAULT_REMINDERS.forEach(reminder => event.addPopupReminder(reminder.minutes));
    logCalendarEvent_(stage, event.getId());
  });
}

/**
 * @private
 */
function logCalendarEvent_(stage, eventId) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Automated Calendar');
  if (!sheet) return;
  sheet.appendRow([new Date(), stage, eventId, 'Wysłano', '']);
}

/**
 * Tworzy formularz RSVP i łączy z arkuszem.
 */
function CreateRSVPFormAndLink() {
  const ss = SpreadsheetApp.getActive();
  const form = FormApp.create('RSVP - ALLEMEDIA Wedding Planner');
  form.setDescription('Prosimy o potwierdzenie udziału w przyjęciu.');
  form.addTextItem().setTitle('Imię');
  form.addTextItem().setTitle('Nazwisko');
  form.addMultipleChoiceItem().setTitle('RSVP').setChoiceValues(['Tak', 'Nie']);
  form.addListItem().setTitle('Dieta').setChoiceValues(['Brak', 'Wege', 'Bezglutenowa', 'Inne']);
  form.addTextItem().setTitle('Transport (autobus)').setHelpText('Tak/Nie');
  form.addParagraphTextItem().setTitle('Uwagi');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  const link = form.getPublishedUrl();
  const setup = getSetupSheet_();
  const finder = setup.createTextFinder('Link do RSVP Form').findNext();
  if (finder) {
    finder.offset(0, 1).setValue(link);
  }
}

/**
 * Wysyła e-maile "Save the Date" wraz z plikiem ICS.
 */
function SendSaveTheDate() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Save the Date');
  if (!sheet) return;
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
  const setup = getSetupSheet_();
  const date = setup.createTextFinder('Data ślubu').findNext().offset(0, 1).getValue();
  const time = setup.createTextFinder('Godzina ślubu').findNext().offset(0, 1).getValue();
  const datetime = parseDateTime_(date, time);
  const formLinkFinder = setup.createTextFinder('Link do RSVP Form').findNext();
  const rsvpLink = formLinkFinder ? formLinkFinder.offset(0, 1).getValue() : '';
  const subject = 'Save the Date - Ślub';
  data.forEach(row => {
    const [firstName, lastName, email, phone, side, language] = row;
    if (!email) return;
    const htmlBody = buildSaveTheDateHtml_(firstName, language, datetime, rsvpLink);
    const ics = buildIcsFile_(datetime, `${firstName || ''} ${lastName || ''}`.trim() || 'Wedding');
    GmailApp.sendEmail(email, subject, 'Save the Date', {
      htmlBody,
      attachments: [Utilities.newBlob(ics, 'text/calendar', 'save-the-date.ics')]
    });
  });
}

/**
 * @private
 */
function parseDateTime_(dateValue, timeValue) {
  let baseDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (!(baseDate instanceof Date) || isNaN(baseDate.getTime())) {
    baseDate = new Date();
  }
  if (typeof timeValue === 'string') {
    const [h = '0', m = '0'] = timeValue.split(':');
    baseDate.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
  }
  return baseDate;
}

/**
 * @private
 */
function buildSaveTheDateHtml_(name, language, datetime, link) {
  const dateString = Utilities.formatDate(datetime, Session.getScriptTimeZone(), 'd MMMM yyyy, HH:mm');
  if ((language || '').toLowerCase() === 'en') {
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#444;">` +
      `<h2>Save the Date!</h2><p>Dear ${name || 'Guest'},</p>` +
      `<p>We are delighted to invite you to our wedding on <strong>${dateString}</strong>.</p>` +
      `<p>Please RSVP using this link: <a href="${link}">${link}</a></p>` +
      `<p>With love,<br/>Anna & Jan</p>` +
      `</body></html>`;
  }
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#444;">` +
    `<h2>Zarezerwuj datę!</h2><p>Droga ${name || 'Osobo'},</p>` +
    `<p>Z radością zapraszamy na nasz ślub dnia <strong>${dateString}</strong>.</p>` +
    `<p>Prosimy o potwierdzenie obecności: <a href="${link}">${link}</a></p>` +
    `<p>Z miłością,<br/>Anna i Jan</p>` +
    `</body></html>`;
}

/**
 * @private
 */
function buildIcsFile_(date, title) {
  const end = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  const format = date => Utilities.formatDate(date, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  const content = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ALLEMEDIA Wedding Planner//PL
BEGIN:VEVENT
UID:${Utilities.getUuid()}
DTSTAMP:${format(new Date())}
DTSTART:${format(date)}
DTEND:${format(end)}
SUMMARY:${title}
END:VEVENT
END:VCALENDAR`;
  return content;
}

/**
 * Generuje zestaw PDFów (timeline, seating, karty klienta).
 */
function GeneratePDFs() {
  const folderId = ensureDriveFolder_();
  if (!folderId) return;
  generateTimelinePDF_(folderId);
  generateSeatingPDF_(folderId);
  generateClientCardPDF_(folderId);
}

/**
 * @private
 */
function ensureDriveFolder_() {
  const setup = getSetupSheet_();
  const finder = setup.createTextFinder('Folder na PDF (Drive)').findNext();
  if (!finder) return '';
  let id = finder.offset(0, 1).getValue();
  if (id) return id;
  const folder = DriveApp.createFolder('Wedding Planner PDFs');
  finder.offset(0, 1).setValue(folder.getId());
  return folder.getId();
}

/**
 * @private
 */
function generateTimelinePDF_(folderId) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Wedding Timeline');
  if (!sheet) return;
  const doc = SlidesApp.create('Timeline');
  const slide = doc.getSlides()[0];
  slide.getShapes().forEach(shape => shape.remove());
  const textBox = slide.insertTextBox('Wedding Timeline');
  textBox.setTextAlignment(SlidesApp.TextAlignment.CENTER);
  const data = sheet.getDataRange().getDisplayValues();
  let top = 80;
  data.forEach((row, idx) => {
    const box = slide.insertTextBox(row.join(' | '));
    box.setLeft(40).setTop(top).setWidth(640);
    top += 30;
    if (idx > 20) return;
  });
  const blob = doc.getAs('application/pdf');
  DriveApp.getFolderById(folderId).createFile(blob).setName('Wedding Timeline.pdf');
  DriveApp.getFileById(doc.getId()).setTrashed(true);
}

/**
 * @private
 */
function generateSeatingPDF_(folderId) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Seating Plan');
  if (!sheet) return;
  const doc = SlidesApp.create('Seating Cards');
  const slide = doc.getSlides()[0];
  slide.getShapes().forEach(shape => shape.remove());
  const data = sheet.getDataRange().getDisplayValues();
  let top = 80;
  data.slice(1).forEach(row => {
    const table = slide.insertTable(1, 2);
    table.getCell(0, 0).getText().setText(row[0]);
    table.getCell(0, 1).getText().setText(row.slice(3).filter(Boolean).join(', '));
    table.setLeft(40).setTop(top).setWidth(640);
    top += 100;
  });
  const blob = doc.getAs('application/pdf');
  DriveApp.getFolderById(folderId).createFile(blob).setName('Seating Cards.pdf');
  DriveApp.getFileById(doc.getId()).setTrashed(true);
}

/**
 * @private
 */
function generateClientCardPDF_(folderId) {
  const ss = SpreadsheetApp.getActive();
  const doc = SlidesApp.create('Karta Klienta');
  const slide = doc.getSlides()[0];
  slide.getShapes().forEach(shape => shape.remove());
  slide.insertTextBox('ALLEMEDIA Wedding Planner - Karta Klienta').setLeft(40).setTop(40).setWidth(640);
  const dashboard = ss.getSheetByName('Dashboard');
  if (dashboard) {
    const data = dashboard.getRange('A1:E8').getDisplayValues();
    let top = 120;
    data.forEach(row => {
      const box = slide.insertTextBox(row.join(': '));
      box.setLeft(40).setTop(top).setWidth(640);
      top += 28;
    });
  }
  const blob = doc.getAs('application/pdf');
  DriveApp.getFolderById(folderId).createFile(blob).setName('Karta Klienta.pdf');
  DriveApp.getFileById(doc.getId()).setTrashed(true);
}

/**
 * Zabezpiecza formuły i zakresy systemowe.
 */
function ProtectPlanner() {
  protectSystemRanges_();
}

/**
 * Odblokowuje formuły i zakresy.
 */
function UnprotectPlanner() {
  const ss = SpreadsheetApp.getActive();
  ss.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(p => p.remove());
  ss.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(p => p.remove());
}

/**
 * Aktualizuje format waluty według ustawień.
 */
function updateCurrencyFormats_() {
  const setup = getSetupSheet_();
  const currencyCell = setup.createTextFinder('Waluta').findNext();
  if (!currencyCell) return;
  const currency = currencyCell.offset(0, 1).getValue() || CONFIG.defaultCurrency;
  const ss = SpreadsheetApp.getActive();
  ['Wedding Budget', 'Vendors Choice', 'Gifts & Thank You', 'Honeymoon Budget'].forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    sheet.getRange(2, 3, Math.max(1, sheet.getLastRow() - 1), 2).setNumberFormat(`# ##0.00 [$${currency}]`);
  });
}

/**
 * Oblicza metryki w osobnych arkuszach pomocniczych.
 */
function ensureMetricsSheets_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName('Guest Metrics');
  if (!sheet) {
    sheet = ss.insertSheet('Guest Metrics');
  }
  sheet.getRange('A1:B6').setValues([
    ['Metryka', 'Wartość'],
    ['RSVP Tak', "=COUNTIF('Guest List'!H2:H500,\"Tak\")"],
    ['RSVP Nie', "=COUNTIF('Guest List'!H2:H500,\"Nie\")"],
    ['RSVP Brak', "=COUNTIF('Guest List'!H2:H500,\"Brak\")"],
    ['% potwierdzonych', '=IFERROR(B2/(B2+B3+B4),0)'],
    ['Liczba gości', "=COUNTA('Guest List'!A2:A500)"]
  ]);
}

/**
 * Funkcja motywu - publiczna alias do ApplyTheme.
 */
function Theme() {
  ApplyTheme();
}

/**
 * Generuje PDFy seatingu - alias.
 */
function GenerateSeatingPDFs() {
  const folderId = ensureDriveFolder_();
  if (!folderId) return;
  generateSeatingPDF_(folderId);
}

/**
 * Generuje PDFy itinerariów - alias.
 */
function GenerateItineraryPDFs() {
  const folderId = ensureDriveFolder_();
  if (!folderId) return;
  generateTimelinePDF_(folderId);
}

/**
 * Uzupełnia dane timeline w kalendarzu (test).
 */
function TestPushTimeline() {
  PushTimelineToCalendar();
}

/**
 * Zwraca konfigurację jako JSON.
 */
function GetPlannerConfig() {
  return CONFIG;
}
