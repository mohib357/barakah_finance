"use client";
// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Receipt Print Component
//
//  Spec (Website.txt):
//  • Paper: A4 canvas, but prints in 5" × 7.5" area
//  • Margins: Left 2", Right 2" (total 4"), Top 0.3"
//  • Net print area: ~5" wide × 7.5" tall
//  • Supports: Single payment, Multi-month installment breakdown
//  • Bengali digits throughout
//  • Header: Org name, address, phone, email, website
//  • Body: Payer name, ID, amount, purpose, date/time
//  • Footer: Collector name & username
// ═══════════════════════════════════════════════════════════

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { toBengaliDigits, formatMoney, formatDate } from "@/lib/utils/cn";

export interface PaymentLine {
  purpose:    string;
  amount:     number;
  month?:     string;   // e.g. "আগস্ট ২০২৬"
  note?:      string;
}

export interface ReceiptData {
  receiptNumber:  string;
  payerName:      string;
  payerId:        string;       // member ID or client ID
  payerPhone?:    string;
  lines:          PaymentLine[];
  totalAmount:    number;
  paymentMethod:  string;       // "ক্যাশ" | "বিকাশ" etc.
  collectedAt:    Date;
  collectedBy:    string;       // "Collector Name (username)"

  // Org info (from settings)
  orgName?:       string;
  orgAddress?:    string;
  orgPhone?:      string;
  orgEmail?:      string;
  orgWebsite?:    string;
  orgSlogan?:     string;

  remainingBalance?: number;    // optional: show remaining due
}

interface Props {
  data:     ReceiptData;
  trigger?: React.ReactNode; // custom trigger button
}

export function ReceiptPrint({ data, trigger }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content:     () => contentRef.current,
    documentTitle: `Receipt-${data.receiptNumber}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0.3in 2in 0.5in 2in;
      }
      @media print {
        html, body {
          width: 100%;
          height: 100%;
          font-family: 'Noto Sans Bengali', 'Noto Serif Bengali', serif;
          font-size: 11pt;
          color: #000;
          background: #fff;
        }
        .no-print { display: none !important; }
      }
    `,
  });

  const orgName    = data.orgName    ?? "বারাকাহ ফাইন্যান্স";
  const orgAddress = data.orgAddress ?? "আদিতমারী, লালমনিরহাট";
  const orgPhone   = data.orgPhone   ?? "+8801581093611";
  const orgEmail   = data.orgEmail   ?? "info@barakahfinance.com";
  const orgWebsite = data.orgWebsite ?? "barakahfinancebd.com";

  const methodLabel = PAYMENT_METHOD_BN[data.paymentMethod] ?? data.paymentMethod;

  return (
    <>
      {/* Trigger button */}
      <div className="no-print">
        {trigger ? (
          <div onClick={handlePrint} className="cursor-pointer">{trigger}</div>
        ) : (
          <button
            onClick={handlePrint}
            className="rounded-xl bg-[#0D2B1A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163a24] transition-colors flex items-center gap-2"
          >
            🖨️ রসিদ প্রিন্ট করুন
          </button>
        )}
      </div>

      {/* Print content — hidden on screen, shown in print */}
      <div className="hidden print:block">
        <div ref={contentRef} style={{ fontFamily: "'Noto Sans Bengali','Noto Serif Bengali',serif", fontSize: "11pt", color: "#000", lineHeight: 1.6 }}>

          {/* ── Organization Header ── */}
          <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "8px", marginBottom: "10px" }}>
            <div style={{ fontSize: "16pt", fontWeight: 700 }}>{orgName}</div>
            <div style={{ fontSize: "9pt" }}>
              {data.orgSlogan ?? "সুদমুক্ত লেনদেনে সমৃদ্ধি সবার"}
            </div>
            <div style={{ fontSize: "9pt", marginTop: "4px" }}>
              {orgAddress} | {orgPhone} | {orgEmail} | {orgWebsite}
            </div>
          </div>

          {/* ── Receipt title + number ── */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ fontWeight: 700, fontSize: "13pt" }}>💳 মানি রিসিট</div>
            <div style={{ fontSize: "10pt" }}>
              <span style={{ color: "#555" }}>রসিদ নং: </span>
              <strong style={{ color: "#1D9E75" }}>{data.receiptNumber}</strong>
            </div>
          </div>

          {/* ── Payer info ── */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px", fontSize: "10pt" }}>
            <tbody>
              <InfoRow label="প্রদানকারীর নাম" value={data.payerName} />
              <InfoRow label="আইডি নং"         value={data.payerId} />
              {data.payerPhone && <InfoRow label="মোবাইল" value={data.payerPhone} />}
              <InfoRow label="পেমেন্ট পদ্ধতি"  value={methodLabel} />
              <InfoRow label="তারিখ ও সময়"     value={`${formatDate(data.collectedAt)} — ${toBengaliDigits(data.collectedAt.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }))}`} />
            </tbody>
          </table>

          {/* ── Payment lines ── */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px", fontSize: "10pt" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000", fontWeight: 600 }}>
                <th style={{ textAlign: "left",  padding: "4px 0" }}>বিবরণ</th>
                {data.lines[0]?.month && <th style={{ textAlign: "center", padding: "4px 0" }}>মাস</th>}
                <th style={{ textAlign: "right", padding: "4px 0" }}>পরিমাণ</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line, i) => (
                <tr key={i} style={{ borderBottom: "1px dotted #ccc" }}>
                  <td style={{ padding: "3px 0" }}>
                    {line.purpose}
                    {line.note && <div style={{ fontSize: "8pt", color: "#555" }}>{line.note}</div>}
                  </td>
                  {line.month && <td style={{ textAlign: "center", padding: "3px 0" }}>{line.month}</td>}
                  <td style={{ textAlign: "right", padding: "3px 0", fontWeight: 600 }}>
                    {formatMoney(line.amount, false)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #000", fontWeight: 700 }}>
                <td style={{ padding: "5px 0" }} colSpan={data.lines[0]?.month ? 2 : 1}>মোট পরিশোধিত</td>
                <td style={{ textAlign: "right", padding: "5px 0", fontSize: "12pt" }}>
                  {formatMoney(data.totalAmount, false)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* ── Remaining balance (if provided) ── */}
          {data.remainingBalance !== undefined && data.remainingBalance > 0 && (
            <div style={{ textAlign: "right", fontSize: "10pt", marginBottom: "10px", color: "#c00" }}>
              অবশিষ্ট বকেয়া: <strong>{formatMoney(data.remainingBalance, false)}</strong>
            </div>
          )}

          {/* ── Collector signature area ── */}
          <div style={{ borderTop: "1px solid #aaa", marginTop: "15px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "9pt", color: "#555" }}>
            <div>
              <div style={{ marginBottom: "30px" }}>সংগ্রহকারীর স্বাক্ষর</div>
              <div>সংগ্রহ করেছেন: <strong style={{ color: "#000" }}>{data.collectedBy}</strong></div>
              <div style={{ fontSize: "8pt" }}>Collect by: {orgWebsite}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: "30px" }}>প্রদানকারীর স্বাক্ষর</div>
              <div style={{ fontSize: "8pt" }}>Barakah Finance — সুদমুক্ত লেনদেন</div>
            </div>
          </div>

          {/* ── QR-like placeholder (Phase 2+) ── */}
          <div style={{ textAlign: "center", marginTop: "10px", fontSize: "8pt", color: "#aaa" }}>
            এই রসিদটি বৈধ প্রমাণ হিসেবে সংরক্ষণ করুন।
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper: Info row for payer table
// ─────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ width: "45%", color: "#444", padding: "2px 0" }}>{label}:</td>
      <td style={{ fontWeight: 500, padding: "2px 0" }}>{value}</td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// Payment method Bengali labels
// ─────────────────────────────────────────────────────────────

const PAYMENT_METHOD_BN: Record<string, string> = {
  CASH:          "ক্যাশ",
  BKASH:         "বিকাশ",
  NAGAD:         "নগদ",
  ROCKET:        "রকেট",
  BANK_TRANSFER: "ব্যাংক ট্রান্সফার",
  CARD:          "কার্ড",
  OTHER:         "অন্যান্য",
};
