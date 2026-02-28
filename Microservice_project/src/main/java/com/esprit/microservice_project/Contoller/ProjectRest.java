package com.esprit.microservice_project.Contoller;

import com.esprit.microservice_project.DTO.ProjectAISuggestRequest;
import com.esprit.microservice_project.DTO.ProjectAISuggestResponse;
import com.esprit.microservice_project.DTO.ProjectStatsDTO;
import com.esprit.microservice_project.Entity.Experience;
import com.esprit.microservice_project.Entity.Project;
import com.esprit.microservice_project.Entity.Status;
import com.esprit.microservice_project.Services.AIProjectSuggestService;
import com.esprit.microservice_project.Services.IServiceProject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.esprit.microservice_project.Services.EmailService;
import com.esprit.microservice_project.DTO.ProposalNotificationDTO;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/project")
public class ProjectRest {

    @Autowired
    IServiceProject serviceproject;

    @Autowired
    AIProjectSuggestService aiSuggestService;

    @Autowired
    EmailService emailService;

    // ── AI suggest (avant création) ─────────────────────────────────────────

    /**
     * POST /project/ai-suggest
     * Body: { "description": "...", "duration": "2 weeks" }
     * Returns suggested title, skills, budgetMin, budgetMax
     */
    @PostMapping("/ai-suggest")
    public ProjectAISuggestResponse aiSuggest(@RequestBody ProjectAISuggestRequest req) {
        return aiSuggestService.suggest(req.getDescription(), req.getDuration());
    }

    // ── CRUD ────────────────────────────────────────────────────────────────

    /**
     * POST /project/Addproject
     * Auto-fills title, skills, budget_min, budget_max from AI
     * if those fields are blank/null and description is provided.
     */
    @PostMapping("/Addproject")
    public Project Addproject(@RequestBody Project p) {
        boolean needsAI = p.getDescription() != null && !p.getDescription().isBlank()
                && (isBlank(p.getTitle()) || isBlank(p.getSkills())
                || p.getBudget_min() == null || p.getBudget_max() == null);

        if (needsAI) {
            String duration = p.getDuration() != null ? p.getDuration() : "";
            ProjectAISuggestResponse suggestion =
                    aiSuggestService.suggest(p.getDescription(), duration);

            if (isBlank(p.getTitle()))   p.setTitle(suggestion.getTitle());
            if (isBlank(p.getSkills()))  p.setSkills(suggestion.getSkills());
            if (p.getBudget_min() == null) p.setBudget_min(suggestion.getBudgetMin());
            if (p.getBudget_max() == null) p.setBudget_max(suggestion.getBudgetMax());
        }

        return serviceproject.addProject(p);
    }

    @GetMapping("/GetAllProjects")
    public List<Project> GetAllProjects() {
        return serviceproject.getProjects();
    }

    @GetMapping("/GetProject/{id}")
    public Project GetProject(@PathVariable int id) {
        return serviceproject.getProject(id);
    }

    @PutMapping("/UpdateProject/{id}")
    public Project UpdateProject(@PathVariable int id, @RequestBody Project p) {
        return serviceproject.updateProject(id, p);
    }

    @DeleteMapping("/DeleteProject/{id}")
    public void DeleteProject(@PathVariable int id) {
        serviceproject.deleteProject(id);
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

    // ── Util ────────────────────────────────────────────────────────────────

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }


    @PostMapping("/notify/new-proposal")
    public ResponseEntity<String> notifyNewProposal(
            @RequestBody ProposalNotificationDTO dto) {

        Project project = serviceproject.getProjectById(dto.getProjectId());

        if (project == null)
            return ResponseEntity.notFound().build();

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
}