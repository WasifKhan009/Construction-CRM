package com.example.demo.controller;

import com.example.demo.model.Project;
import com.example.demo.repository.ProjectRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    private final ProjectRepository projectRepository;

    public ProjectController(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @GetMapping("/{id}")
    public Project getProjectById(@PathVariable Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) {
        Project project = projectRepository.findById(id).orElseThrow();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + project.getDocumentName() + "\"")
                .body(project.getDocumentData());
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<Project> createProject(
            @RequestParam("projectName") String name,
            @RequestParam("projectNumber") String number,
            @RequestParam("status") String status,
            @RequestParam("originalBudget") Double originalBudget,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        Project project = new Project();
        project.setProjectName(name);
        project.setProjectNumber(number);
        project.setStatus(status);
        project.setOriginalBudget(originalBudget);

        // Convert String dates from frontend to LocalDate
        if (startDate != null && !startDate.isEmpty()) project.setStartDate(LocalDate.parse(startDate));
        if (endDate != null && !endDate.isEmpty()) project.setEndDate(LocalDate.parse(endDate));

        if (file != null && !file.isEmpty()) {
            try {
                byte[] fileBytes = file.getBytes();
                project.setDocumentData(fileBytes);
                project.setDocumentName(file.getOriginalFilename());
            } catch (IOException e) {
                return ResponseEntity.status(500).build();
            }
        }

        Project saved = projectRepository.save(project);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public Project updateProject(@PathVariable Long id, @RequestBody Project projectDetails) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        project.setProjectName(projectDetails.getProjectName());
        project.setProjectNumber(projectDetails.getProjectNumber());

        return projectRepository.save(project);
    }

    @DeleteMapping("/{id}")
    public void deleteProject(@PathVariable Long id) {
        projectRepository.deleteById(id);
    }
}