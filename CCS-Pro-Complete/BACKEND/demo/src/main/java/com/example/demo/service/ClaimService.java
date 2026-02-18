package com.example.demo.service;

import com.example.demo.model.Claim;
import com.example.demo.repository.ClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ClaimService {

    @Autowired
    private ClaimRepository claimRepository;

    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    public Claim saveClaim(Claim claim) {
        // Validation: Calculate the 28-day rule on the backend
        if (claim.getEventDate() != null && claim.getNoticeDate() != null) {
            long daysBetween = ChronoUnit.DAYS.between(claim.getEventDate(), claim.getNoticeDate());

            if (daysBetween > 28) {
                claim.setStatus("LATE");
            } else {
                claim.setStatus("VALID");
            }
        }
        return claimRepository.save(claim);
    }
}