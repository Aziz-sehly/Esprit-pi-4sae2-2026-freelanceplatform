package com.esprit.microservice_project.Contoller;

import com.esprit.microservice_project.DTO.ProjectAISuggestRequest;
import com.esprit.microservice_project.DTO.ProjectAISuggestResponse;
import com.esprit.microservice_project.DTO.ProjectStatsDTO;
import com.esprit.microservice_project.DTO.ProposalNotificationDTO;
import com.esprit.microservice_project.Entity.Experience;
import com.esprit.microservice_project.Entity.Project;
import com.esprit.microservice_project.Entity.Status;
import com.esprit.microservice_project.Services.AIProjectSuggestService;
import com.esprit.microservice_project.Services.EmailService;
import com.esprit.microservice_project.Services.IServiceProject;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/project")
@RequiredArgsConstructor
public class ProjectRest {

    private final IServiceProject serviceproject;
    private final AIProjectSuggestService aiSuggestService;
    private final EmailService emailService;

    // ── AI suggest ────────────────────────────────────────────────────────────

    @PreAuthorize("hasAuthority('CLIENT')")
    @PostMapping("/ai-suggest")
    public ProjectAISuggestResponse aiSuggest(@RequestBody ProjectAISuggestRequest req) {
        return aiSuggestService.suggest(req.getDescription(), req.getDuration());
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAuthority('CLIENT')")
    @PostMapping("/Addproject")
    public ResponseEntity<?> Addproject(@RequestBody Project p,
                                        HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            String email = (String) request.getAttribute("email");

            if (p.getClientId() == null || p.getClientId() == 0) {
                p.setClientId(userId);
            }
            if (p.getClientEmail() == null || p.getClientEmail().isBlank()) {
                p.setClientEmail(email);
            }

            boolean needsAI = p.getDescription() != null && !p.getDescription().isBlank()
                    && (isPlaceholderAiTitle(p.getTitle()) || isBlank(p.getSkills()) || isBlank(p.getCategory())
                    || p.getBudget_min() == null || p.getBudget_max() == null);

            if (needsAI) {
                String duration = p.getDuration() != null ? p.getDuration() : "";
                ProjectAISuggestResponse suggestion =
                        aiSuggestService.suggest(p.getDescription(), duration);
                if (isPlaceholderAiTitle(p.getTitle())) p.setTitle(suggestion.getTitle());
                if (isBlank(p.getSkills()))    p.setSkills(suggestion.getSkills());
                if (isBlank(p.getCategory())) p.setCategory(suggestion.getCategory());
                if (p.getBudget_min() == null) p.setBudget_min(suggestion.getBudgetMin());
                if (p.getBudget_max() == null) p.setBudget_max(suggestion.getBudgetMax());
            }

            return ResponseEntity.ok(serviceproject.addProject(p));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/GetAllProjects")
    public List<Project> GetAllProjects() {
        return serviceproject.getProjects();
    }

    @GetMapping("/GetProject/{id}")
    public Project GetProject(@PathVariable int id) {
        return serviceproject.getProject(id);
    }

    @PreAuthorize("hasAuthority('CLIENT')")
    @PutMapping("/UpdateProject/{id}")
    public ResponseEntity<?> UpdateProject(@PathVariable int id,
                                           @RequestBody Project p,
                                           HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Project existing = serviceproject.getProject(id);

        if (existing.getClientId() == null ||
                !existing.getClientId().equals(userId)) {
            return ResponseEntity.status(403).body("You can only update your own projects");
        }
        return ResponseEntity.ok(serviceproject.updateProject(id, p));
    }

    @PreAuthorize("hasAuthority('CLIENT')")
    @DeleteMapping("/DeleteProject/{id}")
    public ResponseEntity<?> DeleteProject(@PathVariable int id,
                                           HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Project existing = serviceproject.getProject(id);

        if (existing.getClientId() == null ||
                !existing.getClientId().equals(userId)) {
            return ResponseEntity.status(403).body("You can only delete your own projects");
        }
        serviceproject.deleteProject(id);
        return ResponseEntity.ok().build();
    }

    // ── INTERNAL: called by proposal microservice via Feign ───────────────────

    @PutMapping("/UpdateProjectStatus/{id}")
    public ResponseEntity<?> UpdateProjectStatus(
            @PathVariable int id,
            @RequestParam("status") String status) {
        try {
            return ResponseEntity.ok(serviceproject.updateProjectStatus(id, status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status value: " + status);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/GetProjectsByClient/{clientId}")
    public List<Project> GetProjectsByClient(@PathVariable int clientId) {
        return serviceproject.getProjectsByClientId(clientId);
    }

    @GetMapping("/search")
    public List<Project> search(
            @RequestParam(required = false) String     query,
            @RequestParam(required = false) String     category,
            @RequestParam(required = false) Status     status,
            @RequestParam(required = false) Experience experience,
            @RequestParam(required = false) Float      budgetMin,
            @RequestParam(required = false) Float      budgetMax) {
        return serviceproject.search(query, category, status, experience, budgetMin, budgetMax);
    }

    @GetMapping("/filter")
    public List<Project> filter(
            @RequestParam(required = false) String     category,
            @RequestParam(required = false) Status     status,
            @RequestParam(required = false) Experience experience,
            @RequestParam(required = false) Float      budgetMin,
            @RequestParam(required = false) Float      budgetMax) {
        return serviceproject.filter(category, status, experience, budgetMin, budgetMax);
    }

    @GetMapping("/stats")
    public ProjectStatsDTO getStats() {
        return serviceproject.getClientStats(0);
    }

    @GetMapping("/stats/freelancer")
    public ProjectStatsDTO getFreelancerStats() {
        return serviceproject.getFreelancerStats();
    }

    @PostMapping("/notify/new-proposal")
    public ResponseEntity<String> notifyNewProposal(@RequestBody ProposalNotificationDTO dto) {
        Project project = serviceproject.getProjectById(dto.getProjectId());
        if (project == null) return ResponseEntity.notFound().build();

        String clientEmail = project.getClientEmail();
        if (clientEmail == null || clientEmail.isBlank())
            return ResponseEntity.badRequest().body("No client email for this project");

        emailService.sendNewProposalNotification(
                clientEmail,
                project.getTitle(),
                project.getCategory(),
                dto.getProposedBudget(),
                dto.getDeliveryDays(),
                dto.getCoverLetter()
        );
        return ResponseEntity.ok("Email sent to " + clientEmail);
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    /** Treats default / failed-AI title as empty so Addproject can refill from description. */
    private boolean isPlaceholderAiTitle(String s) {
        if (isBlank(s)) return true;
        return "untitled project".equalsIgnoreCase(s.trim());
    }
}