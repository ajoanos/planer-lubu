/**
 * ALLEMEDIA Planer Ślubny – Apps Script główny plik Code.gs
 *
 * How to start:
 * 1. Otwórz Google Sheets → Extensions → Apps Script i wklej cały plik Code.gs.
 * 2. Zapisz projekt i uruchom funkcję InitializePlanner() (zapyta o uprawnienia).
 * 3. Po inicjalizacji przejdź do arkusza i użyj menu "Wedding Planner".
 *
 * Wymagane uprawnienia:
 * - SpreadsheetApp: tworzenie zakładek, formatowanie, ochrona zakresów.
 * - CalendarApp: synchronizacja timeline'u z kalendarzem Google.
 * - FormApp: generacja formularza RSVP powiązanego z arkuszem.
 * - DriveApp & SlidesApp: generowanie plików PDF oraz przechowywanie w Google Drive.
 * - GmailApp: wysyłka e-maili Save-the-Date i do vendorów.
 * - UrlFetchApp: tworzenie kodów QR poprzez Google Chart API.
 *
 * FAQ:
 * Q1: Jak zmienić czasy przypomnień kalendarza?
 *     → W funkcji getCalendarReminderMinutes() edytuj wartości (domyślnie 1440 i 120).
 * Q2: Jak dodać nową kategorię budżetową?
 *     → Dodaj wiersz w arkuszu "Wedding Budget" w sekcji kategorii i zaktualizuj NamedRange BUDGET_TABLE.
 * Q3: Czy można zmienić motyw kolorystyczny?
 *     → Tak, w arkuszu "Setup" wybierz nazwę motywu (np. Neutral, Terracotta, Lavender, Blue) i kliknij Initialize/Rebuild.
 */

const SHEET_NAMES = {
  setup: "Setup",
  dashboard: "Dashboard",
  saveTheDate: "Save the Date",
  timeline: "Wedding Timeline",
  itinerary: "Wedding Itinerary",
  packing: "Packing List",
  vendors: "Vendors Choice",
  contacts: "Contact Info",
  calendarLog: "Automated Calendar",
  budget: "Wedding Budget",
  guests: "Guest List",
  party: "Wedding Party",
  venues: "Venue Options",
  food: "Food & Drinks",
  seating: "Seating Plan",
  gallery: "Photo Gallery",
  gifts: "Gifts & Thank You",
  honeymoon: "Honeymoon Budget"
};

const NAMED_RANGES = {
  weddingDate: "SETUP_WEDDING_DATE",
  timezone: "SETUP_TIMEZONE",
  language: "SETUP_LANGUAGE",
  currency: "SETUP_CURRENCY",
  budgetTable: "BUDGET_TABLE",
  guestTable: "GUEST_TABLE",
  seatingTable: "SEATING_TABLE",
  kpiRange: "DASHBOARD_KPI",
  theme: "SETUP_THEME",
  driveFolder: "SETUP_DRIVE_FOLDER",
  calendarId: "SETUP_CALENDAR_ID",
  rsvpLink: "SETUP_RSVP_LINK",
  rsvpQR: "SETUP_RSVP_QR",
  timelineTable: "TIMELINE_TABLE",
  itineraryTable: "ITINERARY_TABLE"
};

const THEMES = {
  Neutral: {
    primary: "#BFA79E",
    accent: "#D8C7BD",
    kpi: "#F4ECE6",
    text: "#4A3B35"
  },
  Terracotta: {
    primary: "#C1694F",
    accent: "#DE9275",
    kpi: "#F6E8E1",
    text: "#402720"
  },
  Lavender: {
    primary: "#9C89B8",
    accent: "#B8A3D1",
    kpi: "#EFE5FF",
    text: "#423553"
  },
  Blue: {
    primary: "#7A9CC6",
    accent: "#A5C4E0",
    kpi: "#E6F0FA",
    text: "#2C3E50"
  }
};

const LANGUAGE_STRINGS = {
  PL: {
    dashboardTitle: "Dashboard Ślubny",
    kpiDays: "Dni do ślubu",
    kpiRSVP: "% RSVP potwierdzonych",
    kpiBudget: "Budżet - Odchyłka",
    kpiVendors: "Opłaceni vendorzy",
    kpiChecklist: "Postęp checklisty",
    kpiSeating: "% miejsc przypisanych",
    menuRoot: "Wedding Planner",
    menuInit: "Initialize / Rebuild",
    menuDemo: "Generate Demo Data",
    menuCalendar: "Push Timeline to Calendar",
    menuForm: "Create RSVP Form + Link",
    menuSave: "Send Save-the-Date Emails",
    menuPDF: "Generate PDFs",
    menuProtect: "Protect Formulas",
    menuUnprotect: "Unprotect",
    menuReset: "Reset Planner"
  },
  EN: {
    dashboardTitle: "Wedding Dashboard",
    kpiDays: "Days to wedding",
    kpiRSVP: "% RSVP confirmed",
    kpiBudget: "Budget variance",
    kpiVendors: "Vendors paid",
    kpiChecklist: "Checklist progress",
    kpiSeating: "Seating completion",
    menuRoot: "Wedding Planner",
    menuInit: "Initialize / Rebuild",
    menuDemo: "Generate Demo Data",
    menuCalendar: "Push Timeline to Calendar",
    menuForm: "Create RSVP Form + Link",
    menuSave: "Send Save-the-Date Emails",
    menuPDF: "Generate PDFs",
    menuProtect: "Protect Formulas",
    menuUnprotect: "Unprotect",
    menuReset: "Reset Planner"
  }
};

const ACCEPTANCE_TESTS = `\nTESTY AKCEPTACYJNE (skrót):\n1. InitializePlanner() tworzy komplet arkuszy i wykresów.\n2. Demo data zasila KPI i wykresy.\n3. Zmiana waluty w Setup odświeża formaty.\n4. Push Timeline to Calendar tworzy wydarzenia z przypomnieniami.\n5. Seating ostrzega przy przepełnieniu, PDF kart generowany.\n6. SendSaveTheDate() wysyła e-maile z .ics i linkiem RSVP.\n7. ProtectPlanner() blokuje formuły; UnprotectPlanner() je odblokowuje.\n8. Zmiana motywu odświeża Dashboard i wykresy.\n`;
/**
 * Wywoływane przy otwarciu arkusza. Dodaje menu Wedding Planner.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const language = getLanguage();
  const strings = LANGUAGE_STRINGS[language];
  ui.createMenu(strings.menuRoot)
    .addItem(strings.menuInit, "InitializePlanner")
    .addItem(strings.menuDemo, "GenerateDemoData")
    .addItem(strings.menuCalendar, "PushTimelineToCalendar")
    .addItem(strings.menuForm, "CreateRSVPFormAndLink")
    .addItem(strings.menuSave, "SendSaveTheDate")
    .addItem(strings.menuPDF, "GeneratePDFs")
    .addItem(strings.menuProtect, "ProtectPlanner")
    .addItem(strings.menuUnprotect, "UnprotectPlanner")
    .addItem(strings.menuReset, "ResetPlanner")
    .addToUi();
}

/**
 * Tworzy wszystkie arkusze, zakresy, named ranges, formuły i formatowanie.
 */
function InitializePlanner() {
  const ss = SpreadsheetApp.getActive();
  ss.toast("Budowanie planer...", "ALLEMEDIA", 5);
  const order = [
    SHEET_NAMES.setup,
    SHEET_NAMES.dashboard,
    SHEET_NAMES.saveTheDate,
    SHEET_NAMES.timeline,
    SHEET_NAMES.itinerary,
    SHEET_NAMES.packing,
    SHEET_NAMES.vendors,
    SHEET_NAMES.contacts,
    SHEET_NAMES.calendarLog,
    SHEET_NAMES.budget,
    SHEET_NAMES.guests,
    SHEET_NAMES.party,
    SHEET_NAMES.venues,
    SHEET_NAMES.food,
    SHEET_NAMES.seating,
    SHEET_NAMES.gallery,
    SHEET_NAMES.gifts,
    SHEET_NAMES.honeymoon
  ];
  order.forEach((name, idx) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name, idx);
    }
    sheet.clear();
  });
  ss.setActiveSheet(ss.getSheetByName(SHEET_NAMES.setup));
  createSetupSheet();
  createDashboardSheet();
  createSaveTheDateSheet();
  createTimelineSheet();
  createItinerarySheet();
  createPackingSheet();
  createVendorsSheet();
  createContactsSheet();
  createCalendarLogSheet();
  createBudgetSheet();
  createGuestSheet();
  createPartySheet();
  createVenueSheet();
  createFoodSheet();
  createSeatingSheet();
  createGallerySheet();
  createGiftsSheet();
  createHoneymoonSheet();
  createNamedRanges();
  ApplyTheme();
  LocalizeUI();
  ProtectPlanner();
  ss.toast("Planer gotowy!", "ALLEMEDIA", 5);
}

/**
 * Zakładka Setup z danymi wejściowymi.
 */
function createSetupSheet() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET_NAMES.setup);
  sheet.clear();
  sheet.setTabColor("#E8D5C4");
  sheet.setColumnWidths(1, 6, 220);
  sheet.setRowHeights(1, 40, 26);
  const headers = [["Parametr", "Wartość", "Opis", "Parametr", "Wartość", "Opis"]];
  sheet.getRange("A1:F1").setValues(headers).setFontWeight("bold").setBackground("#EADFD6");
  const rows = [
    ["Imię Panny Młodej", "Anna", "Imię przyszłej żony", "Imię Pana Młodego", "Jan", "Imię przyszłego męża"],
    ["Data ślubu", new Date(), "Wybierz datę wydarzenia", "Godzina ślubu", "15:00", "Planowany start ceremonii"],
    ["Strefa czasowa", Session.getScriptTimeZone(), "np. Europe/Warsaw", "Język interfejsu", "PL", "PL lub EN"],
    ["Waluta", "PLN", "Symbol waluty w budżecie", "Stawka VAT %", 23, "Opcjonalne"],
    ["Docelowa liczba gości", 120, "Służy do KPI", "Motyw kolorystyczny", "Neutral", "Neutral/Terracotta/Lavender/Blue"],
    ["Główny kolor (hex)", "#BFA79E", "Zostanie nadpisany przez motyw", "Akcent (hex)", "#D8C7BD", "Kolor akcentu"],
    ["Tło kart KPI", "#F4ECE6", "Kolor kart na Dashboard", "ID kalendarza", "", "Pozostaw puste by użyć podstawowego"],
    ["ID folderu na PDF", "", "Folder na PDF (Drive)", "Golden hour?", "TAK", "TAK/NIE"],
    ["Sesja: kościelny?", "TAK", "TAK/NIE", "Lokalizacje (1/2)", "1", "1 lub 2"],
    ["Generuj automatycznie", "Menu", "Skorzystaj z menu", "RSVP Form URL", "", "Link zostanie wstawiony"],
    ["RSVP Form QR", "", "Obraz zostanie wstawiony", "Uwagi", ACCEPTANCE_TESTS, "Testy akceptacyjne"]
  ];
  sheet.getRange(2, 1, rows.length, 6).setValues(rows);
  sheet.getRange("B2:B10").setNumberFormat("@");
  sheet.getRange("E2:E10").setNumberFormat("@");
  sheet.getRange("A12:F12").merge().setValue("Jak używać: Uzupełnij podstawowe dane i korzystaj z menu Wedding Planner.")
    .setWrap(true).setBackground("#FAF6F2").setFontStyle("italic");
  sheet.getRange("A13:F18").merge().setValue("Przyciski znajdują się w menu. Zakładka Dashboard pokaże KPI i wykresy po wprowadzeniu danych.")
    .setWrap(true).setBackground("#FDF9F5");
  sheet.setFrozenRows(1);
  addDataValidation(sheet.getRange("E3"), ["PL", "EN"]);
  addDataValidation(sheet.getRange("E5"), Object.keys(THEMES));
  addDataValidation(sheet.getRange("E8"), ["TAK", "NIE"]);
  addDataValidation(sheet.getRange("E9"), ["1", "2"]);
}
/**
 * Tworzy arkusz Dashboard.
 */
function createDashboardSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.dashboard);
  sheet.clear();
  sheet.setTabColor("#D4B8A8");
  sheet.setColumnWidths(1, 10, 140);
  sheet.setRowHeights(1, 40, 32);
  const titleRange = sheet.getRange("A1:H2");
  titleRange.merge().setValue("ALLEMEDIA Wedding Dashboard")
    .setFontSize(20).setFontWeight("bold").setBackground("#F7EFEA")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  const kpiRows = [
    ["KPI", "Wartość", "Opis"],
    ["Dni do ślubu", `=MAX(0;INT(${NAMED_RANGES.weddingDate}-DZIŚ()))`, "Pozostały czas"],
    ["RSVP potwierdzone", "=IFERROR(COUNTIF('Guest List'!H:H;\"Tak\")/COUNTA('Guest List'!A:A);0)", "Poziom odpowiedzi"],
    ["Budżet – Plan", "=IFERROR(SUM('Wedding Budget'!C2:C);0)", "Plan"],
    ["Budżet – Wykonanie", "=IFERROR(SUM('Wedding Budget'!D2:D);0)", "Wydatki"],
    ["Vendorzy opłaceni", "=COUNTIF('Vendors Choice'!H:H;\"paid\")", "Status vendorów"],
    ["Postęp checklisty", "=IFERROR(AVERAGE('Packing List'!G2:G);0)", "Procent"],
    ["Przypisane miejsca", "=IFERROR(COUNTIF('Seating Plan'!D2:I;\"<>\")/COUNTA('Guest List'!A2:A);0)", "Seating"]
  ];
  sheet.getRange(4, 1, kpiRows.length, kpiRows[0].length).setValues(kpiRows);
  sheet.getRange("A4:C4").setFontWeight("bold").setBackground("#E8DCD2");
  sheet.getRange("A4:C11").setBorder(true, true, true, true, true, true);
  sheet.getRange("B6:B11").setNumberFormat("0.00%");
  sheet.getRange("B5").setNumberFormat("0");
  sheet.getRange("B7:B8").setNumberFormat("#,##0.00" + " \"" + getCurrencySymbol() + "\"");
  sheet.getRange("E4:H12").merge().setValue("Mini timeline (ostatnie 6 etapów)")
    .setBackground("#F3EBE4").setFontWeight("bold").setVerticalAlignment("top");
  sheet.getRange("E5:H12").setFormulaR1C1("=ARRAYFORMULA(QUERY({'Wedding Timeline'!A2:G}; \"select Col1,Col2,Col5 where Col1 is not null limit 6\"))");
  createDashboardCharts(sheet);
}

/**
 * Wykresy KPI na Dashboardzie.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function createDashboardCharts(sheet) {
  sheet.getCharts().forEach(chart => sheet.removeChart(chart));
  const budgetRange = sheet.getRange("B7:B8");
  const budgetLabels = sheet.getRange("A7:A8");
  const budgetChart = sheet.newChart()
    .addRange(budgetLabels)
    .addRange(budgetRange)
    .setPosition(13, 1, 0, 0)
    .setChartType(Charts.ChartType.PIE)
    .setOption("pieHole", 0.5)
    .setOption("title", "Budżet: Plan vs Wykonanie")
    .build();
  sheet.insertChart(budgetChart);
  const rsvpRange = sheet.getRange("H2:H4");
  const rsvpChart = sheet.newChart()
    .addRange(rsvpRange)
    .setChartType(Charts.ChartType.PIE)
    .setPosition(13, 5, 0, 0)
    .setOption("title", "RSVP tak / nie / brak")
    .build();
  sheet.insertChart(rsvpChart);
}

/**
 * Zakładka Save the Date.
 */
function createSaveTheDateSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.saveTheDate);
  sheet.clear();
  sheet.setTabColor("#EBC7A8");
  const headers = [["Imię", "Nazwisko", "Email", "Telefon", "Strona", "Język", "Tagi", "Status wysyłki", "Timestamp"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setFontWeight("bold").setBackground("#F2E1D4");
  sheet.setFrozenRows(1);
  sheet.getRange("A2:I3").setValues([
    ["Maria", "Kowalska", "maria@example.com", "+48 123", "Panna", "PL", "rodzina", "", ""],
    ["John", "Smith", "john@example.com", "+1 555", "Pan", "EN", "friends", "", ""]
  ]);
  addDataValidation(sheet.getRange("E2:E" + sheet.getMaxRows()), ["Panna", "Pan"]);
  addDataValidation(sheet.getRange("F2:F" + sheet.getMaxRows()), ["PL", "EN"]);
}
/**
 * Zakładka Wedding Timeline.
 */
function createTimelineSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.timeline);
  sheet.clear();
  sheet.setTabColor("#D9C3B0");
  const headers = [["Etap", "Start", "Czas trwania (min)", "Lokalizacja", "Odpowiedzialny", "Notatki", "Bufor", "Koniec"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#EFE2D7").setFontWeight("bold");
  const data = [
    ["Przygotowania", "09:00", 120, "Hotel", "Koordynator", "Make-up", 15, "=B2+TIME(0,C2,0)+TIME(0,G2,0)"],
    ["Ceremonia", "14:00", 60, "Kościół", "Ksiądz", "Przysięga", 10, "=B3+TIME(0,C3,0)+TIME(0,G3,0)"],
    ["Przejazd", "15:00", 30, "Autokar", "Kierowca", "", 5, "=B4+TIME(0,C4,0)+TIME(0,G4,0)"],
    ["Przyjęcie", "16:00", 300, "Sala", "Manager", "Kolacja", 30, "=B5+TIME(0,C5,0)+TIME(0,G5,0)"]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  sheet.setFrozenRows(1);
  sheet.getRange("B2:B100").setNumberFormat("hh:mm");
  sheet.getRange("H2:H100").setNumberFormat("hh:mm");
  sheet.getRange("C2:C100").setNumberFormat("0");
  sheet.getRange("G2:G100").setNumberFormat("0");
  sheet.getRange("I1:K1").setValues([["Przełącznik", "Wartość", "Opis"]]).setBackground("#F1E5DB").setFontWeight("bold");
  sheet.getRange("I2:K4").setValues([
    ["Typ ceremonii", "Kościelny", "Kościelny/Cywilny"],
    ["Lokalizacje", "1", "1 lub 2"],
    ["Golden hour", "TAK", "Automatyczne wstawki"]
  ]);
  addDataValidation(sheet.getRange("J2"), ["Kościelny", "Cywilny"]);
  addDataValidation(sheet.getRange("J3"), ["1", "2"]);
  addDataValidation(sheet.getRange("J4"), ["TAK", "NIE"]);
}

/**
 * Zakładka Wedding Itinerary.
 */
function createItinerarySheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.itinerary);
  sheet.clear();
  sheet.setTabColor("#E7D2C0");
  const headers = [["Rola", "Etap", "Start", "Koniec", "Lokalizacja", "Zadania", "Kontakt", "Notatki"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F4E8DD").setFontWeight("bold");
  sheet.getRange("A2:H6").setValues([
    ["Para", "Ceremonia", "14:00", "15:00", "Kościół", "Przysięga", "Koordynator", ""],
    ["Fotograf", "Golden hour", "18:30", "19:00", "Ogród", "Sesja", "Anna Foto", ""],
    ["Świadkowie", "Przygotowania", "10:00", "12:00", "Hotel", "Wsparcie", "Ewa", ""],
    ["DJ", "Pierwszy taniec", "17:30", "18:00", "Sala", "Playlisty", "DJ Max", ""],
    ["Koordynator", "Cały dzień", "09:00", "23:00", "Sala", "Kontakt z vendorami", "Paulina", ""]
  ]);
  sheet.setFrozenRows(1);
  sheet.getRange("J1:K1").setValues([["Generowanie", "Opis"]]).setBackground("#F4E8DD").setFontWeight("bold");
  sheet.getRange("J2:K4").setValues([
    ["PDF", "Menu → Generate PDFs"],
    ["Filtr", "Wybierz rolę"],
    ["Zapis", "Folder z Setup"]
  ]);
}

/**
 * Zakładka Packing List.
 */
function createPackingSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.packing);
  sheet.clear();
  sheet.setTabColor("#F1DCCA");
  const headers = [["Kategoria", "Przedmiot", "Opis", "Odpowiedzialny", "Status", "Notatki", "Progres"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F8EBE0").setFontWeight("bold");
  sheet.getRange("A2:G4").setValues([
    ["Para", "Obrączki", "Spakować", "Świadek", "⏳", "", "=IF(E2=\"✅\",1,IF(E2=\"⏳\",0.5,0))"],
    ["Beauty", "Make-up", "Kosmetyki", "Panna młoda", "⏳", "", "=IF(E3=\"✅\",1,IF(E3=\"⏳\",0.5,0))"],
    ["Sala", "Winietki", "Dekoracje", "Koordynator", "❌", "Zamówić druk", "=IF(E4=\"✅\",1,IF(E4=\"⏳\",0.5,0))"]
  ]);
  addDataValidation(sheet.getRange("E2:E" + sheet.getMaxRows()), ["✅", "⏳", "❌"]);
  sheet.getRange("G2:G").setNumberFormat("0.00%");
  sheet.getRange("I1:J1").setValues([["Postęp", "%"]]).setBackground("#F8EBE0").setFontWeight("bold");
  sheet.getRange("I2").setFormula("=IFERROR(AVERAGE(G2:G);0)");
  sheet.getRange("J2").setFormula("=TEXT(I2;\"0%\")");
  sheet.setFrozenRows(1);
}

/**
 * Zakładka Vendors Choice.
 */
function createVendorsSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.vendors);
  sheet.clear();
  sheet.setTabColor("#DCC0AA");
  const headers = [["Kategoria", "Vendor", "Kontakt", "Telefon", "Email", "Adres", "Link", "Status", "Rating", "Zaliczka", "Data 1", "Data 2", "Kwota", "Uwagi"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F3E6DB").setFontWeight("bold");
  sheet.getRange("A2:N4").setValues([
    ["Fotograf", "Perfect Shots", "Anna", "+48 600", "foto@example.com", "Warszawa", "http://", "selected", 5, 2000, new Date(), new Date(), 5000, ""],
    ["Sala", "Villa Rosa", "Piotr", "+48 500", "villa@example.com", "Kraków", "http://", "shortlist", 4, 5000, new Date(), new Date(), 15000, ""],
    ["DJ", "DJ Max", "Max", "+48 777", "dj@example.com", "Poznań", "http://", "paid", 5, 1000, new Date(), new Date(), 3000, ""]
  ]);
  addDataValidation(sheet.getRange("H2:H" + sheet.getMaxRows()), ["shortlist", "selected", "paid"]);
  sheet.setFrozenRows(1);
}

/**
 * Zakładka Contact Info.
 */
function createContactsSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.contacts);
  sheet.clear();
  sheet.setTabColor("#E6CAB5");
  const headers = [["Nazwa", "Rola", "Telefon", "Email", "Adres", "Notatki"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F7EAE0").setFontWeight("bold");
  sheet.getRange("A2:F4").setValues([
    ["Mama Anny", "Rodzina", "+48 123", "mama@example.com", "", "Logistyka"],
    ["Kierowca", "Obsługa", "+48 700", "driver@example.com", "", "Transport"],
    ["Koordynator", "Obsługa", "+48 500", "koord@example.com", "", "Główny kontakt"]
  ]);
  sheet.setFrozenRows(1);
}

/**
 * Zakładka Automated Calendar.
 */
function createCalendarLogSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.calendarLog);
  sheet.clear();
  sheet.setTabColor("#E3C6A6");
  const headers = [["Timestamp", "Etap", "Event ID", "Status", "Opis"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F4E3D1").setFontWeight("bold");
  sheet.setFrozenRows(1);
}

/**
 * Zakładka Wedding Budget.
 */
function createBudgetSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.budget);
  sheet.clear();
  sheet.setTabColor("#CFAF95");
  const headers = [["Kategoria", "Podkategoria", "Plan", "Wykonanie", "Różnica", "Status", "Vendor", "Uwagi"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F1DECF").setFontWeight("bold");
  sheet.getRange("A2:H4").setValues([
    ["Venue", "Sala", 15000, 5000, "=C2-D2", "deposit", "=VLOOKUP(B2,'Vendors Choice'!B:C,2,false)", "Zaliczka"],
    ["Fotografia", "Pakiet foto", 5000, 2000, "=C3-D3", "deposit", "=VLOOKUP(B3,'Vendors Choice'!B:C,2,false)", "Zaliczka"],
    ["Muzyka", "DJ", 4000, 3000, "=C4-D4", "paid", "=VLOOKUP(B4,'Vendors Choice'!B:C,2,false)", "Opłacone"]
  ]);
  sheet.getRange("C2:D100").setNumberFormat("#,##0.00" + " \"" + getCurrencySymbol() + "\"");
  sheet.getRange("E2:E100").setNumberFormat("#,##0.00" + " \"" + getCurrencySymbol() + "\"");
  addDataValidation(sheet.getRange("F2:F" + sheet.getMaxRows()), ["deposit", "paid", "unpaid"]);
  sheet.setFrozenRows(1);
  sheet.getRange("J1:K1").setValues([["Podsumowanie", "Wartość"]]).setBackground("#F1DECF").setFontWeight("bold");
  sheet.getRange("J2:K6").setValues([
    ["Plan", "=SUM(C2:C)"],
    ["Wykonanie", "=SUM(D2:D)"],
    ["Odchyłka", "=J2-J3"],
    ["%", "=IF(J2=0,0,J3/J2)"],
    ["Alert", "=IF(J3>J2,\"⚠️\",\"OK\")"]
  ]);
}

/**
 * Zakładka Guest List.
 */
function createGuestSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.guests);
  sheet.clear();
  sheet.setTabColor("#D8B7A5");
  const headers = [["Imię", "Nazwisko", "Strona", "Grupa", "Email", "Telefon", "Adres", "RSVP", "Dieta", "Dzieci", "Dojazd", "Notatki"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F4E6DA").setFontWeight("bold");
  sheet.getRange("A2:L4").setValues([
    ["Anna", "Kowalska", "PM", "Rodzina", "anna@example.com", "+48 123", "", "Tak", "Vege", 0, "Autobus", ""],
    ["Piotr", "Nowak", "PMł", "Przyjaciele", "piotr@example.com", "+48 999", "", "Brak", "Standard", 0, "Własny", ""],
    ["Laura", "Smith", "PM", "Rodzina", "laura@example.com", "+1 234", "", "Nie", "Gluten-free", 2, "Autobus", ""]
  ]);
  addDataValidation(sheet.getRange("C2:C" + sheet.getMaxRows()), ["PM", "PMł"]);
  addDataValidation(sheet.getRange("H2:H" + sheet.getMaxRows()), ["Tak", "Nie", "Brak"]);
  sheet.setFrozenRows(1);
  sheet.getRange("N1:O1").setValues([["KPI", "Wartość"]]).setBackground("#F4E6DA").setFontWeight("bold");
  sheet.getRange("N2:O6").setValues([
    ["Liczba gości", "=COUNTA(A2:A)"],
    ["RSVP Tak", "=COUNTIF(H2:H;\"Tak\")"],
    ["RSVP Nie", "=COUNTIF(H2:H;\"Nie\")"],
    ["Wege", "=COUNTIF(I2:I;\"Vege\")"],
    ["Dzieci", "=SUM(J2:J)"]
  ]);
}
/**
 * Zakładka Wedding Party.
 */
function createPartySheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.party);
  sheet.clear();
  sheet.setTabColor("#D3BFB0");
  const headers = [["Rola", "Imię", "Telefon", "Email", "Obowiązki", "Notatki"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#EFE2D8").setFontWeight("bold");
  sheet.getRange("A2:F4").setValues([
    ["Świadkowa", "Ewa", "+48 123", "ewa@example.com", "Wsparcie Panny Młodej", ""],
    ["Świadek", "Adam", "+48 888", "adam@example.com", "Koordynacja", ""],
    ["Druhna", "Karolina", "+48 345", "karolina@example.com", "Dekoracje", ""]
  ]);
  sheet.setFrozenRows(1);
}

/**
 * Zakładka Venue Options.
 */
function createVenueSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.venues);
  sheet.clear();
  sheet.setTabColor("#CDAE97");
  const headers = [["Venue", "Pojemność", "Koszt", "Catering", "Dojazd", "Plusy", "Minusy", "Ocena", "Status"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F2DFD1").setFontWeight("bold");
  sheet.getRange("A2:I4").setValues([
    ["Villa Rosa", 150, 15000, "Full", "Blisko", "Ogród", "Cena", 4.5, "Leading"],
    ["Pałac W", 200, 20000, "Full", "Daleko", "Sala balowa", "Dojazd", 4.0, "Shortlist"],
    ["Dworek S", 120, 12000, "Partial", "Średni", "Klimat", "Mniejsza sala", 3.8, "Backup"]
  ]);
  sheet.getRange("J1:K1").setValues([["Zwycięzca", "Formuła"]]).setBackground("#F2DFD1").setFontWeight("bold");
  sheet.getRange("J2").setValue("=INDEX(A2:A;MATCH(MAX(H2:H);H2:H;0))");
  sheet.setFrozenRows(1);
}

/**
 * Zakładka Food & Drinks.
 */
function createFoodSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.food);
  sheet.clear();
  sheet.setTabColor("#E6C9B0");
  const headers = [["Typ posiłku", "Pozycja", "Opis", "Dieta", "Liczba porcji", "Cena", "Uwagi"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F5E7DA").setFontWeight("bold");
  sheet.getRange("A2:G5").setValues([
    ["Przystawka", "Carpaccio", "Wołowe", "Standard", 80, 35, ""],
    ["Danie główne", "Łosoś", "Pieczony", "Vege", 30, 45, ""],
    ["Deser", "Tiramisu", "Klasyczne", "Standard", 80, 25, ""],
    ["Napoje", "Prosecco", "Butelki", "Standard", 40, 55, ""]
  ]);
  sheet.getRange("H1:I1").setValues([["Podsumowanie", "Formuła"]]).setBackground("#F5E7DA").setFontWeight("bold");
  sheet.getRange("H2:I4").setValues([
    ["Razem porcji", "=SUM(E2:E)"],
    ["Łączny koszt", "=SUMPRODUCT(E2:E;F2:F)"],
    ["Vege", "=SUMIF(D2:D;\"Vege\";E2:E)"]
  ]);
  sheet.setFrozenRows(1);
}

/**
 * Zakładka Seating Plan.
 */
function createSeatingSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.seating);
  sheet.clear();
  sheet.setTabColor("#D9B9A2");
  const headers = [["Stolik", "Typ", "Pojemność", "Gość 1", "Gość 2", "Gość 3", "Gość 4", "Gość 5", "Gość 6", "Uwagi", "Wolne miejsca"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F3E1D3").setFontWeight("bold");
  sheet.getRange("A2:K4").setValues([
    ["Stolik 1", "Okrągły", 8, "Gość 1", "Gość 2", "Gość 3", "Gość 4", "Gość 5", "Gość 6", "Rodzina", "=C2-COUNTA(D2:I2)"],
    ["Stolik 2", "Okrągły", 8, "Gość 7", "Gość 8", "Gość 9", "", "", "", "Przyjaciele", "=C3-COUNTA(D3:I3)"],
    ["Stolik 3", "Prostokątny", 10, "Gość 10", "Gość 11", "Gość 12", "", "", "", "Mix", "=C4-COUNTA(D4:I4)"]
  ]);
  addDataValidation(sheet.getRange("B2:B" + sheet.getMaxRows()), ["Okrągły", "Prostokątny", "Sweetheart"]);
  sheet.getRange("K2:K").setNumberFormat("0");
  sheet.getRange("L1:M1").setValues([["Alert", "Formuła"]]).setBackground("#F3E1D3").setFontWeight("bold");
  sheet.getRange("L2").setValue("=IF(K2<0;\"⚠️ Przepełnienie\";\"OK\")");
  sheet.getRange("L3").setValue("=IF(K3<0;\"⚠️\";\"OK\")");
  sheet.getRange("L4").setValue("=IF(K4<0;\"⚠️\";\"OK\")");
  sheet.setFrozenRows(1);
}

/**
 * Zakładka Photo Gallery.
 */
function createGallerySheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.gallery);
  sheet.clear();
  sheet.setTabColor("#E2C2A8");
  const headers = [["Shot", "Opis", "Osoba", "Status", "Folder Drive ID", "Miniaturka"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F3E5D5").setFontWeight("bold");
  sheet.getRange("A2:F4").setValues([
    ["Pierwszy taniec", "Uchwycić emocje", "Fotograf", "⏳", "", ""],
    ["Bukiet", "Rzut bukietem", "Fotograf", "⏳", "", ""],
    ["Rodzina", "Zdjęcie rodzinne", "Fotograf", "⏳", "", ""]
  ]);
  addDataValidation(sheet.getRange("D2:D" + sheet.getMaxRows()), ["⏳", "✅", "❌"]);
  sheet.setFrozenRows(1);
}

/**
 * Zakładka Gifts & Thank You.
 */
function createGiftsSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.gifts);
  sheet.clear();
  sheet.setTabColor("#E4C7B1");
  const headers = [["Od kogo", "Prezent", "Wartość", "Adres", "Podziękowanie wysłane", "Notatki"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F5E6D8").setFontWeight("bold");
  sheet.getRange("A2:F4").setValues([
    ["Maria", "Koperta", 500, "Warszawa", "⏳", ""],
    ["John", "Vase", 300, "London", "❌", ""],
    ["Laura", "Weekend", 800, "Berlin", "✅", ""]
  ]);
  addDataValidation(sheet.getRange("E2:E" + sheet.getMaxRows()), ["✅", "⏳", "❌"]);
  sheet.getRange("C2:C").setNumberFormat("#,##0.00" + " \"" + getCurrencySymbol() + "\"");
  sheet.setFrozenRows(1);
}

/**
 * Zakładka Honeymoon Budget.
 */
function createHoneymoonSheet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.honeymoon);
  sheet.clear();
  sheet.setTabColor("#DDBCA4");
  const headers = [["Kategoria", "Plan", "Wykonanie", "Różnica", "Checklist", "Notatki"]];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers).setBackground("#F4E2D3").setFontWeight("bold");
  sheet.getRange("A2:F4").setValues([
    ["Transport", 4000, 0, "=B2-C2", "❌", "Loty"],
    ["Noclegi", 6000, 0, "=B3-C3", "⏳", "Hotel"],
    ["Atrakcje", 2000, 0, "=B4-C4", "⏳", "Wycieczki"]
  ]);
  addDataValidation(sheet.getRange("E2:E" + sheet.getMaxRows()), ["✅", "⏳", "❌"]);
  sheet.getRange("B2:C").setNumberFormat("#,##0.00" + " \"" + getCurrencySymbol() + "\"");
  sheet.setFrozenRows(1);
  sheet.getRange("G1:H1").setValues([["Itinerary", "Opis"]]).setBackground("#F4E2D3").setFontWeight("bold");
  sheet.getRange("G2:H4").setValues([
    ["Dzień 1", "Przylot"],
    ["Dzień 2", "Zwiedzanie"],
    ["Dzień 3", "Plaża"]
  ]);
}

/**
 * Named ranges.
 */
function createNamedRanges() {
  const ss = SpreadsheetApp.getActive();
  const ranges = [
    { name: NAMED_RANGES.weddingDate, range: `${SHEET_NAMES.setup}!B2` },
    { name: NAMED_RANGES.timezone, range: `${SHEET_NAMES.setup}!B3` },
    { name: NAMED_RANGES.language, range: `${SHEET_NAMES.setup}!E3` },
    { name: NAMED_RANGES.currency, range: `${SHEET_NAMES.setup}!B4` },
    { name: NAMED_RANGES.theme, range: `${SHEET_NAMES.setup}!E5` },
    { name: NAMED_RANGES.driveFolder, range: `${SHEET_NAMES.setup}!B7` },
    { name: NAMED_RANGES.calendarId, range: `${SHEET_NAMES.setup}!E7` },
    { name: NAMED_RANGES.rsvpLink, range: `${SHEET_NAMES.setup}!E10` },
    { name: NAMED_RANGES.rsvpQR, range: `${SHEET_NAMES.setup}!B11` },
    { name: NAMED_RANGES.budgetTable, range: `${SHEET_NAMES.budget}!A1:H200` },
    { name: NAMED_RANGES.guestTable, range: `${SHEET_NAMES.guests}!A1:L400` },
    { name: NAMED_RANGES.seatingTable, range: `${SHEET_NAMES.seating}!A1:K200` },
    { name: NAMED_RANGES.timelineTable, range: `${SHEET_NAMES.timeline}!A1:H200` },
    { name: NAMED_RANGES.itineraryTable, range: `${SHEET_NAMES.itinerary}!A1:H200` }
  ];
  ranges.forEach(obj => {
    ss.setNamedRange(obj.name, ss.getRange(obj.range));
  });
}

/**
 * Symbol waluty.
 */
function getCurrencySymbol() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.setup);
  if (!sheet) return "PLN";
  const value = sheet.getRange("B4").getValue();
  return value || "PLN";
}

/**
 * Walidacja danych.
 */
function addDataValidation(range, values) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}

/**
 * Aktualny język.
 */
function getLanguage() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.setup);
  if (!sheet) return "PL";
  const lang = sheet.getRange("E3").getValue();
  return lang === "EN" ? "EN" : "PL";
}

/**
 * Lokalizacja UI.
 */
function LocalizeUI() {
  const ss = SpreadsheetApp.getActive();
  const language = getLanguage();
  const strings = LANGUAGE_STRINGS[language];
  const dashboard = ss.getSheetByName(SHEET_NAMES.dashboard);
  if (dashboard) {
    dashboard.getRange("A1").setValue(strings.dashboardTitle);
    dashboard.getRange("A5").setValue(strings.kpiDays);
    dashboard.getRange("A6").setValue(strings.kpiRSVP);
    dashboard.getRange("A9").setValue(strings.kpiVendors);
    dashboard.getRange("A10").setValue(strings.kpiChecklist);
    dashboard.getRange("A11").setValue(strings.kpiSeating);
  }
}

/**
 * Motyw kolorystyczny.
 */
function ApplyTheme() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET_NAMES.setup);
  const themeName = sheet ? sheet.getRange("E5").getValue() : "Neutral";
  const theme = THEMES[themeName] || THEMES.Neutral;
  Object.values(SHEET_NAMES).forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const header = sh.getRange(1, 1, 1, Math.min(sh.getMaxColumns(), 12));
    header.setFontFamily("Segoe UI").setFontColor(theme.text).setBackground(theme.accent);
    sh.getRange("A1:Z200").setFontFamily("Segoe UI");
  });
  if (sheet) {
    sheet.getRange("B6").setValue(theme.primary);
    sheet.getRange("E6").setValue(theme.accent);
    sheet.getRange("B7").setValue(theme.kpi);
  }
  const dashboard = ss.getSheetByName(SHEET_NAMES.dashboard);
  if (dashboard) {
    dashboard.getRange("A1:H2").setBackground(theme.primary).setFontColor("white");
    dashboard.getRange("A4:C11").setBackground(theme.kpi);
  }
}
/**
 * Formularz RSVP.
 */
function CreateRSVPFormAndLink() {
  const ss = SpreadsheetApp.getActive();
  const setupSheet = ss.getSheetByName(SHEET_NAMES.setup);
  let form;
  const existing = setupSheet.getRange("E10").getValue();
  if (existing) {
    try {
      form = FormApp.openByUrl(existing);
    } catch (err) {
      form = FormApp.create("Wedding RSVP");
    }
  } else {
    form = FormApp.create("Wedding RSVP");
  }
  form.setDescription("Formularz RSVP synchronizowany z arkuszem");
  form.deleteAllResponses();
  form.getItems().forEach(item => form.deleteItem(item));
  form.addTextItem().setTitle("Imię").setRequired(true);
  form.addTextItem().setTitle("Nazwisko").setRequired(true);
  form.addTextItem().setTitle("Email").setRequired(true);
  form.addMultipleChoiceItem().setTitle("Czy będziesz?").setChoiceValues(["Tak", "Nie", "Jeszcze nie wiem"]);
  form.addTextItem().setTitle("Dieta");
  form.addTextItem().setTitle("Transport");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  setupSheet.getRange("E10").setValue(form.getPublishedUrl());
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(form.getPublishedUrl())}`;
  setupSheet.getRange("B11").setValue(`=IMAGE(\"${qrUrl}\")`);
  ss.toast("RSVP gotowe", "ALLEMEDIA", 5);
}

/**
 * Dane demonstracyjne.
 */
function GenerateDemoData() {
  const ss = SpreadsheetApp.getActive();
  const guestSheet = ss.getSheetByName(SHEET_NAMES.guests);
  if (guestSheet) {
    const guests = [];
    const statuses = ["Tak", "Nie", "Brak"];
    const diets = ["Standard", "Vege", "Bezgluten"];
    for (let i = 0; i < 40; i++) {
      guests.push([
        `Gość ${i + 1}`,
        `Nazwisko ${i + 1}`,
        i % 2 === 0 ? "PM" : "PMł",
        i % 3 === 0 ? "Rodzina" : "Przyjaciele",
        `guest${i + 1}@example.com`,
        `+48 500 000 ${('00' + i).slice(-2)}`,
        "",
        statuses[Math.floor(Math.random() * statuses.length)],
        diets[Math.floor(Math.random() * diets.length)],
        Math.floor(Math.random() * 3),
        ["Autobus", "Własny", "Taxi"][Math.floor(Math.random() * 3)],
        ""
      ]);
    }
    guestSheet.getRange(2, 1, guests.length, guests[0].length).setValues(guests);
  }
  const budgetSheet = ss.getSheetByName(SHEET_NAMES.budget);
  if (budgetSheet) {
    const categories = ["Venue", "Food", "Decor", "Music", "Photo", "Video", "Flowers", "Transport", "Other"];
    const rows = categories.map((cat, idx) => {
      const plan = 3000 + idx * 1200;
      const actual = plan * (0.4 + Math.random() * 0.6);
      return [cat, `${cat} detail`, plan, actual, `=C${idx + 2}-D${idx + 2}`, "deposit", "", "Demo"];
    });
    budgetSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  const timelineSheet = ss.getSheetByName(SHEET_NAMES.timeline);
  if (timelineSheet) {
    const entries = [
      ["Przygotowania", "09:00", 120, "Hotel", "Koordynator", "", 15, "=B2+TIME(0,C2,0)+TIME(0,G2,0)"],
      ["Ceremonia", "14:00", 60, "Kościół", "Ksiądz", "", 10, "=B3+TIME(0,C3,0)+TIME(0,G3,0)"],
      ["Przejazd", "15:00", 30, "Autokar", "Kierowca", "", 5, "=B4+TIME(0,C4,0)+TIME(0,G4,0)"],
      ["Przyjęcie", "16:00", 300, "Sala", "Manager", "", 30, "=B5+TIME(0,C5,0)+TIME(0,G5,0)"],
      ["Pierwszy taniec", "18:30", 30, "Sala", "DJ", "", 5, "=B6+TIME(0,C6,0)+TIME(0,G6,0)"],
      ["Tort", "20:00", 30, "Sala", "Koordynator", "", 5, "=B7+TIME(0,C7,0)+TIME(0,G7,0)"],
      ["Afterparty", "23:00", 120, "Sala", "DJ", "", 10, "=B8+TIME(0,C8,0)+TIME(0,G8,0)"]
    ];
    timelineSheet.getRange(2, 1, entries.length, entries[0].length).setValues(entries);
  }
  const seatingSheet = ss.getSheetByName(SHEET_NAMES.seating);
  if (seatingSheet) {
    const rows = [];
    for (let i = 0; i < 12; i++) {
      rows.push([
        `Stolik ${i + 1}`,
        i % 2 === 0 ? "Okrągły" : "Prostokątny",
        8,
        `Gość ${i * 6 + 1}`,
        `Gość ${i * 6 + 2}`,
        `Gość ${i * 6 + 3}`,
        `Gość ${i * 6 + 4}`,
        `Gość ${i * 6 + 5}`,
        `Gość ${i * 6 + 6}`,
        `Sekcja ${i % 3 + 1}`,
        `=C${i + 2}-COUNTA(D${i + 2}:I${i + 2})`
      ]);
    }
    seatingSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  ApplyTheme();
  LocalizeUI();
  ss.toast("Wstawiono dane demo", "ALLEMEDIA", 5);
}

/**
 * Łączenie daty i czasu.
 */
function combineDateAndTime(date, timeValue, timezone) {
  const dateOnly = new Date(date);
  let hour = 0;
  let minute = 0;
  if (timeValue instanceof Date) {
    hour = timeValue.getHours();
    minute = timeValue.getMinutes();
  } else if (typeof timeValue === "number") {
    const minutes = Math.round(timeValue * 24 * 60);
    hour = Math.floor(minutes / 60);
    minute = minutes % 60;
  } else {
    const parts = timeValue.toString().split(":");
    hour = parseInt(parts[0], 10) || 0;
    minute = parseInt(parts[1], 10) || 0;
  }
  return new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), hour, minute);
}

/**
 * Minuty przypomnień kalendarza.
 */
function getCalendarReminderMinutes() {
  return [1440, 120];
}

/**
 * Synchronizacja z kalendarzem.
 */
function PushTimelineToCalendar() {
  const ss = SpreadsheetApp.getActive();
  const setupSheet = ss.getSheetByName(SHEET_NAMES.setup);
  const timelineSheet = ss.getSheetByName(SHEET_NAMES.timeline);
  const logSheet = ss.getSheetByName(SHEET_NAMES.calendarLog);
  const calendarId = setupSheet.getRange("E7").getValue() || CalendarApp.getDefaultCalendar().getId();
  const calendar = CalendarApp.getCalendarById(calendarId);
  const weddingDate = setupSheet.getRange("B2").getValue();
  const timezone = setupSheet.getRange("B3").getValue() || Session.getScriptTimeZone();
  const lastRow = timelineSheet.getLastRow();
  if (lastRow <= 1) {
    ss.toast("Brak pozycji w timeline", "ALLEMEDIA", 5);
    return;
  }
  const values = timelineSheet.getRange(2, 1, lastRow - 1, 8).getValues();
  const logRows = [];
  values.forEach(row => {
    const [stage, startTime, duration, location, responsible, notes] = row;
    if (!stage || !startTime) return;
    const startDateTime = combineDateAndTime(weddingDate, startTime, timezone);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    const event = calendar.createEvent(stage, startDateTime, endDateTime, {
      description: `${responsible || ""}\n${notes || ""}`,
      location: location || ""
    });
    getCalendarReminderMinutes().forEach(minutes => event.addPopupReminder(minutes));
    logRows.push([new Date(), stage, event.getId(), "CREATED", `Start ${startDateTime}`]);
  });
  if (logRows.length) {
    logSheet.getRange(logSheet.getLastRow() + 1, 1, logRows.length, logRows[0].length).setValues(logRows);
  }
  ss.toast("Kalendarz zaktualizowany", "ALLEMEDIA", 5);
}

/**
 * Buduje załącznik ICS.
 */
function buildIcsAttachment(event, timezone) {
  const start = Utilities.formatDate(event.getStartTime(), timezone, "yyyyMMdd'T'HHmmss'Z'");
  const end = Utilities.formatDate(event.getEndTime(), timezone, "yyyyMMdd'T'HHmmss'Z'");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ALLEMEDIA Planner//EN",
    "BEGIN:VEVENT",
    `UID:${event.getId()}@allemedia`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.getTitle()}`,
    `DESCRIPTION:${event.getDescription()}`,
    `LOCATION:${event.getLocation()}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  return Utilities.newBlob(ics, "text/calendar", "SaveTheDate.ics");
}

/**
 * HTML wiadomości Save-the-Date.
 */
function buildSaveTheDateHtml(firstName, bride, groom, date, formLink, lang) {
  const greeting = lang === "EN" ? `Dear ${firstName || "Friend"},` : `Droga/Drogi ${firstName || "Gościu"},`;
  const text = lang === "EN"
    ? `We are thrilled to invite you to our wedding on <strong>${date}</strong>. Please RSVP via the link below.`
    : `Z radością zapraszamy Cię na nasz ślub w dniu <strong>${date}</strong>. Prosimy o RSVP przez poniższy link.`;
  const cta = lang === "EN" ? "RSVP Now" : "Potwierdź udział";
  return `<!DOCTYPE html><html><body style="font-family:Segoe UI, sans-serif;color:#4A3B35;">
    <div style="background:#F6EFEA;padding:24px;border-radius:12px;">
      <h2 style="color:#C1694F;">${bride} & ${groom}</h2>
      <p>${greeting}</p>
      <p>${text}</p>
      <p><a href="${formLink}" style="background:#C1694F;color:#fff;padding:12px 20px;border-radius:24px;text-decoration:none;">${cta}</a></p>
      <p style="font-size:12px;color:#7F675B;">Save the Date • ALLEMEDIA Planner</p>
    </div>
  </body></html>`;
}

/**
 * Wysyłka Save-the-Date.
 */
function SendSaveTheDate() {
  const ss = SpreadsheetApp.getActive();
  const setup = ss.getSheetByName(SHEET_NAMES.setup);
  const saveSheet = ss.getSheetByName(SHEET_NAMES.saveTheDate);
  const formLink = setup.getRange("E10").getValue();
  const weddingDate = setup.getRange("B2").getDisplayValue();
  const bride = setup.getRange("B1").getValue();
  const groom = setup.getRange("E1").getValue();
  const timezone = setup.getRange("B3").getValue() || Session.getScriptTimeZone();
  const calendarId = setup.getRange("E7").getValue() || CalendarApp.getDefaultCalendar().getId();
  const calendar = CalendarApp.getCalendarById(calendarId);
  const tempEvent = calendar.createAllDayEvent(`${bride} & ${groom} Wedding`, new Date(setup.getRange("B2").getValue()));
  const ics = buildIcsAttachment(tempEvent, timezone);
  tempEvent.deleteEvent();
  const lastRow = saveSheet.getLastRow();
  if (lastRow <= 1) {
    ss.toast("Brak adresatów Save-the-Date", "ALLEMEDIA", 5);
    return;
  }
  const rows = saveSheet.getRange(2, 1, lastRow - 1, 9).getValues();
  const updates = [];
  rows.forEach((row, index) => {
    const [firstName, lastName, email, phone, side, lang] = row;
    if (!email) return;
    const html = buildSaveTheDateHtml(firstName, bride, groom, weddingDate, formLink, lang);
    GmailApp.sendEmail(email, `Save the Date: ${bride} & ${groom}`, "", {
      htmlBody: html,
      attachments: [ics]
    });
    updates.push({ row: index + 2, values: ["Sent", new Date()] });
  });
  updates.forEach(update => {
    saveSheet.getRange(update.row, 8, 1, 2).setValues([update.values]);
  });
  ss.toast("Save-the-Date wysłane", "ALLEMEDIA", 5);
}

/**
 * Generowanie PDFów (timeline, seating, karty klienta).
 */
function GeneratePDFs() {
  const ss = SpreadsheetApp.getActive();
  const setup = ss.getSheetByName(SHEET_NAMES.setup);
  const folderId = setup.getRange("B7").getValue();
  const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
  const slideDeck = SlidesApp.create(`Wedding Planner PDF ${new Date().toISOString()}`);
  buildTimelineSlide(slideDeck);
  buildSeatingSlide(slideDeck);
  buildClientCardSlide(slideDeck);
  const pdf = DriveApp.getFileById(slideDeck.getId()).getAs("application/pdf");
  const pdfFile = folder.createFile(pdf).setName(`WeddingPlanner_${new Date().getTime()}.pdf`);
  const dashboard = ss.getSheetByName(SHEET_NAMES.dashboard);
  dashboard.getRange("E13").setValue(pdfFile.getUrl());
  ss.toast("PDF wygenerowany", "ALLEMEDIA", 5);
}

function buildTimelineSlide(presentation) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.insertTextBox("Timeline", 50, 30, 400, 40).getText().getTextStyle().setBold(true).setFontSize(24);
  const timelineValues = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.timeline).getRange(2, 1, 20, 6).getDisplayValues();
  const table = slide.insertTable(timelineValues.filter(row => row[0]).map(row => row.slice(0, 6)), 50, 80, 500, 300);
  table.getRow(0).getCell(0).getText().getTextStyle().setBold(true);
}

function buildSeatingSlide(presentation) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  slide.insertTextBox("Seating Plan", 50, 30, 400, 40).getText().getTextStyle().setBold(true).setFontSize(24);
  const seatingValues = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.seating).getRange(1, 1, 20, 10).getDisplayValues();
  slide.insertTable(seatingValues, 50, 80, 500, 300);
}

function buildClientCardSlide(presentation) {
  const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
  const ss = SpreadsheetApp.getActive();
  const dashboard = ss.getSheetByName(SHEET_NAMES.dashboard);
  slide.insertTextBox("Karta Klienta", 50, 30, 400, 40).getText().getTextStyle().setFontSize(26).setBold(true);
  const kpi = dashboard.getRange("A4:B11").getDisplayValues();
  slide.insertTable(kpi, 50, 80, 400, 240);
}

/**
 * Ochrona formuł.
 */
function ProtectPlanner() {
  const ss = SpreadsheetApp.getActive();
  removeProtections();
  const protectedRanges = [
    `${SHEET_NAMES.dashboard}!A4:C11`,
    `${SHEET_NAMES.budget}!A2:H200`,
    `${SHEET_NAMES.timeline}!A2:H200`,
    `${SHEET_NAMES.setup}!A1:F11`
  ];
  protectedRanges.forEach(a1 => {
    const range = ss.getRange(a1);
    const protection = range.protect();
    protection.setDescription(`Protected ${a1}`);
    protection.setWarningOnly(true);
  });
}

/**
 * Usuwa ochrony.
 */
function UnprotectPlanner() {
  removeProtections();
}

function removeProtections() {
  const ss = SpreadsheetApp.getActive();
  ss.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(protection => protection.remove());
}

/**
 * Reset struktury (czyści dane).
 */
function ResetPlanner() {
  const ss = SpreadsheetApp.getActive();
  const sheetsToReset = [
    SHEET_NAMES.saveTheDate,
    SHEET_NAMES.timeline,
    SHEET_NAMES.itinerary,
    SHEET_NAMES.packing,
    SHEET_NAMES.vendors,
    SHEET_NAMES.contacts,
    SHEET_NAMES.budget,
    SHEET_NAMES.guests,
    SHEET_NAMES.seating,
    SHEET_NAMES.gallery,
    SHEET_NAMES.gifts,
    SHEET_NAMES.honeymoon
  ];
  sheetsToReset.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
      }
    }
  });
  ss.toast("Planner wyczyszczony", "ALLEMEDIA", 5);
}

/**
 * Generowanie PDF kart seatingu.
 */
function GenerateSeatingPDFs() {
  const ss = SpreadsheetApp.getActive();
  const setup = ss.getSheetByName(SHEET_NAMES.setup);
  const folderId = setup.getRange("B7").getValue();
  const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
  const seatingSheet = ss.getSheetByName(SHEET_NAMES.seating);
  const lastRow = seatingSheet.getLastRow();
  if (lastRow <= 1) {
    ss.toast("Brak miejsc do eksportu", "ALLEMEDIA", 5);
    return;
  }
  const values = seatingSheet.getRange(2, 1, lastRow - 1, 10).getDisplayValues();
  const presentation = SlidesApp.create("Seating Cards" + new Date().getTime());
  values.forEach(row => {
    if (!row[0]) return;
    const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_ONLY);
    slide.getPlaceholder(SlidesApp.PlaceholderType.TITLE).asShape().getText().setText(row[0]);
    slide.insertTextBox(row.slice(3, 9).filter(Boolean).join("\n"), 100, 120, 400, 200);
  });
  const pdf = DriveApp.getFileById(presentation.getId()).getAs("application/pdf");
  folder.createFile(pdf).setName("SeatingCards.pdf");
  ss.toast("Seating PDFs gotowe", "ALLEMEDIA", 5);
}

/**
 * Motyw – skrót menu.
 */
function Theme() {
  ApplyTheme();
}
