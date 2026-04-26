package com.esprit.microservice_project.Services;

import com.esprit.microservice_project.DTO.ProjectStatsDTO;
import com.esprit.microservice_project.Entity.Experience;
import com.esprit.microservice_project.Entity.Project;
import com.esprit.microservice_project.Entity.Status;
import com.esprit.microservice_project.Repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceProjectTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ServiceProject serviceProject;

    private Project project1;
    private Project project2;

    @BeforeEach
    void setUp() {
        project1 = new Project();
        project1.setId(1);
        project1.setTitle("Web App Development");
        project1.setCategory("Web");
        project1.setStatus(Status.OPEN);
        project1.setBudget_min(500f);
        project1.setBudget_max(1000f);
        project1.setSkills("Java, Spring Boot");
        project1.setExperienceLevel(Experience.INTERMEDIATE);

        project2 = new Project();
        project2.setId(2);
        project2.setTitle("Mobile App");
        project2.setCategory("Mobile");
        project2.setStatus(Status.IN_PROGRESS);
        project2.setBudget_min(1000f);
        project2.setBudget_max(2000f);
        project2.setSkills("Flutter, Dart");
        project2.setExperienceLevel(Experience.SENIOR);
    }

    // ===================== addProject =====================
    @Test
    void testAddProject_success() {
        when(projectRepository.save(project1)).thenReturn(project1);

        Project result = serviceProject.addProject(project1);

        assertNotNull(result);
        assertEquals("Web App Development", result.getTitle());
        verify(projectRepository, times(1)).save(project1);
    }

    // ===================== getProjects =====================
    @Test
    void testGetProjects_returnsAll() {
        when(projectRepository.findAll()).thenReturn(Arrays.asList(project1, project2));

        List<Project> result = serviceProject.getProjects();

        assertEquals(2, result.size());
        verify(projectRepository, times(1)).findAll();
    }

    @Test
    void testGetProjects_empty() {
        when(projectRepository.findAll()).thenReturn(List.of());

        List<Project> result = serviceProject.getProjects();

        assertTrue(result.isEmpty());
    }

    // ===================== getProject =====================
    @Test
    void testGetProject_found() {
        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));

        Project result = serviceProject.getProject(1);

        assertNotNull(result);
        assertEquals(1, result.getId());
        assertEquals("Web App Development", result.getTitle());
    }

    @Test
    void testGetProject_notFound_throwsException() {
        when(projectRepository.findById(99)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> serviceProject.getProject(99));

        assertTrue(ex.getMessage().contains("Project not found"));
    }

    // ===================== updateProject =====================
    @Test
    void testUpdateProject_success() {
        Project updates = new Project();
        updates.setTitle("Updated Title");
        updates.setStatus(Status.COMPLETED);

        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));
        when(projectRepository.save(any(Project.class))).thenReturn(project1);

        Project result = serviceProject.updateProject(1, updates);

        assertNotNull(result);
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void testUpdateProject_notFound_throwsException() {
        when(projectRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> serviceProject.updateProject(99, new Project()));
    }

    // ===================== updateProjectStatus =====================
    @Test
    void testUpdateProjectStatus_success() {
        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));
        when(projectRepository.save(any(Project.class))).thenReturn(project1);

        Project result = serviceProject.updateProjectStatus(1, "COMPLETED");

        assertNotNull(result);
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void testUpdateProjectStatus_invalidStatus_throwsException() {
        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));

        assertThrows(IllegalArgumentException.class,
                () -> serviceProject.updateProjectStatus(1, "INVALID_STATUS"));
    }

    // ===================== deleteProject =====================
    @Test
    void testDeleteProject_exists() {
        when(projectRepository.existsById(1)).thenReturn(true);
        doNothing().when(projectRepository).deleteById(1);

        serviceProject.deleteProject(1);

        verify(projectRepository, times(1)).deleteById(1);
    }

    @Test
    void testDeleteProject_notExists_doesNothing() {
        when(projectRepository.existsById(99)).thenReturn(false);

        serviceProject.deleteProject(99);

        verify(projectRepository, never()).deleteById(99);
    }

    // ===================== getProjectById =====================
    @Test
    void testGetProjectById_found() {
        when(projectRepository.findById(1)).thenReturn(Optional.of(project1));

        Project result = serviceProject.getProjectById(1);

        assertNotNull(result);
        assertEquals(1, result.getId());
    }

    @Test
    void testGetProjectById_notFound_returnsNull() {
        when(projectRepository.findById(99)).thenReturn(Optional.empty());

        Project result = serviceProject.getProjectById(99);

        assertNull(result);
    }

    // ===================== getClientStats =====================
    @Test
    void testGetClientStats_correct() {
        when(projectRepository.findAll()).thenReturn(Arrays.asList(project1, project2));

        ProjectStatsDTO stats = serviceProject.getClientStats(1);

        assertNotNull(stats);
        assertEquals(2, stats.getTotalProjects());
        assertEquals(1L, stats.getOpenProjects());
        assertEquals(1L, stats.getInProgressProjects());
        assertEquals(0L, stats.getCompletedProjects());
    }

    // ===================== getFreelancerStats =====================
    @Test
    void testGetFreelancerStats_budgetCalculation() {
        when(projectRepository.findAll()).thenReturn(Arrays.asList(project1, project2));

        ProjectStatsDTO stats = serviceProject.getFreelancerStats();

        assertNotNull(stats);
        assertEquals(2, stats.getTotalProjects());
        // avg min = (500 + 1000) / 2 = 750
        assertEquals(750.0, stats.getAverageBudgetMin());
        // avg max = (1000 + 2000) / 2 = 1500
        assertEquals(1500.0, stats.getAverageBudgetMax());
        // total budget max = 1000 + 2000 = 3000
        assertEquals(3000.0, stats.getTotalBudgetMax());
    }

    // ===================== getProjectsByClientId =====================
    @Test
    void testGetProjectsByClientId() {
        when(projectRepository.findByClientId(1L))
                .thenReturn(List.of(project1));

        List<Project> result = serviceProject.getProjectsByClientId(1);

        assertEquals(1, result.size());
        verify(projectRepository).findByClientId(1L);
    }
}