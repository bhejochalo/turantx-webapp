import jsPDF from "jspdf";
import logo from "../assets/turantx-logo.png"; // 👈 same logo used in app

export const generateInvoicePDF = (data) => {
  const pdf = new jsPDF();

  /* ======================
     LOGO
  ====================== */
/* ======================
   LOGO (NO STRETCH)
====================== */
const logoWidth = 48; // control size here
const logoHeight = (logoWidth * 1); // maintains aspect ratio

pdf.addImage(
  logo,
  "PNG",
  (210 - logoWidth) / 2, // center horizontally (A4 width = 210)
  2,
  logoWidth,
  logoHeight
);


  /* ======================
     HEADER
  ====================== */
  pdf.setFontSize(18);
  pdf.setTextColor("#ff914d");
  pdf.text("INVOICE", 105, 40 + 6, { align: "center" });
  pdf.line(20, 44 + 6, 190, 44 + 6);
  

  pdf.setDrawColor("#ff914d");
  pdf.line(20, 44 + 6, 190, 44 + 6);

  /* ======================
     META
  ====================== */
  pdf.setFontSize(11);
  pdf.setTextColor("#333");

  pdf.text(`Invoice ID`, 20, 55);
  pdf.text(`TX-${data.requestId}`, 80, 55);

  pdf.text(`Invoice Date`, 20, 62);
  pdf.text(
    new Date(data.createdAt).toLocaleString(),
    80,
    62
  );

  pdf.text(`Customer Phone`, 20, 69);
  pdf.text(data.phone, 80, 69);

  /* ======================
     SECTION: DELIVERY DETAILS
  ====================== */
  pdf.setFontSize(13);
  pdf.setTextColor("#ff914d");
  pdf.text("Delivery Details", 20, 82);

  pdf.setDrawColor("#ddd");
  pdf.line(20, 85, 190, 85);

  pdf.setFontSize(11);
  pdf.setTextColor("#333");

  pdf.text("Route", 20, 95);
  pdf.text(`${data.fromCity} → ${data.toCity}`, 80, 95);

  pdf.text("Item", 20, 102);
  pdf.text(data.item || "-", 80, 102);

  pdf.text("Weight", 20, 109);
  pdf.text(data.weight || "-", 80, 109);

  pdf.text("Delivery Type", 20, 116);
  pdf.text(data.delivery || "-", 80, 116);

  /* ======================
     SECTION: PAYMENT
  ====================== */
  pdf.setFontSize(13);
  pdf.setTextColor("#ff914d");
  pdf.text("Payment Summary", 20, 132);

  pdf.line(20, 135, 190, 135);

  pdf.setFontSize(11);
  pdf.setTextColor("#333");

  pdf.text("Amount Paid", 20, 145);
  pdf.text(`₹ ${data.amount}`, 80, 145);

  pdf.text("Payment ID", 20, 152);
  pdf.text(data.paymentId || "-", 80, 152);

  /* ======================
     FOOTER
  ====================== */
  pdf.setFontSize(9);
  pdf.setTextColor("#666");

  pdf.text(
    "This is a system-generated invoice issued by TurantX Solutions Pvt. Ltd.",
    105,
    175,
    { align: "center" }
  );

  pdf.text(
    "For support, contact support@turantx.com",
    105,
    182,
    { align: "center" }
  );

  pdf.save(`TurantX_Invoice_TX-${data.requestId}.pdf`);
};
