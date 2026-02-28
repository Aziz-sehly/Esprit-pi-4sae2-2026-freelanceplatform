package com.payment.payment.service;

import com.payment.payment.client.MilestoneClient;
import com.payment.payment.dto.PaymentRequest;
import com.payment.payment.dto.PaymentResponse;
import com.payment.payment.model.Payment;
import com.payment.payment.model.PaymentStatus;
import com.payment.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository repo;
    private final MilestoneClient milestoneClient;

    public PaymentResponse create(PaymentRequest req) {
        BigDecimal fee = req.amount().multiply(new BigDecimal("0.05"));
        fee = fee.setScale(2, BigDecimal.ROUND_HALF_UP);

        Payment p = Payment.builder()
                .contractId(req.contractId())
                .milestoneId(req.milestoneId())
                .payerId(req.payerId())
                .payeeId(req.payeeId())
                .amount(req.amount())
                .platformFee(fee)
                .method(req.method())
                .status(PaymentStatus.SUCCESS)
                .provider("MANUAL")
                .build();

        Payment saved = repo.save(p); // store saved

        //  CALL MILESTONE MS after payment success
        if (saved.getMilestoneId() != null && saved.getStatus() == PaymentStatus.SUCCESS) {
            milestoneClient.markPaid(saved.getMilestoneId());
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getById(Long id) {
        Payment p = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + id));
        return toResponse(p);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> list(Long contractId, Long milestoneId) {
        if (milestoneId != null) {
            return repo.findByMilestoneId(milestoneId).stream().map(this::toResponse).toList();
        }
        if (contractId != null) {
            return repo.findByContractId(contractId).stream().map(this::toResponse).toList();
        }
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getContractId(),
                p.getMilestoneId(),
                p.getPayerId(),
                p.getPayeeId(),
                p.getAmount(),
                p.getPlatformFee(),
                p.getMethod(),
                p.getStatus(),
                p.getProvider(),
                p.getProviderRef(),
                p.getCreatedAt()
        );
    }
}