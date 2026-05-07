package com.payment.payment.repository;


import com.payment.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByContractId(Long contractId);
    List<Payment> findByMilestoneId(Long milestoneId);
}