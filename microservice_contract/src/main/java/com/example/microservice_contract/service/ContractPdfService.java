package com.example.microservice_contract.service;

import com.example.microservice_contract.entity.Contract;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
@Slf4j
public class ContractPdfService {

    @Value("${jwt.secret}")
    private String secret;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");

    // ── Public entry point ────────────────────────────────────────────────────

    public byte[] generateContractPdf(Contract contract) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter   writer   = new PdfWriter(baos);
            PdfDocument pdfDoc   = new PdfDocument(writer);
            Document    document = new Document(pdfDoc, PageSize.A4);
            document.setMargins(60, 60, 60, 60);

            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            String verificationCode = buildVerificationCode(contract);

            // ── Header ──────────────────────────────────────────────────────
            document.add(new Paragraph("PROLANCE — FREELANCE CONTRACT")
                    .setFont(bold).setFontSize(18)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(4));

            document.add(new Paragraph("Contract #" + contract.getId())
                    .setFont(regular).setFontSize(11)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.DARK_GRAY)
                    .setMarginBottom(2));

            document.add(new Paragraph("Verification Code: " + verificationCode)
                    .setFont(bold).setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY)
                    .setMarginBottom(20));

            // ── Parties table ────────────────────────────────────────────────
            document.add(new Paragraph("PARTIES").setFont(bold).setFontSize(12).setMarginBottom(6));

            Table partiesTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .setWidth(UnitValue.createPercentValue(100));
            partiesTable.addCell(styledCell("Client ID: " + contract.getClientId(), bold));
            partiesTable.addCell(styledCell("Freelancer ID: " + contract.getFreelancerId(), bold));
            document.add(partiesTable);
            document.add(new Paragraph("\n"));

            // ── Contract details table ───────────────────────────────────────
            document.add(new Paragraph("CONTRACT DETAILS").setFont(bold).setFontSize(12).setMarginBottom(6));

            Table detailsTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .setWidth(UnitValue.createPercentValue(100));

            addRow(detailsTable, "Project ID",        String.valueOf(contract.getProjectId()), regular);
            addRow(detailsTable, "Proposal ID",       String.valueOf(contract.getProposalId()), regular);
            addRow(detailsTable, "Amount",            "$" + contract.getAmount(), regular);
            addRow(detailsTable, "Platform Fee",      contract.getPlatformFeePercentage() + "%", regular);
            addRow(detailsTable, "Payment Structure", contract.getPaymentStructure() != null
                    ? contract.getPaymentStructure().name() : "—", regular);
            addRow(detailsTable, "Status",            contract.getStatus() != null
                    ? contract.getStatus().name() : "—", regular);
            addRow(detailsTable, "Start Date",        contract.getStartDate() != null
                    ? contract.getStartDate().format(FMT) : "—", regular);
            addRow(detailsTable, "End Date",          contract.getEndDate() != null
                    ? contract.getEndDate().format(FMT) : "—", regular);
            addRow(detailsTable, "Created At",        contract.getCreatedAt() != null
                    ? contract.getCreatedAt().format(FMT) : "—", regular);

            document.add(detailsTable);
            document.add(new Paragraph("\n"));

            // ── Signatures section ───────────────────────────────────────────
            if (contract.getSignatures() != null && !contract.getSignatures().isEmpty()) {
                document.add(new Paragraph("SIGNATURES").setFont(bold).setFontSize(12).setMarginBottom(6));

                contract.getSignatures().forEach(sig -> {
                    String sigText = String.format(
                            "%s (%s) — %s — Signed: %s",
                            sig.getSignerName(),
                            sig.getSignerRole(),
                            sig.getSignerEmail(),
                            sig.getSignedAt() != null ? sig.getSignedAt().format(FMT) : "PENDING"
                    );
                    try {
                        document.add(new Paragraph(sigText)
                                .setFont(regular).setFontSize(10).setMarginBottom(4));
                    } catch (Exception ignored) {}
                });

                document.add(new Paragraph("\n"));
            }

            // ── Legal notice ─────────────────────────────────────────────────
            document.add(new Paragraph(
                    "This document is legally binding upon digital signature by both parties. " +
                            "To verify the authenticity of this contract, visit prolance.com/verify and " +
                            "enter the Verification Code shown above.")
                    .setFont(regular).setFontSize(8)
                    .setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(20));

            document.close();

            // ── Apply diagonal watermark ─────────────────────────────────────
            return addWatermark(baos.toByteArray(), contract, verificationCode);

        } catch (Exception e) {
            log.error("PDF generation failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate contract PDF", e);
        }
    }

    // ── Watermark ─────────────────────────────────────────────────────────────

    private byte[] addWatermark(byte[] pdfBytes, Contract contract, String verificationCode) {
        try {
            // Re-open the generated PDF to stamp watermark
            ByteArrayOutputStream baos = new ByteArrayOutputStream();

            com.itextpdf.kernel.pdf.PdfReader reader =
                    new com.itextpdf.kernel.pdf.PdfReader(
                            new java.io.ByteArrayInputStream(pdfBytes));

            PdfDocument pdfDoc = new PdfDocument(reader, new PdfWriter(baos));
            PdfFont font = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);

            String watermarkText = contract.getStatus() != null &&
                    contract.getStatus().name().equals("ACTIVE")
                    ? "PROLANCE VERIFIED"
                    : "PENDING SIGNATURES";

            for (int i = 1; i <= pdfDoc.getNumberOfPages(); i++) {
                PdfPage   page   = pdfDoc.getPage(i);
                Rectangle size   = page.getPageSizeWithRotation();
                PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdfDoc);

                canvas.saveState();

                // Semi-transparent diagonal text across the page
                canvas.setExtGState(buildTransparencyState(pdfDoc, 0.08f));
                canvas.beginText();
                canvas.setFontAndSize(font, 52);
                canvas.setFillColor(ColorConstants.BLUE);

                // Rotate 45° around page centre
                float x = size.getWidth()  / 2;
                float y = size.getHeight() / 2;
                canvas.setTextMatrix(
                        (float) Math.cos(Math.toRadians(45)),
                        (float) Math.sin(Math.toRadians(45)),
                        -(float) Math.sin(Math.toRadians(45)),
                        (float) Math.cos(Math.toRadians(45)),
                        x - 120, y - 30
                );
                canvas.showText(watermarkText);
                canvas.endText();

                // Small verification code stamp at bottom
                canvas.beginText();
                canvas.setFontAndSize(font, 7);
                canvas.setFillColor(ColorConstants.GRAY);
                canvas.setExtGState(buildTransparencyState(pdfDoc, 0.4f));
                canvas.moveText(40, 20);
                canvas.showText("PROLANCE CONTRACT #" + contract.getId()
                        + " | VERIFY: " + verificationCode);
                canvas.endText();

                canvas.restoreState();
            }

            pdfDoc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Watermark failed: {}", e.getMessage(), e);
            return pdfBytes; // return un-watermarked PDF rather than failing
        }
    }

    // ── Verification code ─────────────────────────────────────────────────────
    // SHA-256( contractId + createdAt + secret ) → first 12 chars uppercase
    // Fraud check: anyone with the PDF can go to prolance.com/verify and submit
    // the code; the backend re-computes it and confirms it matches.

    public String buildVerificationCode(Contract contract) {
        try {
            String raw = contract.getId()
                    + "|" + (contract.getCreatedAt() != null ? contract.getCreatedAt() : "")
                    + "|" + secret;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(hash)
                    .substring(0, 12)
                    .toUpperCase();
        } catch (Exception e) {
            return "VERIFY-ERR";
        }
    }

    // ── iText helpers ─────────────────────────────────────────────────────────

    private com.itextpdf.kernel.pdf.extgstate.PdfExtGState buildTransparencyState(
            PdfDocument doc, float opacity) {
        com.itextpdf.kernel.pdf.extgstate.PdfExtGState gs =
                new com.itextpdf.kernel.pdf.extgstate.PdfExtGState();
        gs.setFillOpacity(opacity);
        return gs;
    }

    private Cell styledCell(String text, PdfFont font) {
        try {
            return new Cell().add(new Paragraph(text).setFont(font).setFontSize(10))
                    .setBorder(new com.itextpdf.layout.borders.SolidBorder(0.5f))
                    .setPadding(6);
        } catch (Exception e) {
            return new Cell().add(new Paragraph(text));
        }
    }

    private void addRow(Table table, String label, String value, PdfFont font) {
        try {
            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            table.addCell(new Cell().add(new Paragraph(label).setFont(bold).setFontSize(10))
                    .setBorder(new com.itextpdf.layout.borders.SolidBorder(0.5f)).setPadding(5));
            table.addCell(new Cell().add(new Paragraph(value).setFont(font).setFontSize(10))
                    .setBorder(new com.itextpdf.layout.borders.SolidBorder(0.5f)).setPadding(5));
        } catch (Exception ignored) {}
    }
}