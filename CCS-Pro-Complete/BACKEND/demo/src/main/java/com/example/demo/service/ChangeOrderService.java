package com.example.demo.service;

import com.example.demo.model.ChangeOrder;
import com.example.demo.repository.ChangeOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ChangeOrderService {

    @Autowired
    private ChangeOrderRepository repository;

    public List<ChangeOrder> getAll() {
        return repository.findAll();
    }

    public ChangeOrder updateStatus(Long id, String status) {
        ChangeOrder co = repository.findById(id).orElseThrow();
        co.setStatus(status);
        return repository.save(co);
    }

    public ChangeOrder save(ChangeOrder co) {
        return repository.save(co);
    }
}