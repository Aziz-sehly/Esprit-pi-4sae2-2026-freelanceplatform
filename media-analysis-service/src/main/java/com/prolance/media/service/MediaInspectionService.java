package com.prolance.media.service;

import com.prolance.media.dto.MediaAnalysisResultDto;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class MediaInspectionService {

    /**
     * Variance-of-Laplacian thresholds (grayscale) used to map sharpness into [0..1].
     * Lower values indicate blur; higher values indicate clear edges/details.
     */
    private static final double SHARPNESS_VAR_LOW = 50.0;
    private static final double SHARPNESS_VAR_HIGH = 1800.0;
    private static final int SHARPNESS_MAX_DIM = 1024;

    @Value("${app.media.oversized-penalty:0.35}")
    private double oversizedPenalty;

    public MediaAnalysisResultDto analyze(Long evidenceId, String resourcePath, byte[] bytes, String fileNameHint) {
        MediaAnalysisResultDto out = new MediaAnalysisResultDto();
        out.setEvidenceId(evidenceId);
        if (bytes == null || bytes.length == 0) {
            out.setMediaType("UNKNOWN");
            out.setIntrinsicQualityScore(0.35);
            out.setError("empty_body");
            return out;
        }
        out.setFileSizeBytes((long) bytes.length);
        String fn = fileNameHint == null ? "" : fileNameHint.toLowerCase(Locale.ROOT);
        String kind = detectKind(bytes, fn);

        return switch (kind) {
            case "PDF" -> analyzePdf(out, bytes);
            case "IMAGE" -> analyzeImage(out, bytes);
            case "TEXT" -> analyzeText(out, bytes);
            case "VIDEO" -> analyzeVideoHeuristic(out, bytes);
            default -> analyzeUnknown(out, bytes);
        };
    }

    private MediaAnalysisResultDto analyzePdf(MediaAnalysisResultDto out, byte[] bytes) {
        out.setMediaType("PDF");
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            int pages = doc.getNumberOfPages();
            out.setPdfPageCount(pages);
            double pageScore = Math.min(1.0, pages / 8.0);
            double sizeScore = sizeQuality(bytes.length, 512_000, 4_000_000);
            out.setIntrinsicQualityScore(round2(0.55 * pageScore + 0.45 * sizeScore));
        } catch (Exception e) {
            out.setIntrinsicQualityScore(0.45);
            out.setError("pdf_parse_failed");
        }
        return out;
    }

    private MediaAnalysisResultDto analyzeImage(MediaAnalysisResultDto out, byte[] bytes) {
        out.setMediaType("IMAGE");
        try (ByteArrayInputStream in = new ByteArrayInputStream(bytes)) {
            BufferedImage img = ImageIO.read(in);
            if (img == null) {
                out.setIntrinsicQualityScore(0.5);
                out.setError("imageio_unsupported");
                return out;
            }
            int w = img.getWidth();
            int h = img.getHeight();
            out.setWidth(w);
            out.setHeight(h);
            double mp = (w * h) / 1_000_000.0;
            double resScore;
            if (mp >= 2.0) {
                resScore = 1.0;
            } else if (mp >= 1.0) {
                resScore = 0.88;
            } else if (mp >= 0.35) {
                resScore = 0.68;
            } else if (mp >= 0.12) {
                resScore = 0.48;
            } else {
                resScore = 0.30;
            }
            double dimScore = Math.min(1.0, Math.min(w, h) / 720.0);
            double sharpnessScore = imageSharpnessScore(img);
            double combined = 0.50 * resScore + 0.20 * dimScore + 0.30 * sharpnessScore;
            double sizeAdj = sizeQuality(bytes.length, 40_000, 2_000_000);
            out.setIntrinsicQualityScore(round2(0.85 * combined + 0.15 * sizeAdj));
        } catch (Exception e) {
            out.setIntrinsicQualityScore(0.45);
            out.setError("image_read_failed");
        }
        return out;
    }

    private MediaAnalysisResultDto analyzeText(MediaAnalysisResultDto out, byte[] bytes) {
        out.setMediaType("TEXT");
        String text = new String(bytes, StandardCharsets.UTF_8);
        int len = text.length();
        out.setTextSampleChars(Math.min(len, 50_000));
        double lenScore = Math.min(1.0, len / 4000.0);
        double printableRatio = printableRatio(text);
        double combined = 0.7 * lenScore + 0.3 * printableRatio;
        out.setIntrinsicQualityScore(round2(combined));
        return out;
    }

    private MediaAnalysisResultDto analyzeVideoHeuristic(MediaAnalysisResultDto out, byte[] bytes) {
        out.setMediaType("VIDEO");
        // Sans ffprobe : heuristique taille (fichiers très petits souvent inutilisables)
        long len = bytes.length;
        double s;
        if (len >= 5_000_000) {
            s = 0.92;
        } else if (len >= 1_500_000) {
            s = 0.78;
        } else if (len >= 400_000) {
            s = 0.58;
        } else if (len >= 120_000) {
            s = 0.42;
        } else {
            s = 0.28;
        }
        out.setIntrinsicQualityScore(round2(s));
        return out;
    }

    private MediaAnalysisResultDto analyzeUnknown(MediaAnalysisResultDto out, byte[] bytes) {
        out.setMediaType("UNKNOWN");
        out.setIntrinsicQualityScore(round2(sizeQuality(bytes.length, 20_000, 1_000_000)));
        return out;
    }

    static String detectKind(byte[] b, String fileNameLower) {
        if (b.length >= 4 && b[0] == '%' && b[1] == 'P' && b[2] == 'D' && b[3] == 'F') {
            return "PDF";
        }
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "IMAGE";
        }
        if (b.length >= 8 && b[0] == (byte) 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
            return "IMAGE";
        }
        if (b.length >= 6 && (startsWithAscii(b, "GIF87a") || startsWithAscii(b, "GIF89a"))) {
            return "IMAGE";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F') {
            // WebP / AVI chunk — tenter image d’abord
            if (containsAscii(b, 0, Math.min(b.length, 32), "WEBP")) {
                return "IMAGE";
            }
        }
        if (fileNameLower.matches(".*\\.(mp4|webm|ogg|ogv|mov|m4v|mkv|avi)(\\?.*)?$")) {
            return "VIDEO";
        }
        if (fileNameLower.matches(".*\\.(txt|text|log|md|csv|json|xml)(\\?.*)?$")) {
            return "TEXT";
        }
        if (fileNameLower.endsWith(".pdf")) {
            return "PDF";
        }
        if (fileNameLower.matches(".*\\.(jpe?g|png|gif|webp|bmp)(\\?.*)?$")) {
            return "IMAGE";
        }
        // Heuristique texte si majorité ASCII imprimable
        if (b.length <= 2_000_000 && printableRatio(new String(b, StandardCharsets.UTF_8)) >= 0.88) {
            return "TEXT";
        }
        return "UNKNOWN";
    }

    private static boolean startsWithAscii(byte[] b, String s) {
        byte[] a = s.getBytes(StandardCharsets.US_ASCII);
        if (b.length < a.length) return false;
        for (int i = 0; i < a.length; i++) {
            if (b[i] != a[i]) return false;
        }
        return true;
    }

    private static boolean containsAscii(byte[] b, int start, int end, String needle) {
        byte[] n = needle.getBytes(StandardCharsets.US_ASCII);
        outer:
        for (int i = start; i <= end - n.length; i++) {
            for (int j = 0; j < n.length; j++) {
                if (b[i + j] != n[j]) continue outer;
            }
            return true;
        }
        return false;
    }

    private static double printableRatio(String s) {
        if (s.isEmpty()) return 0;
        int ok = 0;
        int n = Math.min(s.length(), 20_000);
        for (int i = 0; i < n; i++) {
            char c = s.charAt(i);
            if (c == '\n' || c == '\r' || c == '\t') {
                ok++;
            } else if (c >= 32 && c < 127) {
                ok++;
            }
        }
        return (double) ok / n;
    }

    /**
     * Sharpness score based on variance of Laplacian on luminance values.
     * This penalizes blurry images even when their resolution is high.
     */
    private static double imageSharpnessScore(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();
        if (w < 3 || h < 3) {
            return 0.25;
        }

        int step = Math.max(1, (int) Math.ceil(Math.max(w, h) / (double) SHARPNESS_MAX_DIM));
        int sampledW = Math.max(3, w / step);
        int sampledH = Math.max(3, h / step);

        // Luminance cache for inexpensive convolution passes.
        int[][] lum = new int[sampledH][sampledW];
        for (int y = 0; y < sampledH; y++) {
            int srcY = Math.min(h - 1, y * step);
            for (int x = 0; x < sampledW; x++) {
                int srcX = Math.min(w - 1, x * step);
                int rgb = img.getRGB(srcX, srcY);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;
                lum[y][x] = (299 * r + 587 * g + 114 * b) / 1000;
            }
        }

        // Welford's online variance for Laplacian responses.
        long n = 0;
        double mean = 0.0;
        double m2 = 0.0;
        for (int y = 1; y < sampledH - 1; y++) {
            for (int x = 1; x < sampledW - 1; x++) {
                int lap = 4 * lum[y][x] - lum[y - 1][x] - lum[y + 1][x] - lum[y][x - 1] - lum[y][x + 1];
                n++;
                double delta = lap - mean;
                mean += delta / n;
                double delta2 = lap - mean;
                m2 += delta * delta2;
            }
        }
        if (n < 2) {
            return 0.25;
        }
        double variance = m2 / (n - 1);
        double low = Math.log1p(SHARPNESS_VAR_LOW);
        double high = Math.log1p(SHARPNESS_VAR_HIGH);
        double normalized = (Math.log1p(Math.max(0.0, variance)) - low) / (high - low);
        normalized = Math.max(0.0, Math.min(1.0, normalized));
        return 0.15 + 0.85 * normalized;
    }

    /** Taille “raisonnable” entre minGood et maxGood. */
    private double sizeQuality(long len, long minGood, long maxGood) {
        if (len < minGood) {
            return 0.35 + 0.3 * (len / (double) minGood);
        }
        if (len <= maxGood) {
            return 1.0;
        }
        return Math.max(oversizedPenalty, 1.0 - Math.min(0.5, (len - maxGood) / (double) maxGood));
    }

    private static double round2(double x) {
        return Math.round(x * 100.0) / 100.0;
    }
}
