package com.example.demo.controller;

import com.example.demo.model.ChangeOrder;
import com.example.demo.service.ChangeOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/change-orders")
@CrossOrigin(origins = "*")
public class ChangeOrderController {

    @Autowired
    private ChangeOrderService service;

    @GetMapping
    public List<ChangeOrder> getOrders() {
        return service.getAll();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ChangeOrder> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        // Clean the string: remove quotes, trim whitespace, and make uppercase
        String cleanStatus = status.replace("\"", "").trim().toUpperCase();

        ChangeOrder updatedOrder = service.updateStatus(id, cleanStatus);
        return ResponseEntity.ok(updatedOrder);
    }
}