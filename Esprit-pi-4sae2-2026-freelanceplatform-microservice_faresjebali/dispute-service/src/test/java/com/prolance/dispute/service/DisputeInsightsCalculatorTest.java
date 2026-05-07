package com.prolance.dispute.service;

import com.prolance.dispute.config.DisputeInsightsProperties;
import com.prolance.dispute.domain.Dispute;
import com.prolance.dispute.domain.DisputeAuditEvent;
import com.prolance.dispute.domain.DisputeStatus;
import com.prolance.dispute.domain.Evidence;
import com.prolance.dispute.domain.ResolutionType;
import com.prolance.dispute.dto.DisputeInsightsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DisputeInsightsCalculatorTest {

    private DisputeInsightsProperties props;
    private DisputeInsightsCalculator calc;

    @BeforeEach
    void setUp() {
        props = new DisputeInsightsProperties();
        calc = new DisputeInsightsCalculator(props);
    }

    @Test
    void slaBreachProbability_isHigherWhenLittleTimeRemains() {
        List<Dispute> history = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            history.add(resolvedDispute("PAYMENT_ISSUE", 72 + i));
        }
        Map<String, DisputeInsightsCalculator.SlaDistribution> typed = calc.buildTypedSlaDistributions(history);
        DisputeInsightsCalculator.SlaDistribution global = calc.buildGlobalSlaDistribution(history);

        Dispute tight = openDispute("PAYMENT_ISSUE", LocalDateTime.now().plusHours(2));
        Dispute loose = openDispute("PAYMENT_ISSUE", LocalDateTime.now().plusDays(30));

        double pTight = calc.slaBreachProbability(tight, 7, typed, global);
        double pLoose = calc.slaBreachProbability(loose, 7, typed, global);
        assertTrue(pTight > pLoose, "Less remaining time should imply higher breach risk");
        assertTrue(pTight >= 0 && pTight <= 1 && pLoose >= 0 && pLoose <= 1);
    }

    @Test
    void escalationScore_nonOpenIsDiscounted() {
        Dispute open = openDispute("OTHER", LocalDateTime.now().plusDays(5));
        open.setStatus(DisputeStatus.OPEN);
        Dispute review = openDispute("OTHER", LocalDateTime.now().plusDays(5));
        review.setStatus(DisputeStatus.IN_REVIEW);

        double sla = 0.5;
        double sOpen = calc.escalationScore(open, 0, 0, sla);
        double sReview = calc.escalationScore(review, 0, 0, sla);
        assertTrue(sOpen > sReview);
    }

    @Test
    void duplicateDetection_findsSimilarReason() {
        Dispute current = openDispute("QUALITY_ISSUE", LocalDateTime.now().plusDays(3));
        current.setReason("late delivery and broken package");

        Dispute other = openDispute("QUALITY_ISSUE", LocalDateTime.now().plusDays(3));
        other.setReason("broken package late delivery issue");

        List<DisputeInsightsResponse.DuplicateCandidate> c = calc.findDuplicateCandidates(current, List.of(current, other));
        assertFalse(c.isEmpty());
        assertTrue(c.get(0).getSimilarity() >= props.getDuplicate().getMinSimilarity());
    }

    @Test
    void evidenceStrength_labelsAndSorts() {
        Evidence weak = evidence(1L, "x.txt", "/a/b", "OTHER", LocalDateTime.now().minusDays(60));
        Evidence strong = evidence(2L, "shot.png", "/messages/attachments/550e8400-e29b-41d4-a716-446655440000.jpg", "PAYMENT_ISSUE", LocalDateTime.now());
        List<DisputeInsightsResponse.EvidenceStrength> scores = calc.computeEvidenceStrength(List.of(weak, strong), Collections.emptyMap());
        assertEquals(2, scores.size());
        assertTrue(scores.get(0).getScore() >= scores.get(1).getScore());
        assertEquals("STRONG", scores.get(0).getLabel());
    }

    @Test
    void evidenceStrength_thumbnailAndSmallWidthWeakenImageScores() {
        var es = props.getEvidenceStrength();
        Evidence clean = evidence(1L, "delivery.jpg",
                "/messages/attachments/550e8400-e29b-41d4-a716-446655440000/delivery.jpg",
                "DELIVERY_ISSUE", LocalDateTime.now());
        Evidence badName = evidence(2L, "thumbnail_360p_screenshot.jpg",
                "/messages/attachments/550e8400-e29b-41d4-a716-446655440001/thumbnail_360p_screenshot.jpg",
                "DELIVERY_ISSUE", LocalDateTime.now());
        Evidence badUrl = evidence(3L, "photo.png",
                "/messages/attachments/550e8400-e29b-41d4-a716-446655440002/x.png?w=120&quality=30",
                "DELIVERY_ISSUE", LocalDateTime.now());
        List<DisputeInsightsResponse.EvidenceStrength> scores = calc.computeEvidenceStrength(List.of(clean, badName, badUrl), Collections.emptyMap());
        double cleanScore = scores.stream().filter(s -> s.getEvidenceId() == 1L).findFirst().orElseThrow().getScore();
        double badNameScore = scores.stream().filter(s -> s.getEvidenceId() == 2L).findFirst().orElseThrow().getScore();
        double badUrlScore = scores.stream().filter(s -> s.getEvidenceId() == 3L).findFirst().orElseThrow().getScore();
        assertTrue(badNameScore < cleanScore, "Low-quality filename cues should reduce strength");
        assertTrue(badUrlScore < cleanScore, "Small rendered width / low quality param should reduce strength");
        assertTrue(calc.evidenceReadabilityScore("photo.png", "/x?w=800", es)
                > calc.evidenceReadabilityScore("photo.png", "/x?w=100", es));
    }

    @Test
    void trustScore_betaPosteriorMovesWithOutcomes() {
        List<Dispute> wins = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            Dispute d = new Dispute();
            d.setStatus(DisputeStatus.RESOLVED);
            d.setResolutionType(ResolutionType.REFUND_TO_CLIENT);
            wins.add(d);
        }
        DisputeInsightsResponse.TrustScore t = calc.computeTrustScore(99L, wins);
        assertTrue(t.getPosteriorMean() > 0.5);
        assertEquals(3, t.getResolvedSamples());

        List<Dispute> losses = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            Dispute d = new Dispute();
            d.setStatus(DisputeStatus.REJECTED);
            losses.add(d);
        }
        DisputeInsightsResponse.TrustScore t2 = calc.computeTrustScore(100L, losses);
        assertTrue(t2.getPosteriorMean() < t.getPosteriorMean());
    }

    @Test
    void jaccardAndCosine_identicalText() {
        assertEquals(1.0, DisputeInsightsCalculator.jaccardForTest("Hello World", "hello world!"), 1e-9);
        assertEquals(1.0, DisputeInsightsCalculator.cosineForTest("foo bar", "foo bar"), 1e-9);
    }

    @Test
    void countDisputeUpdateEvents_filtersTypes() {
        DisputeAuditEvent a = new DisputeAuditEvent();
        a.setEventType("DISPUTE_UPDATED");
        DisputeAuditEvent b = new DisputeAuditEvent();
        b.setEventType("EVIDENCE_ADDED");
        assertEquals(1, calc.countDisputeUpdateEvents(List.of(a, b)));
    }

    private static Dispute resolvedDispute(String type, long resolveHoursAfterCreate) {
        Dispute d = new Dispute();
        d.setDisputeType(type);
        LocalDateTime c = LocalDateTime.now().minusDays(40);
        d.setCreatedAt(c);
        d.setResolvedAt(c.plusHours(resolveHoursAfterCreate));
        d.setStatus(DisputeStatus.RESOLVED);
        return d;
    }

    private static Dispute openDispute(String type, LocalDateTime deadline) {
        Dispute d = new Dispute();
        d.setDisputeType(type);
        d.setReason("test reason");
        d.setCreatedAt(LocalDateTime.now().minusDays(2));
        d.setDeadlineAt(deadline);
        d.setStatus(DisputeStatus.OPEN);
        d.setContractId(1L);
        d.setRaisedByUserId(1L);
        return d;
    }

    private static Evidence evidence(Long id, String fileName, String url, String category, LocalDateTime created) {
        Evidence e = new Evidence();
        e.setId(id);
        e.setFileName(fileName);
        e.setFileUrl(url);
        e.setCategory(category);
        e.setCreatedAt(created);
        e.setDisputeId(1L);
        e.setUploaderUserId(1L);
        e.setAdminLocked(false);
        return e;
    }
}
