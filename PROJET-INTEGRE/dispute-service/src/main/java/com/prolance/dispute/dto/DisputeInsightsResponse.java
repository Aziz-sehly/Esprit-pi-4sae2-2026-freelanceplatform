package com.prolance.dispute.dto;

import java.util.ArrayList;
import java.util.List;

public class DisputeInsightsResponse {

    private double slaBreachProbability;
    private double escalationScore;
    private double duplicateMaxSimilarity;
    private List<DuplicateCandidate> duplicateCandidates = new ArrayList<>();
    private List<EvidenceStrength> evidenceStrength = new ArrayList<>();
    private TrustScore raisedByTrust = new TrustScore();

    public double getSlaBreachProbability() {
        return slaBreachProbability;
    }

    public void setSlaBreachProbability(double slaBreachProbability) {
        this.slaBreachProbability = slaBreachProbability;
    }

    public double getEscalationScore() {
        return escalationScore;
    }

    public void setEscalationScore(double escalationScore) {
        this.escalationScore = escalationScore;
    }

    public double getDuplicateMaxSimilarity() {
        return duplicateMaxSimilarity;
    }

    public void setDuplicateMaxSimilarity(double duplicateMaxSimilarity) {
        this.duplicateMaxSimilarity = duplicateMaxSimilarity;
    }

    public List<DuplicateCandidate> getDuplicateCandidates() {
        return duplicateCandidates;
    }

    public void setDuplicateCandidates(List<DuplicateCandidate> duplicateCandidates) {
        this.duplicateCandidates = duplicateCandidates;
    }

    public List<EvidenceStrength> getEvidenceStrength() {
        return evidenceStrength;
    }

    public void setEvidenceStrength(List<EvidenceStrength> evidenceStrength) {
        this.evidenceStrength = evidenceStrength;
    }

    public TrustScore getRaisedByTrust() {
        return raisedByTrust;
    }

    public void setRaisedByTrust(TrustScore raisedByTrust) {
        this.raisedByTrust = raisedByTrust;
    }

    public static class DuplicateCandidate {
        private Long disputeId;
        private double similarity;
        private String disputeType;

        public Long getDisputeId() {
            return disputeId;
        }

        public void setDisputeId(Long disputeId) {
            this.disputeId = disputeId;
        }

        public double getSimilarity() {
            return similarity;
        }

        public void setSimilarity(double similarity) {
            this.similarity = similarity;
        }

        public String getDisputeType() {
            return disputeType;
        }

        public void setDisputeType(String disputeType) {
            this.disputeType = disputeType;
        }
    }

    public static class EvidenceStrength {
        private Long evidenceId;
        private double score;
        private String label;

        public Long getEvidenceId() {
            return evidenceId;
        }

        public void setEvidenceId(Long evidenceId) {
            this.evidenceId = evidenceId;
        }

        public double getScore() {
            return score;
        }

        public void setScore(double score) {
            this.score = score;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }
    }

    public static class TrustScore {
        private double posteriorMean;
        private double confidence;
        private int resolvedSamples;

        public double getPosteriorMean() {
            return posteriorMean;
        }

        public void setPosteriorMean(double posteriorMean) {
            this.posteriorMean = posteriorMean;
        }

        public double getConfidence() {
            return confidence;
        }

        public void setConfidence(double confidence) {
            this.confidence = confidence;
        }

        public int getResolvedSamples() {
            return resolvedSamples;
        }

        public void setResolvedSamples(int resolvedSamples) {
            this.resolvedSamples = resolvedSamples;
        }
    }
}
