package com.prolance.dispute.service;

import com.prolance.dispute.config.DisputeInsightsProperties;
import com.prolance.dispute.domain.Dispute;
import com.prolance.dispute.domain.DisputeAuditEvent;
import com.prolance.dispute.domain.DisputeStatus;
import com.prolance.dispute.domain.Evidence;
import com.prolance.dispute.domain.ResolutionType;
import com.prolance.dispute.dto.DisputeInsightsResponse;
import com.prolance.dispute.dto.MediaEvidenceAnalysisResult;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pure(ish) math for dispute insights; behavior driven by {@link DisputeInsightsProperties}.
 */
@Component
public class DisputeInsightsCalculator {

    private static final Pattern URL_WIDTH = Pattern.compile("(?i)[?&](w|width)=(\\d+)");
    private static final Pattern URL_QUALITY = Pattern.compile("(?i)[?&]quality=(\\d+)");

    private final DisputeInsightsProperties props;

    public DisputeInsightsCalculator(DisputeInsightsProperties props) {
        this.props = props;
    }

    public record SlaDistribution(double meanHours, double stdHours, int sampleSize) {}

    public Map<String, SlaDistribution> buildTypedSlaDistributions(List<Dispute> history) {
        Map<String, List<Double>> byType = new HashMap<>();
        for (Dispute d : history) {
            if (d.getResolvedAt() == null || d.getCreatedAt() == null) continue;
            double h = Math.max(1.0, Duration.between(d.getCreatedAt(), d.getResolvedAt()).toHours());
            String t = d.getDisputeType() == null ? "OTHER" : d.getDisputeType();
            byType.computeIfAbsent(t, k -> new ArrayList<>()).add(h);
        }
        Map<String, SlaDistribution> out = new HashMap<>();
        for (Map.Entry<String, List<Double>> e : byType.entrySet()) {
            out.put(e.getKey(), distributionFromHours(e.getValue()));
        }
        return out;
    }

    public SlaDistribution buildGlobalSlaDistribution(List<Dispute> history) {
        List<Double> all = new ArrayList<>();
        for (Dispute d : history) {
            if (d.getResolvedAt() == null || d.getCreatedAt() == null) continue;
            all.add(Math.max(1.0, Duration.between(d.getCreatedAt(), d.getResolvedAt()).toHours()));
        }
        return distributionFromHours(all);
    }

    private SlaDistribution distributionFromHours(List<Double> samples) {
        var sla = props.getSla();
        if (samples == null || samples.isEmpty()) {
            double std = Math.sqrt(sla.getDefaultVarianceHours());
            std = Math.max(sla.getMinStdHours(), std);
            return new SlaDistribution(sla.getDefaultMeanHours(), std, 0);
        }
        double mean = samples.stream().mapToDouble(x -> x).average().orElse(sla.getDefaultMeanHours());
        double variance = 0.0;
        for (double x : samples) variance += (x - mean) * (x - mean);
        variance = samples.size() > 1 ? variance / (samples.size() - 1) : sla.getDefaultVarianceHours();
        double std = Math.max(sla.getMinStdHours(), Math.sqrt(variance));
        return new SlaDistribution(mean, std, samples.size());
    }

    public double slaBreachProbability(Dispute dispute,
                                     int deadlineDays,
                                     Map<String, SlaDistribution> typed,
                                     SlaDistribution global) {
        String typeKey = dispute.getDisputeType() == null ? "OTHER" : dispute.getDisputeType();
        SlaDistribution typedDist = typed.get(typeKey);
        SlaDistribution use = (typedDist != null && typedDist.sampleSize() >= props.getSla().getTypedMinSamples())
                ? typedDist
                : global;

        double remainingHours;
        if (dispute.getDeadlineAt() == null) {
            remainingHours = 24.0 * deadlineDays;
        } else {
            remainingHours = Duration.between(LocalDateTime.now(), dispute.getDeadlineAt()).toHours();
        }
        double z = (remainingHours - use.meanHours()) / use.stdHours();
        return clamp01(1.0 / (1.0 + Math.exp(z)));
    }

    public long countDisputeUpdateEvents(List<DisputeAuditEvent> auditEvents) {
        if (auditEvents == null) return 0;
        return auditEvents.stream()
                .filter(ev -> "DISPUTE_UPDATED".equals(ev.getEventType())
                        || "DISPUTE_UPDATED_ADMIN".equals(ev.getEventType()))
                .count();
    }

    public double escalationScore(Dispute dispute,
                                  int evidenceCount,
                                  long updateCount,
                                  double slaRisk) {
        var esc = props.getEscalation();
        double ageDays = Math.max(0.0, Duration.between(dispute.getCreatedAt(), LocalDateTime.now()).toHours() / 24.0);
        double ageScore = clamp01(ageDays / esc.getAgeScaleDays());
        double evidenceScore = 1.0 - clamp01(evidenceCount / esc.getEvidenceCap());
        double churnScore = clamp01(updateCount / esc.getChurnCap());

        double wSum = esc.getWeightAge() + esc.getWeightSla() + esc.getWeightEvidenceScarcity() + esc.getWeightChurn();
        if (wSum <= 0) wSum = 1.0;
        double score = (esc.getWeightAge() * ageScore
                + esc.getWeightSla() * slaRisk
                + esc.getWeightEvidenceScarcity() * evidenceScore
                + esc.getWeightChurn() * churnScore) / wSum;

        if (dispute.getStatus() != DisputeStatus.OPEN) {
            score *= esc.getNonOpenFactor();
        }
        return clamp01(score);
    }

    public List<DisputeInsightsResponse.DuplicateCandidate> findDuplicateCandidates(Dispute dispute,
                                                                                    List<Dispute> inContract) {
        var dup = props.getDuplicate();
        String baseText = normalizeTextStatic((dispute.getReason() == null ? "" : dispute.getReason()) + " " + dispute.getDisputeType());
        double wSum = dup.getCosineWeight() + dup.getJaccardWeight();
        if (wSum <= 0) wSum = 1.0;

        List<DisputeInsightsResponse.DuplicateCandidate> out = new ArrayList<>();
        for (Dispute d : inContract) {
            if (dispute.getId() != null && dispute.getId().equals(d.getId())) continue;
            String otherText = normalizeTextStatic((d.getReason() == null ? "" : d.getReason()) + " " + d.getDisputeType());
            double jacc = jaccard(baseText, otherText);
            double cos = cosine(baseText, otherText);
            double typeBonus = safeEq(dispute.getDisputeType(), d.getDisputeType()) ? dup.getSameTypeBonus() : 0.0;
            double blended = (dup.getCosineWeight() * cos + dup.getJaccardWeight() * jacc) / wSum;
            double sim = clamp01(blended + typeBonus);
            if (sim < dup.getMinSimilarity()) continue;
            DisputeInsightsResponse.DuplicateCandidate c = new DisputeInsightsResponse.DuplicateCandidate();
            c.setDisputeId(d.getId());
            c.setDisputeType(d.getDisputeType());
            c.setSimilarity(round4(sim));
            out.add(c);
        }
        out.sort(Comparator.comparing(DisputeInsightsResponse.DuplicateCandidate::getSimilarity).reversed());
        int max = dup.getMaxCandidates();
        if (out.size() > max) {
            return new ArrayList<>(out.subList(0, max));
        }
        return out;
    }

    public List<DisputeInsightsResponse.EvidenceStrength> computeEvidenceStrength(List<Evidence> evidences,
                                                                                  Map<Long, MediaEvidenceAnalysisResult> mediaByEvidenceId) {
        var es = props.getEvidenceStrength();
        double wSum = es.getWeightMedia() + es.getWeightIntegrity() + es.getWeightCategory() + es.getWeightRecency()
                + es.getWeightReadability();
        if (wSum <= 0) wSum = 1.0;

        List<DisputeInsightsResponse.EvidenceStrength> out = new ArrayList<>();
        for (Evidence e : evidences) {
            String fn = (e.getFileName() == null ? "" : e.getFileName()).toLowerCase(Locale.ROOT);
            String url = e.getFileUrl() == null ? "" : e.getFileUrl();
            double mediaScore = isVideoOrImage(fn) ? es.getMediaImageVideoScore() : es.getMediaOtherScore();
            double integrityScore = url.matches(".*[0-9a-fA-F]{8}-[0-9a-fA-F-]{27,}.*")
                    ? es.getIntegrityUuidScore()
                    : es.getIntegrityFallbackScore();
            double categoryScore = e.getCategory() != null && !"OTHER".equalsIgnoreCase(e.getCategory())
                    ? es.getCategorySpecificScore()
                    : es.getCategoryOtherScore();
            double ageDays = Math.max(0.0, Duration.between(e.getCreatedAt(), LocalDateTime.now()).toHours() / 24.0);
            double halfLife = es.getRecencyHalfLifeDays() > 0 ? es.getRecencyHalfLifeDays() : 30.0;
            double recency = Math.exp(-ageDays / halfLife);
            double readabilityScore = evidenceReadabilityScore(fn, url, es);
            MediaEvidenceAnalysisResult mar = mediaByEvidenceId == null ? null : mediaByEvidenceId.get(e.getId());
            if (mar != null && mar.getIntrinsicQualityScore() != null && !Double.isNaN(mar.getIntrinsicQualityScore())) {
                double wBlend = es.getReadabilityIntrinsicBlendWeight();
                wBlend = Math.max(0.0, Math.min(1.0, wBlend));
                readabilityScore = (1.0 - wBlend) * readabilityScore
                        + wBlend * clamp01(mar.getIntrinsicQualityScore());
            }
            double score = (es.getWeightMedia() * mediaScore
                    + es.getWeightIntegrity() * integrityScore
                    + es.getWeightCategory() * categoryScore
                    + es.getWeightRecency() * recency
                    + es.getWeightReadability() * readabilityScore) / wSum;
            score = clamp01(score);

            DisputeInsightsResponse.EvidenceStrength s = new DisputeInsightsResponse.EvidenceStrength();
            s.setEvidenceId(e.getId());
            s.setScore(round4(score));
            s.setLabel(labelForStrength(score));
            out.add(s);
        }
        out.sort(Comparator.comparing(DisputeInsightsResponse.EvidenceStrength::getScore).reversed());
        return out;
    }

    /**
     * 1.0 = no negative cues; lower = filename/URL suggest thumbnails, heavy compression, or low labeled resolution.
     * Non image/video evidence returns 1.0 (neutral) so PDFs etc. are not unfairly down-ranked on this axis.
     */
    double evidenceReadabilityScore(String fileNameLower, String fileUrl, DisputeInsightsProperties.EvidenceStrength es) {
        if (!isVideoOrImage(fileNameLower)) {
            return 1.0;
        }
        String haystack = (fileNameLower + " " + (fileUrl == null ? "" : fileUrl).toLowerCase(Locale.ROOT)).trim();
        int hits = 0;
        if (es.getReadabilityLowQualitySubstrings() != null) {
            for (String raw : es.getReadabilityLowQualitySubstrings()) {
                if (raw == null || raw.isBlank()) continue;
                String p = raw.toLowerCase(Locale.ROOT).trim();
                if (p.isEmpty()) continue;
                if (haystack.contains(p)) {
                    hits++;
                    if (hits >= es.getReadabilityMaxPenaltyHits()) {
                        break;
                    }
                }
            }
        }
        double r = 1.0 - hits * es.getReadabilityPenaltyPerHit();

        if (fileNameLower.matches(".*\\.gif(\\?.*)?$") || (fileUrl != null && fileUrl.toLowerCase(Locale.ROOT).matches(".*\\.gif(\\?.*)?$"))) {
            r -= es.getReadabilityGifPenalty();
        }

        if (fileUrl != null && !fileUrl.isBlank()) {
            Matcher wm = URL_WIDTH.matcher(fileUrl);
            boolean smallDim = false;
            while (wm.find()) {
                try {
                    int px = Integer.parseInt(wm.group(2));
                    if (px > 0 && px < es.getReadabilitySmallWidthMax()) {
                        smallDim = true;
                        break;
                    }
                } catch (NumberFormatException ignored) {
                    // skip
                }
            }
            if (smallDim) {
                r -= es.getReadabilitySmallDimensionPenalty();
            }
            Matcher qm = URL_QUALITY.matcher(fileUrl);
            if (qm.find()) {
                try {
                    int q = Integer.parseInt(qm.group(1));
                    if (q >= 0 && q < es.getReadabilityLowUrlQualityThreshold()) {
                        r -= es.getReadabilityLowUrlQualityPenalty();
                    }
                } catch (NumberFormatException ignored) {
                    // skip
                }
            }
        }

        r = Math.max(es.getReadabilityMinScore(), r);
        return clamp01(r);
    }

    private String labelForStrength(double score) {
        var es = props.getEvidenceStrength();
        if (score >= es.getStrongThreshold()) return "STRONG";
        if (score >= es.getMediumThreshold()) return "MEDIUM";
        return "WEAK";
    }

    public DisputeInsightsResponse.TrustScore computeTrustScore(Long userId, List<Dispute> raisedByUserDisputes) {
        var tr = props.getTrust();
        double alpha = tr.getPriorAlpha();
        double beta = tr.getPriorBeta();
        int samples = 0;
        for (Dispute d : raisedByUserDisputes) {
            if (d.getStatus() != DisputeStatus.RESOLVED && d.getStatus() != DisputeStatus.REJECTED) continue;
            samples++;
            boolean successfulClaim = d.getStatus() == DisputeStatus.RESOLVED
                    && d.getResolutionType() != null
                    && d.getResolutionType() != ResolutionType.NO_ACTION;
            if (successfulClaim) alpha += 1.0;
            else beta += 1.0;
        }
        DisputeInsightsResponse.TrustScore score = new DisputeInsightsResponse.TrustScore();
        double posterior = alpha / (alpha + beta);
        double cap = tr.getConfidencePriorSamples() > 0 ? tr.getConfidencePriorSamples() : 5.0;
        double confidence = samples / (samples + cap);
        score.setPosteriorMean(round4(posterior));
        score.setConfidence(round4(confidence));
        score.setResolvedSamples(samples);
        return score;
    }

    public DisputeInsightsResponse buildInsights(Dispute dispute,
                                                 List<Evidence> evidences,
                                                 List<DisputeAuditEvent> auditEvents,
                                                 List<Dispute> resolvedHistory,
                                                 List<Dispute> sameContractDisputes,
                                                 List<Dispute> raiserHistory,
                                                 int deadlineDays,
                                                 Map<Long, MediaEvidenceAnalysisResult> mediaByEvidenceId) {
        Map<String, SlaDistribution> typed = buildTypedSlaDistributions(resolvedHistory);
        SlaDistribution global = buildGlobalSlaDistribution(resolvedHistory);
        double slaRisk = slaBreachProbability(dispute, deadlineDays, typed, global);
        long updates = countDisputeUpdateEvents(auditEvents);
        double esc = escalationScore(dispute, evidences == null ? 0 : evidences.size(), updates, slaRisk);

        DisputeInsightsResponse out = new DisputeInsightsResponse();
        out.setSlaBreachProbability(round4(slaRisk));
        out.setEscalationScore(round4(esc));

        List<DisputeInsightsResponse.DuplicateCandidate> dup = findDuplicateCandidates(dispute, sameContractDisputes);
        out.setDuplicateCandidates(dup);
        out.setDuplicateMaxSimilarity(dup.isEmpty() ? 0.0 : round4(dup.get(0).getSimilarity()));

        out.setEvidenceStrength(computeEvidenceStrength(evidences == null ? List.of() : evidences, mediaByEvidenceId));
        out.setRaisedByTrust(computeTrustScore(dispute.getRaisedByUserId(), raiserHistory));
        return out;
    }

    private boolean isVideoOrImage(String fn) {
        return fn.matches(".*\\.(jpe?g|png|gif|webp|bmp|svg|mp4|webm|ogg|ogv|mov|m4v|mkv|avi)$");
    }

    static String normalizeTextStatic(String s) {
        if (s == null) return "";
        return s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
    }

    private static Set<String> tokenSet(String s) {
        if (s == null || s.isBlank()) return Set.of();
        String[] parts = s.split(" ");
        Set<String> out = new HashSet<>();
        for (String p : parts) if (!p.isBlank()) out.add(p);
        return out;
    }

    private static Map<String, Integer> freq(String s) {
        Map<String, Integer> out = new HashMap<>();
        if (s == null || s.isBlank()) return out;
        for (String p : s.split(" ")) {
            if (p.isBlank()) continue;
            out.put(p, out.getOrDefault(p, 0) + 1);
        }
        return out;
    }

    static double jaccardForTest(String a, String b) {
        return jaccard(normalizeTextStatic(a), normalizeTextStatic(b));
    }

    static double cosineForTest(String a, String b) {
        return cosine(normalizeTextStatic(a), normalizeTextStatic(b));
    }

    private static double jaccard(String a, String b) {
        Set<String> sa = tokenSet(a);
        Set<String> sb = tokenSet(b);
        if (sa.isEmpty() && sb.isEmpty()) return 1.0;
        Set<String> inter = new HashSet<>(sa);
        inter.retainAll(sb);
        Set<String> uni = new HashSet<>(sa);
        uni.addAll(sb);
        return uni.isEmpty() ? 0.0 : (double) inter.size() / (double) uni.size();
    }

    private static double cosine(String a, String b) {
        Map<String, Integer> fa = freq(a);
        Map<String, Integer> fb = freq(b);
        if (fa.isEmpty() || fb.isEmpty()) return 0.0;
        double dot = 0.0, na = 0.0, nb = 0.0;
        for (Map.Entry<String, Integer> e : fa.entrySet()) {
            int va = e.getValue();
            int vb = fb.getOrDefault(e.getKey(), 0);
            dot += va * vb;
            na += va * va;
        }
        for (int vb : fb.values()) nb += vb * vb;
        if (na == 0 || nb == 0) return 0.0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    private static boolean safeEq(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equalsIgnoreCase(b);
    }

    private static double clamp01(double x) {
        if (x < 0) return 0;
        if (x > 1) return 1;
        return x;
    }

    private static double round4(double x) {
        return Math.round(x * 10000.0) / 10000.0;
    }
}
