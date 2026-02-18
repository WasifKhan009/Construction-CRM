package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class ChangeOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long projectId; // Added to link the change order to a project
    private String description;
    private String status; // PENDING, ACCEPTED, DECLINED
    private LocalDate dateReceived;

    // NEW FIELD
    private Double amount;
}