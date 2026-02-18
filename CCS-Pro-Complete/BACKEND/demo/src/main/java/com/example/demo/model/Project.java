package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data // This comes from Lombok - it handles getters/setters automatically
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String projectName;
    private String projectNumber;
    private String status; // e.g., "Active", "Completed"

    // --- NEW FIELDS FOR FILE UPLOAD ---
    private String documentName;

    @Lob
    @Column(columnDefinition = "LONGBLOB") // Ensures MySQL can handle large files
    private byte[] documentData;

    // --- NEW FIELDS FOR BUDGET AND DATES ---
    private Double originalBudget;
    private java.time.LocalDate startDate;
    private java.time.LocalDate endDate;
}