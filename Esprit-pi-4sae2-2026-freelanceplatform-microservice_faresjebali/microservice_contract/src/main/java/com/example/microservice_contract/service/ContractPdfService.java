package com.example.microservice_contract.service;

import com.example.microservice_contract.entity.Contract;
import com.example.microservice_contract.entity.ContractSignature;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
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

    private static final DateTimeFormatter FMT       = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");
    private static final DeviceRgb         BRAND     = new DeviceRgb(37,  99,  235);
    private static final DeviceRgb         BRAND_BG  = new DeviceRgb(239, 246, 255);
    private static final DeviceRgb         HEADER_BG = new DeviceRgb(30,  64,  175);
    private static final DeviceRgb         GRAY_BG   = new DeviceRgb(248, 250, 252);
    private static final DeviceRgb         BORDER    = new DeviceRgb(203, 213, 225);
    private static final DeviceRgb         TEXT_DARK = new DeviceRgb(15,  23,  42);
    private static final DeviceRgb         TEXT_MID  = new DeviceRgb(71,  85,  105);

    // ── Public entry point ─────────────────────────────────────────────────────

    public byte[] generateContractPdf(Contract contract) {
        try {
            ByteArrayOutputStream baos     = new ByteArrayOutputStream();
            PdfWriter             writer   = new PdfWriter(baos);
            PdfDocument           pdfDoc   = new PdfDocument(writer);
            Document              document = new Document(pdfDoc, PageSize.A4);
            document.setMargins(50, 50, 60, 50);

            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont italic  = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

            String verificationCode = buildVerificationCode(contract);

            // ══════════════════════════════════════════════════════════════════
            // HEADER BANNER
            // ══════════════════════════════════════════════════════════════════
            Table header = new Table(UnitValue.createPercentArray(new float[]{1}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(20);

            Cell headerCell = new Cell()
                    .setBackgroundColor(HEADER_BG)
                    .setPadding(20)
                    .setBorder(new SolidBorder(BRAND, 0));

            headerCell.add(new Paragraph("PROLANCE")
                    .setFont(bold).setFontSize(22).setFontColor(ColorConstants.WHITE)
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(2));
            headerCell.add(new Paragraph("FREELANCE CONTRACT")
                    .setFont(regular).setFontSize(11).setFontColor(new DeviceRgb(186, 230, 253))
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(8));
            headerCell.add(new Paragraph("Contract #" + contract.getId())
                    .setFont(bold).setFontSize(13).setFontColor(ColorConstants.WHITE)
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(4));
            headerCell.add(new Paragraph("Verification Code: " + verificationCode)
                    .setFont(regular).setFontSize(8).setFontColor(new DeviceRgb(186, 230, 253))
                    .setTextAlignment(TextAlignment.CENTER));

            header.addCell(headerCell);
            document.add(header);

            // ══════════════════════════════════════════════════════════════════
            // STATUS BADGE ROW
            // ══════════════════════════════════════════════════════════════════
            String statusName = contract.getStatus() != null ? contract.getStatus().name() : "UNKNOWN";
            DeviceRgb statusColor = "ACTIVE".equals(statusName)
                    ? new DeviceRgb(22,  163, 74)
                    : "COMPLETED".equals(statusName)
                    ? new DeviceRgb(37,  99,  235)
                    : new DeviceRgb(202, 138, 4);

            Table statusRow = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(18);

            Cell statusBadge = new Cell()
                    .setBorder(new SolidBorder(statusColor, 1))
                    .setBackgroundColor(new DeviceRgb(240, 253, 244))
                    .setPadding(8);
            statusBadge.add(new Paragraph("Status")
                    .setFont(regular).setFontSize(8).setFontColor(TEXT_MID).setMarginBottom(2));
            statusBadge.add(new Paragraph(statusName)
                    .setFont(bold).setFontSize(13).setFontColor(statusColor));
            statusRow.addCell(statusBadge);

            Cell createdBadge = new Cell()
                    .setBorder(new SolidBorder(BORDER, 0.5f))
                    .setBackgroundColor(GRAY_BG)
                    .setPadding(8);
            createdBadge.add(new Paragraph("Created At")
                    .setFont(regular).setFontSize(8).setFontColor(TEXT_MID).setMarginBottom(2));
            createdBadge.add(new Paragraph(contract.getCreatedAt() != null
                    ? contract.getCreatedAt().format(FMT) : "—")
                    .setFont(bold).setFontSize(11).setFontColor(TEXT_DARK));
            statusRow.addCell(createdBadge);

            document.add(statusRow);

            // ══════════════════════════════════════════════════════════════════
            // SECTION 1 — PARTIES
            // ══════════════════════════════════════════════════════════════════
            document.add(sectionTitle("1. PARTIES", bold));

            Table parties = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .setWidth(UnitValue.createPercentValue(100)).setMarginBottom(16);

            parties.addCell(partyCard("Client", contract.getClientId(),
                    getSignerName(contract, "CLIENT"),
                    getSignerEmail(contract, "CLIENT"), bold, regular));
            parties.addCell(partyCard("Freelancer", contract.getFreelancerId(),
                    getSignerName(contract, "FREELANCER"),
                    getSignerEmail(contract, "FREELANCER"), bold, regular));

            document.add(parties);

            // ══════════════════════════════════════════════════════════════════
            // SECTION 2 — PROJECT & PROPOSAL
            // ══════════════════════════════════════════════════════════════════
            document.add(sectionTitle("2. PROJECT & PROPOSAL", bold));

            Table projectTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                    .setWidth(UnitValue.createPercentValue(100)).setMarginBottom(16);

            addCard(projectTable, "Project ID",   String.valueOf(contract.getProjectId()),  bold, regular);
            addCard(projectTable, "Proposal ID",  String.valueOf(contract.getProposalId()), bold, regular);
            addCard(projectTable, "Start Date",
                    contract.getStartDate() != null ? contract.getStartDate().format(FMT) : "—",
                    bold, regular);
            addCard(projectTable, "Deadline",
                    contract.getEndDate() != null ? contract.getEndDate().format(FMT) : "—",
                    bold, regular);

            document.add(projectTable);

            // ══════════════════════════════════════════════════════════════════
            // SECTION 3 — FINANCIAL DETAILS
            // ══════════════════════════════════════════════════════════════════
            document.add(sectionTitle("3. FINANCIAL DETAILS", bold));

            Table finTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                    .setWidth(UnitValue.createPercentValue(100)).setMarginBottom(16);

            String amountStr     = contract.getAmount() != null ? "$" + contract.getAmount() : "—";
            String amountPaidStr = contract.getAmountPaid() != null ? "$" + contract.getAmountPaid() : "$0.00";
            String feeStr        = contract.getPlatformFeePercentage() != null
                    ? contract.getPlatformFeePercentage() + "%" : "—";
            String paymentStr    = contract.getPaymentStructure() != null
                    ? contract.getPaymentStructure().name() : "—";

            String netStr = "—";
            if (contract.getAmount() != null && contract.getPlatformFeePercentage() != null) {
                java.math.BigDecimal fee = contract.getAmount()
                        .multiply(contract.getPlatformFeePercentage())
                        .divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                netStr = "$" + contract.getAmount().subtract(fee)
                        .setScale(2, java.math.RoundingMode.HALF_UP);
            }

            addCard(finTable, "Contract Amount",    amountStr,     bold, regular);
            addCard(finTable, "Amount Paid",         amountPaidStr, bold, regular);
            addCard(finTable, "Platform Fee",        feeStr,        bold, regular);
            addCard(finTable, "Freelancer Receives", netStr,        bold, regular);

            document.add(finTable);

            Table payRow = new Table(UnitValue.createPercentArray(new float[]{1}))
                    .setWidth(UnitValue.createPercentValue(100)).setMarginBottom(16);
            Cell payCell = new Cell()
                    .setBackgroundColor(BRAND_BG)
                    .setBorder(new SolidBorder(BRAND, 0.5f))
                    .setPadding(10);
            payCell.add(new Paragraph("Payment Structure")
                    .setFont(bold).setFontSize(8).setFontColor(BRAND).setMarginBottom(2));
            payCell.add(new Paragraph(paymentStr)
                    .setFont(bold).setFontSize(12).setFontColor(TEXT_DARK));
            payRow.addCell(payCell);
            document.add(payRow);

            // ══════════════════════════════════════════════════════════════════
            // SECTION 4 — LINKED RECORDS (optional)
            // ══════════════════════════════════════════════════════════════════
            if (contract.getDisputeId() != null || contract.getMilestoneId() != null
                    || contract.getTransactionId() != null) {

                document.add(sectionTitle("4. LINKED RECORDS", bold));
                Table linkedTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                        .setWidth(UnitValue.createPercentValue(100)).setMarginBottom(16);

                addCard(linkedTable, "Dispute ID",
                        contract.getDisputeId() != null ? String.valueOf(contract.getDisputeId()) : "None",
                        bold, regular);
                addCard(linkedTable, "Milestone ID",
                        contract.getMilestoneId() != null ? String.valueOf(contract.getMilestoneId()) : "None",
                        bold, regular);
                addCard(linkedTable, "Transaction ID",
                        contract.getTransactionId() != null ? String.valueOf(contract.getTransactionId()) : "None",
                        bold, regular);
                document.add(linkedTable);
            }

            // ══════════════════════════════════════════════════════════════════
            // SECTION — SIGNATURES
            // ══════════════════════════════════════════════════════════════════
            int sigSection = (contract.getDisputeId() != null || contract.getMilestoneId() != null
                    || contract.getTransactionId() != null) ? 5 : 4;
            document.add(sectionTitle(sigSection + ". SIGNATURES", bold));

            if (contract.getSignatures() != null && !contract.getSignatures().isEmpty()) {
                for (ContractSignature sig : contract.getSignatures()) {
                    document.add(signatureBlock(sig, bold, regular, italic));
                }
            } else {
                document.add(new Paragraph("No signature records found.")
                        .setFont(italic).setFontSize(10).setFontColor(TEXT_MID).setMarginBottom(12));
            }

            // ══════════════════════════════════════════════════════════════════
            // LEGAL NOTICE
            // ══════════════════════════════════════════════════════════════════
            Table legal = new Table(UnitValue.createPercentArray(new float[]{1}))
                    .setWidth(UnitValue.createPercentValue(100)).setMarginTop(10);
            Cell legalCell = new Cell()
                    .setBackgroundColor(GRAY_BG)
                    .setBorder(new SolidBorder(BORDER, 0.5f))
                    .setPadding(12);
            legalCell.add(new Paragraph(
                    "This document is legally binding upon digital signature by both parties. " +
                            "To verify authenticity, visit prolance.com/verify and enter Verification Code: " +
                            verificationCode + ". Any alteration of this document after signing is a criminal offence.")
                    .setFont(italic).setFontSize(8).setFontColor(TEXT_MID)
                    .setTextAlignment(TextAlignment.CENTER));
            legal.addCell(legalCell);
            document.add(legal);

            document.close();

            return addWatermark(baos.toByteArray(), contract, verificationCode);

        } catch (Exception e) {
            log.error("PDF generation failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate contract PDF", e);
        }
    }

    // ── Section title ──────────────────────────────────────────────────────────

    private Paragraph sectionTitle(String text, PdfFont bold) {
        return new Paragraph(text)
                .setFont(bold).setFontSize(10)
                .setFontColor(BRAND)
                .setMarginBottom(8)
                .setMarginTop(4)
                .setBorderBottom(new SolidBorder(BRAND, 1.5f))
                .setPaddingBottom(4);
    }

    // ── Card cell ──────────────────────────────────────────────────────────────

    private void addCard(Table table, String label, String value, PdfFont bold, PdfFont regular) {
        try {
            Cell cell = new Cell()
                    .setBackgroundColor(GRAY_BG)
                    .setBorder(new SolidBorder(BORDER, 0.5f))
                    .setPadding(10);
            cell.add(new Paragraph(label)
                    .setFont(regular).setFontSize(8).setFontColor(TEXT_MID).setMarginBottom(3));
            cell.add(new Paragraph(value)
                    .setFont(bold).setFontSize(11).setFontColor(TEXT_DARK));
            table.addCell(cell);
        } catch (Exception ignored) {}
    }

    // ── Party card ─────────────────────────────────────────────────────────────

    private Cell partyCard(String role, Long id, String name, String email,
                           PdfFont bold, PdfFont regular) {
        Cell cell = new Cell()
                .setBackgroundColor(BRAND_BG)
                .setBorder(new SolidBorder(BRAND, 0.8f))
                .setPadding(12);
        try {
            cell.add(new Paragraph(role.toUpperCase())
                    .setFont(bold).setFontSize(8).setFontColor(BRAND).setMarginBottom(4));
            cell.add(new Paragraph(name != null ? name : role + " " + id)
                    .setFont(bold).setFontSize(12).setFontColor(TEXT_DARK).setMarginBottom(2));
            cell.add(new Paragraph("ID: " + id)
                    .setFont(regular).setFontSize(9).setFontColor(TEXT_MID).setMarginBottom(2));
            if (email != null) {
                cell.add(new Paragraph(email)
                        .setFont(regular).setFontSize(9).setFontColor(TEXT_MID));
            }
        } catch (Exception ignored) {}
        return cell;
    }

    // ── Signature block ────────────────────────────────────────────────────────

    private Table signatureBlock(ContractSignature sig, PdfFont bold, PdfFont regular, PdfFont italic) {
        boolean   signed     = sig.isSigned();
        DeviceRgb blockColor = signed ? new DeviceRgb(22, 163, 74) : new DeviceRgb(202, 138, 4);
        DeviceRgb blockBg    = signed ? new DeviceRgb(240, 253, 244) : new DeviceRgb(254, 252, 232);

        Table block = new Table(UnitValue.createPercentArray(new float[]{1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(12);

        Cell cell = new Cell()
                .setBackgroundColor(blockBg)
                .setBorder(new SolidBorder(blockColor, 1f))
                .setPadding(12);

        // Role + status header
        cell.add(new Paragraph(sig.getSignerRole() + " — " + (signed ? "✔ SIGNED" : "⏳ PENDING"))
                .setFont(bold).setFontSize(10).setFontColor(blockColor).setMarginBottom(6));

        // Details row
        Table inner = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
                .setWidth(UnitValue.createPercentValue(100)).setMarginBottom(4);

        addInnerCell(inner, "Name",
                sig.getSignerName() != null ? sig.getSignerName() : "—", bold, regular);
        addInnerCell(inner, "Email",
                sig.getSignerEmail() != null ? sig.getSignerEmail() : "—", bold, regular);
        addInnerCell(inner, "Signed At",
                sig.getSignedAt() != null ? sig.getSignedAt().format(FMT) : "Not yet signed",
                bold, regular);

        cell.add(inner);

        // IP + key fingerprint
        if (sig.getIpAddress() != null || sig.getKeyFingerprint() != null) {
            Table auditRow = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .setWidth(UnitValue.createPercentValue(100)).setMarginTop(4);
            addInnerCell(auditRow, "IP Address",
                    sig.getIpAddress() != null ? sig.getIpAddress() : "—", bold, regular);
            addInnerCell(auditRow, "Key Fingerprint",
                    sig.getKeyFingerprint() != null
                            ? sig.getKeyFingerprint().substring(
                            0, Math.min(20, sig.getKeyFingerprint().length())) + "…"
                            : "—", bold, regular);
            cell.add(auditRow);
        }

        // ── Drawn signature image ──────────────────────────────────────────────
        if (sig.getSignatureData() != null && !sig.getSignatureData().isBlank()) {
            try {
                byte[] imgBytes = Base64.getDecoder().decode(sig.getSignatureData().trim());

                cell.add(new Paragraph("Drawn Signature")
                        .setFont(regular).setFontSize(7).setFontColor(TEXT_MID)
                        .setMarginTop(8).setMarginBottom(4));

                Table sigFrame = new Table(UnitValue.createPercentArray(new float[]{1}))
                        .setWidth(UnitValue.createPercentValue(60))
                        .setMarginBottom(4);
                Cell frameCell = new Cell()
                        .setBackgroundColor(ColorConstants.WHITE)
                        .setBorder(new SolidBorder(BORDER, 1f))
                        .setPadding(6);

                Image sigImg = new Image(ImageDataFactory.create(imgBytes))
                        .setMaxWidth(UnitValue.createPercentValue(100))
                        .setMaxHeight(60)
                        .setHorizontalAlignment(HorizontalAlignment.LEFT);
                frameCell.add(sigImg);
                sigFrame.addCell(frameCell);
                cell.add(sigFrame);

            } catch (Exception e) {
                log.warn("Could not embed signature image for signer {}: {}",
                        sig.getSignerEmail(), e.getMessage());
                cell.add(new Paragraph("[Signature image could not be rendered]")
                        .setFont(italic).setFontSize(8).setFontColor(TEXT_MID).setMarginTop(6));
            }
        }

        // ── Numeric signature code (displayed directly under the image) ────────
        if (sig.getNumericSignature() != null) {
            // Format as XXXX - XXXX - XXXX
            String raw       = String.format("%012d", sig.getNumericSignature());
            String formatted = raw.substring(0, 4) + " - "
                    + raw.substring(4, 8) + " - "
                    + raw.substring(8, 12);

            Table numFrame = new Table(UnitValue.createPercentArray(new float[]{1}))
                    .setWidth(UnitValue.createPercentValue(60))
                    .setMarginTop(6)
                    .setMarginBottom(4);

            Cell numCell = new Cell()
                    .setBackgroundColor(GRAY_BG)
                    .setBorder(new SolidBorder(BORDER, 1f))
                    .setPadding(8);

            numCell.add(new Paragraph("Numeric Signature Code")
                    .setFont(regular).setFontSize(7).setFontColor(TEXT_MID)
                    .setMarginBottom(3));
            numCell.add(new Paragraph(formatted)
                    .setFont(bold).setFontSize(14).setFontColor(TEXT_DARK)
                    .setTextAlignment(TextAlignment.CENTER));
            numCell.add(new Paragraph(
                    "Reference this code in all legal correspondence relating to this signing event.")
                    .setFont(italic).setFontSize(7).setFontColor(TEXT_MID)
                    .setMarginTop(3).setTextAlignment(TextAlignment.CENTER));

            numFrame.addCell(numCell);
            cell.add(numFrame);
        }

        // ── Crypto notice ──────────────────────────────────────────────────────
        if (sig.getCryptoSignature() != null) {
            cell.add(new Paragraph(
                    "🔐 Cryptographic RSA-2048 signature attached — independently verifiable.")
                    .setFont(italic).setFontSize(8).setFontColor(TEXT_MID).setMarginTop(6));
        }

        block.addCell(cell);
        return block;
    }

    private void addInnerCell(Table table, String label, String value,
                              PdfFont bold, PdfFont regular) {
        try {
            Cell cell = new Cell()
                    .setBorder(new SolidBorder(BORDER, 0f))
                    .setPaddingTop(2).setPaddingBottom(2);
            cell.add(new Paragraph(label)
                    .setFont(regular).setFontSize(7).setFontColor(TEXT_MID).setMarginBottom(1));
            cell.add(new Paragraph(value)
                    .setFont(bold).setFontSize(9).setFontColor(TEXT_DARK));
            table.addCell(cell);
        } catch (Exception ignored) {}
    }

    // ── Signer name / email helpers ────────────────────────────────────────────

    private String getSignerName(Contract contract, String role) {
        if (contract.getSignatures() == null) return null;
        return contract.getSignatures().stream()
                .filter(s -> role.equalsIgnoreCase(s.getSignerRole()))
                .map(ContractSignature::getSignerName)
                .findFirst().orElse(null);
    }

    private String getSignerEmail(Contract contract, String role) {
        if (contract.getSignatures() == null) return null;
        return contract.getSignatures().stream()
                .filter(s -> role.equalsIgnoreCase(s.getSignerRole()))
                .map(ContractSignature::getSignerEmail)
                .findFirst().orElse(null);
    }

    // ── Watermark ──────────────────────────────────────────────────────────────

    private byte[] addWatermark(byte[] pdfBytes, Contract contract, String verificationCode) {
        try {
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
                PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(),
                        page.getResources(), pdfDoc);

                canvas.saveState();
                canvas.setExtGState(buildTransparencyState(pdfDoc, 0.06f));
                canvas.beginText();
                canvas.setFontAndSize(font, 52);
                canvas.setFillColor(BRAND);

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

                // Footer stamp
                canvas.beginText();
                canvas.setFontAndSize(font, 7);
                canvas.setFillColor(ColorConstants.GRAY);
                canvas.setExtGState(buildTransparencyState(pdfDoc, 0.5f));
                canvas.moveText(40, 20);
                canvas.showText("PROLANCE CONTRACT #" + contract.getId()
                        + " | VERIFY: " + verificationCode
                        + " | prolance.com/verify");
                canvas.endText();

                canvas.restoreState();
            }

            pdfDoc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Watermark failed: {}", e.getMessage(), e);
            return pdfBytes;
        }
    }

    // ── Verification code ──────────────────────────────────────────────────────

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

    // ── iText helpers ──────────────────────────────────────────────────────────

    private com.itextpdf.kernel.pdf.extgstate.PdfExtGState buildTransparencyState(
            PdfDocument doc, float opacity) {
        com.itextpdf.kernel.pdf.extgstate.PdfExtGState gs =
                new com.itextpdf.kernel.pdf.extgstate.PdfExtGState();
        gs.setFillOpacity(opacity);
        return gs;
    }
}