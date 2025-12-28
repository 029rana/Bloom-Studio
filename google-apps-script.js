/*********************************
 * CONFIG
 *********************************/
const SHEET_NAME = 'Bookings';
const TZ = Session.getScriptTimeZone();

/*********************************
 * HELPERS
 *********************************/
function normalizeDate(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, TZ, 'yyyy-MM-dd');
  }
  return String(value).trim();
}

function normalizeTime(value) {
  return String(value)
    .replace(/\s+/g, ' ')
    .replace('–', '-')
    .trim();
}

function json(status, message, data = null) {
  return ContentService
    .createTextOutput(JSON.stringify({ status, message, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

/*********************************
 * EMAIL SENDER (AMAN)
 *********************************/
function sendBookingEmail(email, name, bookingCode, date, time, paket) {
  if (!email) return;

  const subject = 'Konfirmasi Booking – Bloom Studio';
  const body = `
Halo ${name || 'Pelanggan'} 👋

Terima kasih telah melakukan booking di Bloom Studio ✨

Detail booking Anda:
━━━━━━━━━━━━━━━━━━
📌 ID Booking : ${bookingCode}
📦 Paket      : ${paket}
📅 Tanggal    : ${date}
⏰ Waktu      : ${time}
━━━━━━━━━━━━━━━━━━

Simpan ID Booking ini untuk pengecekan status booking.

Salam,
Bloom Studio
`;

  MailApp.sendEmail(email, subject, body);
}

/*********************************
 * POST - SIMPAN BOOKING
 *********************************/
function doPost(e) {
  try {
    const data = e.parameter;

    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);

    if (!sheet) {
      return json('error', 'Sheet "Bookings" tidak ditemukan');
    }

    const bookingDate = normalizeDate(data.date);
    const bookingTime = normalizeTime(data.time);

    // ===== ANTI DOUBLE BOOKING =====
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const rowDate = normalizeDate(rows[i][6]);
      const rowTime = normalizeTime(rows[i][7]);

      if (rowDate === bookingDate && rowTime === bookingTime) {
        return json('error', 'Jam ini sudah dibooking, silakan pilih jam lain');
      }
    }

    // ===== SIMPAN DATA (STRUKTUR TETAP) =====
    const row = [
      new Date(),                         // 0 Timestamp
      data.name || '',                    // 1 Nama
      data.email || '',                   // 2 Email
      data.phone || '',                   // 3 Telepon
      data.package || '',                 // 4 Paket
      data.people || '',                  // 5 Jumlah Orang (label)
      bookingDate,                        // 6 Tanggal
      bookingTime,                        // 7 Waktu
      data.concept || '',                 // 8 Konsep
      data.background || '',              // 9 Background
      data.message || '',                 // 10 Pesan
      data.bookingCode || '',             // 11 ID Booking
      Number(data.packagePrice) || 0,     // 12 Harga Paket (base)
      data.paymentType || '',             // 13 Tipe Pembayaran
      Number(data.paymentAmount) || 0,    // 14 Jumlah Bayar (DP/lunas)
      data.paymentMethod || '',           // 15 Metode Bayar
      data.status || 'Menunggu Konfirmasi', // 16 Status
      Number(data.extraPeople) || 0,      // 17 Extra Orang (>2)
      Number(data.extraPeopleFee) || 0,   // 18 Biaya Tambahan
      Number(data.totalPrice) || (Number(data.packagePrice) || 0) // 19 Total Harga
    ];

    sheet.appendRow(row);

    // ===== KIRIM EMAIL (SETELAH DATA MASUK) =====
    sendBookingEmail(
      data.email,
      data.name,
      data.bookingCode,
      bookingDate,
      bookingTime,
      data.package
    );

    return json('success', 'Booking berhasil disimpan');

  } catch (err) {
    return json('error', err.toString());
  }
}

/*********************************
 * GET - BOOKED SLOTS & CEK STATUS
 *********************************/
function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);

    if (!sheet) {
      return json('error', 'Sheet "Bookings" tidak ditemukan');
    }

    const rows = sheet.getDataRange().getValues();

    // ===== GET BOOKED SLOTS =====
    if (action === 'getBookedSlots') {
      const date = normalizeDate(e.parameter.date);
      const bookedSlots = [];

      for (let i = 1; i < rows.length; i++) {
        const rowDate = normalizeDate(rows[i][6]);
        const rowTime = normalizeTime(rows[i][7]);

        if (rowDate === date && rowTime) {
          bookedSlots.push(rowTime);
        }
      }

      return json('success', 'Booked slots retrieved', { bookedSlots });
    }

    // ===== CEK STATUS BY ID BOOKING =====
    const code = e.parameter.code;
    if (!code) return json('error', 'Kode booking kosong');

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][11] === code) {
        return json('found', 'Booking ditemukan', {
          timestamp: rows[i][0],
          nama: rows[i][1],
          email: rows[i][2],
          telepon: rows[i][3],
          paket: rows[i][4],
          jumlahOrang: rows[i][5],
          tanggal: rows[i][6],
          waktu: rows[i][7],
          konsep: rows[i][8],
          background: rows[i][9],
          pesan: rows[i][10],
          kodeBooking: rows[i][11],
          hargaPaket: rows[i][12],
          tipePembayaran: rows[i][13],
          jumlahBayar: rows[i][14],
          metodeBayar: rows[i][15],
          status: rows[i][16],
          extraOrang: rows[i][17] || 0,
          biayaTambahan: rows[i][18] || 0,
          totalHarga: rows[i][19] || rows[i][12] || 0
        });
      }
    }

    return json('not_found', 'Booking tidak ditemukan');

  } catch (err) {
    return json('error', err.toString());
  }
}