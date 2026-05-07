package com.prolance.media.web;

import com.prolance.media.dto.AnalyzeItemRequest;
import com.prolance.media.dto.MediaAnalysisResultDto;
import com.prolance.media.service.MediaAnalysisOrchestrator;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/media")
public class MediaAnalysisController {

    private final MediaAnalysisOrchestrator orchestrator;

    public MediaAnalysisController(MediaAnalysisOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    /**
     * Analyse en lot (appel interne dispute-service via Feign).
     */
    @PostMapping("/analyze-batch")
    public List<MediaAnalysisResultDto> analyzeBatch(@RequestBody List<AnalyzeItemRequest> items) {
        return orchestrator.analyzeBatch(items);
    }
}
