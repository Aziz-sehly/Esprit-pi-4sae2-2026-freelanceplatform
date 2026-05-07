package com.prolance.dispute.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Tunable weights and thresholds for dispute insight formulas (YAML: {@code app.dispute.insights}).
 */
@ConfigurationProperties(prefix = "app.dispute.insights")
public class DisputeInsightsProperties {

    private Sla sla = new Sla();
    private Escalation escalation = new Escalation();
    private Duplicate duplicate = new Duplicate();
    private EvidenceStrength evidenceStrength = new EvidenceStrength();
    private Trust trust = new Trust();

    public Sla getSla() {
        return sla;
    }

    public void setSla(Sla sla) {
        this.sla = sla;
    }

    public Escalation getEscalation() {
        return escalation;
    }

    public void setEscalation(Escalation escalation) {
        this.escalation = escalation;
    }

    public Duplicate getDuplicate() {
        return duplicate;
    }

    public void setDuplicate(Duplicate duplicate) {
        this.duplicate = duplicate;
    }

    public EvidenceStrength getEvidenceStrength() {
        return evidenceStrength;
    }

    public void setEvidenceStrength(EvidenceStrength evidenceStrength) {
        this.evidenceStrength = evidenceStrength;
    }

    public Trust getTrust() {
        return trust;
    }

    public void setTrust(Trust trust) {
        this.trust = trust;
    }

    public static class Sla {
        /** Minimum typed samples before using type-specific mean/std; else global pool. */
        private int typedMinSamples = 5;
        private double defaultMeanHours = 120.0;
        /** Fallback variance (hours²); default ≈ 48h std. */
        private double defaultVarianceHours = 2304.0;
        private double minStdHours = 12.0;

        public int getTypedMinSamples() {
            return typedMinSamples;
        }

        public void setTypedMinSamples(int typedMinSamples) {
            this.typedMinSamples = typedMinSamples;
        }

        public double getDefaultMeanHours() {
            return defaultMeanHours;
        }

        public void setDefaultMeanHours(double defaultMeanHours) {
            this.defaultMeanHours = defaultMeanHours;
        }

        public double getDefaultVarianceHours() {
            return defaultVarianceHours;
        }

        public void setDefaultVarianceHours(double defaultVarianceHours) {
            this.defaultVarianceHours = defaultVarianceHours;
        }

        public double getMinStdHours() {
            return minStdHours;
        }

        public void setMinStdHours(double minStdHours) {
            this.minStdHours = minStdHours;
        }
    }

    public static class Escalation {
        private double weightAge = 0.35;
        private double weightSla = 0.30;
        private double weightEvidenceScarcity = 0.20;
        private double weightChurn = 0.15;
        private double ageScaleDays = 14.0;
        private double evidenceCap = 5.0;
        private double churnCap = 3.0;
        private double nonOpenFactor = 0.6;

        public double getWeightAge() {
            return weightAge;
        }

        public void setWeightAge(double weightAge) {
            this.weightAge = weightAge;
        }

        public double getWeightSla() {
            return weightSla;
        }

        public void setWeightSla(double weightSla) {
            this.weightSla = weightSla;
        }

        public double getWeightEvidenceScarcity() {
            return weightEvidenceScarcity;
        }

        public void setWeightEvidenceScarcity(double weightEvidenceScarcity) {
            this.weightEvidenceScarcity = weightEvidenceScarcity;
        }

        public double getWeightChurn() {
            return weightChurn;
        }

        public void setWeightChurn(double weightChurn) {
            this.weightChurn = weightChurn;
        }

        public double getAgeScaleDays() {
            return ageScaleDays;
        }

        public void setAgeScaleDays(double ageScaleDays) {
            this.ageScaleDays = ageScaleDays;
        }

        public double getEvidenceCap() {
            return evidenceCap;
        }

        public void setEvidenceCap(double evidenceCap) {
            this.evidenceCap = evidenceCap;
        }

        public double getChurnCap() {
            return churnCap;
        }

        public void setChurnCap(double churnCap) {
            this.churnCap = churnCap;
        }

        public double getNonOpenFactor() {
            return nonOpenFactor;
        }

        public void setNonOpenFactor(double nonOpenFactor) {
            this.nonOpenFactor = nonOpenFactor;
        }
    }

    public static class Duplicate {
        private double cosineWeight = 0.55;
        private double jaccardWeight = 0.45;
        private double sameTypeBonus = 0.10;
        private double minSimilarity = 0.45;
        private int maxCandidates = 5;

        public double getCosineWeight() {
            return cosineWeight;
        }

        public void setCosineWeight(double cosineWeight) {
            this.cosineWeight = cosineWeight;
        }

        public double getJaccardWeight() {
            return jaccardWeight;
        }

        public void setJaccardWeight(double jaccardWeight) {
            this.jaccardWeight = jaccardWeight;
        }

        public double getSameTypeBonus() {
            return sameTypeBonus;
        }

        public void setSameTypeBonus(double sameTypeBonus) {
            this.sameTypeBonus = sameTypeBonus;
        }

        public double getMinSimilarity() {
            return minSimilarity;
        }

        public void setMinSimilarity(double minSimilarity) {
            this.minSimilarity = minSimilarity;
        }

        public int getMaxCandidates() {
            return maxCandidates;
        }

        public void setMaxCandidates(int maxCandidates) {
            this.maxCandidates = maxCandidates;
        }
    }

    public static class EvidenceStrength {
        private double weightMedia = 0.28;
        private double weightIntegrity = 0.22;
        private double weightCategory = 0.18;
        private double weightRecency = 0.20;
        /** Heuristic “readability / perceived quality” for images & videos (filename + URL cues). */
        private double weightReadability = 0.12;
        private double recencyHalfLifeDays = 30.0;
        private double mediaImageVideoScore = 1.0;
        private double mediaOtherScore = 0.65;
        private double integrityUuidScore = 1.0;
        private double integrityFallbackScore = 0.55;
        private double categorySpecificScore = 1.0;
        private double categoryOtherScore = 0.65;
        private double strongThreshold = 0.80;
        private double mediumThreshold = 0.60;
        /**
         * Substrings (lowercase) in file name or URL that suggest thumbnails, heavy compression, or low resolution labels.
         */
        private List<String> readabilityLowQualitySubstrings = new ArrayList<>(List.of(
                "thumb", "thumbnail", "thumbnails", "preview", "lowres", "low-res", "low_quality", "lowquality",
                "tiny", "mini", "small", "compress", "compressed", "blurry", "pixelated", "unreadable",
                "360p", "480p", "240p", "144p", "72p", "crop", "cropped", "dark", "nightshot", "whatsapp",
                "instagram", "story_", "meme", "emoji"
        ));
        /** Each distinct matched substring (up to {@link #readabilityMaxPenaltyHits}) reduces readability by this amount. */
        private double readabilityPenaltyPerHit = 0.14;
        private int readabilityMaxPenaltyHits = 4;
        /** Floor for the readability dimension (0–1) before it is weighted into the blend. */
        private double readabilityMinScore = 0.22;
        /** If URL query contains {@code w=} or {@code width=} below this value, apply {@link #readabilitySmallDimensionPenalty}. */
        private int readabilitySmallWidthMax = 420;
        private double readabilitySmallDimensionPenalty = 0.12;
        /** If URL query {@code quality=} is present and below this, apply {@link #readabilityLowUrlQualityPenalty}. */
        private int readabilityLowUrlQualityThreshold = 45;
        private double readabilityLowUrlQualityPenalty = 0.10;
        /** GIF is often low detail for evidential stills; small extra penalty for image/video GIFs. */
        private double readabilityGifPenalty = 0.08;
        /**
         * When {@link com.prolance.dispute.dto.MediaEvidenceAnalysisResult#getIntrinsicQualityScore()} is available,
         * blended into URL/filename readability: {@code (1-w)*heuristic + w*intrinsic}.
         */
        private double readabilityIntrinsicBlendWeight = 0.5;

        public double getWeightMedia() {
            return weightMedia;
        }

        public void setWeightMedia(double weightMedia) {
            this.weightMedia = weightMedia;
        }

        public double getWeightIntegrity() {
            return weightIntegrity;
        }

        public void setWeightIntegrity(double weightIntegrity) {
            this.weightIntegrity = weightIntegrity;
        }

        public double getWeightCategory() {
            return weightCategory;
        }

        public void setWeightCategory(double weightCategory) {
            this.weightCategory = weightCategory;
        }

        public double getWeightRecency() {
            return weightRecency;
        }

        public void setWeightRecency(double weightRecency) {
            this.weightRecency = weightRecency;
        }

        public double getWeightReadability() {
            return weightReadability;
        }

        public void setWeightReadability(double weightReadability) {
            this.weightReadability = weightReadability;
        }

        public double getRecencyHalfLifeDays() {
            return recencyHalfLifeDays;
        }

        public void setRecencyHalfLifeDays(double recencyHalfLifeDays) {
            this.recencyHalfLifeDays = recencyHalfLifeDays;
        }

        public double getMediaImageVideoScore() {
            return mediaImageVideoScore;
        }

        public void setMediaImageVideoScore(double mediaImageVideoScore) {
            this.mediaImageVideoScore = mediaImageVideoScore;
        }

        public double getMediaOtherScore() {
            return mediaOtherScore;
        }

        public void setMediaOtherScore(double mediaOtherScore) {
            this.mediaOtherScore = mediaOtherScore;
        }

        public double getIntegrityUuidScore() {
            return integrityUuidScore;
        }

        public void setIntegrityUuidScore(double integrityUuidScore) {
            this.integrityUuidScore = integrityUuidScore;
        }

        public double getIntegrityFallbackScore() {
            return integrityFallbackScore;
        }

        public void setIntegrityFallbackScore(double integrityFallbackScore) {
            this.integrityFallbackScore = integrityFallbackScore;
        }

        public double getCategorySpecificScore() {
            return categorySpecificScore;
        }

        public void setCategorySpecificScore(double categorySpecificScore) {
            this.categorySpecificScore = categorySpecificScore;
        }

        public double getCategoryOtherScore() {
            return categoryOtherScore;
        }

        public void setCategoryOtherScore(double categoryOtherScore) {
            this.categoryOtherScore = categoryOtherScore;
        }

        public double getStrongThreshold() {
            return strongThreshold;
        }

        public void setStrongThreshold(double strongThreshold) {
            this.strongThreshold = strongThreshold;
        }

        public double getMediumThreshold() {
            return mediumThreshold;
        }

        public void setMediumThreshold(double mediumThreshold) {
            this.mediumThreshold = mediumThreshold;
        }

        public List<String> getReadabilityLowQualitySubstrings() {
            return readabilityLowQualitySubstrings;
        }

        public void setReadabilityLowQualitySubstrings(List<String> readabilityLowQualitySubstrings) {
            this.readabilityLowQualitySubstrings = readabilityLowQualitySubstrings;
        }

        public double getReadabilityPenaltyPerHit() {
            return readabilityPenaltyPerHit;
        }

        public void setReadabilityPenaltyPerHit(double readabilityPenaltyPerHit) {
            this.readabilityPenaltyPerHit = readabilityPenaltyPerHit;
        }

        public int getReadabilityMaxPenaltyHits() {
            return readabilityMaxPenaltyHits;
        }

        public void setReadabilityMaxPenaltyHits(int readabilityMaxPenaltyHits) {
            this.readabilityMaxPenaltyHits = readabilityMaxPenaltyHits;
        }

        public double getReadabilityMinScore() {
            return readabilityMinScore;
        }

        public void setReadabilityMinScore(double readabilityMinScore) {
            this.readabilityMinScore = readabilityMinScore;
        }

        public int getReadabilitySmallWidthMax() {
            return readabilitySmallWidthMax;
        }

        public void setReadabilitySmallWidthMax(int readabilitySmallWidthMax) {
            this.readabilitySmallWidthMax = readabilitySmallWidthMax;
        }

        public double getReadabilitySmallDimensionPenalty() {
            return readabilitySmallDimensionPenalty;
        }

        public void setReadabilitySmallDimensionPenalty(double readabilitySmallDimensionPenalty) {
            this.readabilitySmallDimensionPenalty = readabilitySmallDimensionPenalty;
        }

        public int getReadabilityLowUrlQualityThreshold() {
            return readabilityLowUrlQualityThreshold;
        }

        public void setReadabilityLowUrlQualityThreshold(int readabilityLowUrlQualityThreshold) {
            this.readabilityLowUrlQualityThreshold = readabilityLowUrlQualityThreshold;
        }

        public double getReadabilityLowUrlQualityPenalty() {
            return readabilityLowUrlQualityPenalty;
        }

        public void setReadabilityLowUrlQualityPenalty(double readabilityLowUrlQualityPenalty) {
            this.readabilityLowUrlQualityPenalty = readabilityLowUrlQualityPenalty;
        }

        public double getReadabilityGifPenalty() {
            return readabilityGifPenalty;
        }

        public void setReadabilityGifPenalty(double readabilityGifPenalty) {
            this.readabilityGifPenalty = readabilityGifPenalty;
        }

        public double getReadabilityIntrinsicBlendWeight() {
            return readabilityIntrinsicBlendWeight;
        }

        public void setReadabilityIntrinsicBlendWeight(double readabilityIntrinsicBlendWeight) {
            this.readabilityIntrinsicBlendWeight = readabilityIntrinsicBlendWeight;
        }
    }

    public static class Trust {
        private double priorAlpha = 2.0;
        private double priorBeta = 2.0;
        private double confidencePriorSamples = 5.0;

        public double getPriorAlpha() {
            return priorAlpha;
        }

        public void setPriorAlpha(double priorAlpha) {
            this.priorAlpha = priorAlpha;
        }

        public double getPriorBeta() {
            return priorBeta;
        }

        public void setPriorBeta(double priorBeta) {
            this.priorBeta = priorBeta;
        }

        public double getConfidencePriorSamples() {
            return confidencePriorSamples;
        }

        public void setConfidencePriorSamples(double confidencePriorSamples) {
            this.confidencePriorSamples = confidencePriorSamples;
        }
    }
}
