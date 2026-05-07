package com.prolance.media.service;

import com.prolance.media.dto.AnalyzeItemRequest;
import com.prolance.media.dto.MediaAnalysisResultDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MediaAnalysisOrchestrator {

    private final AttachmentFetchService fetchService;
    private final MediaInspectionService inspectionService;

    public MediaAnalysisOrchestrator(AttachmentFetchService fetchService, MediaInspectionService inspectionService) {
        this.fetchService = fetchService;
        this.inspectionService = inspectionService;
    }

    public List<MediaAnalysisResultDto> analyzeBatch(List<AnalyzeItemRequest> items) {
        List<MediaAnalysisResultDto> out = new ArrayList<>();
        if (items == null) {
            return out;
        }
        for (AnalyzeItemRequest item : items) {
            if (item == null || item.getEvidenceId() == null || item.getResourcePath() == null) {
                continue;
            }
            MediaAnalysisResultDto row = new MediaAnalysisResultDto();
            row.setEvidenceId(item.getEvidenceId());
            try {
                String path = item.getResourcePath().trim();
                String filename = AttachmentFetchService.extractAttachmentFilename(path);
                byte[] bytes = fetchService.fetchBytes(path);
                MediaAnalysisResultDto analyzed = inspectionService.analyze(item.getEvidenceId(), path, bytes, filename);
                out.add(analyzed);
            } catch (Exception e) {
                row.setMediaType("UNKNOWN");
                row.setIntrinsicQualityScore(0.4);
                row.setError(e.getMessage() != null ? e.getMessage() : "fetch_or_analyze_failed");
                out.add(row);
            }
        }
        return out;
    }
}
