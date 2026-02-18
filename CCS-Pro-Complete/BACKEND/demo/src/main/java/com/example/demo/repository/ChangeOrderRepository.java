package com.example.demo.repository;

import com.example.demo.model.ChangeOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChangeOrderRepository extends JpaRepository<ChangeOrder, Long> {
}