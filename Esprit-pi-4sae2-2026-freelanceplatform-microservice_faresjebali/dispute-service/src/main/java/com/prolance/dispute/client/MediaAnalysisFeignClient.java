package com.prolance.dispute.client;

import com.prolance.dispute.dto.MediaEvidenceAnalysisRequestItem;
import com.prolance.dispute.dto.MediaEvidenceAnalysisResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "media-analysis-service", contextId = "mediaAnalysisFeignClient", path = "/api/media")
public interface MediaAnalysisFeignClient {

    @PostMapping("/analyze-batch")
    List<MediaEvidenceAnalysisResult> analyzeBatch(@RequestBody List<MediaEvidenceAnalysisRequestItem> items);
}
