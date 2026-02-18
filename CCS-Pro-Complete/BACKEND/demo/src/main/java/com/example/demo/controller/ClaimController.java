package com.example.demo.controller;

import com.example.demo.model.Claim;
import com.example.demo.service.ClaimService; // Changed from repository
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "*")
public class ClaimController {

    @Autowired
    private ClaimService claimService; // Changed to use the Service

    @GetMapping
    public List<Claim> getAllClaims() {
        return claimService.getAllClaims(); // Now calls the service
    }

    @PostMapping
    public Claim createClaim(@RequestBody Claim claim) {
        // This now triggers the 28-day logic inside ClaimService.saveClaim
        return claimService.saveClaim(claim);
    }
}