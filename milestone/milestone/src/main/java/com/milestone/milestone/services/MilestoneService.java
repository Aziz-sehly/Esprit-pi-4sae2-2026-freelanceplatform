package com.milestone.milestone.services;

import com.milestone.milestone.dto.MilestoneRequest;
import com.milestone.milestone.dto.MilestoneResponse;
import com.milestone.milestone.exception.NotFoundException;
import com.milestone.milestone.models.Milestone;
import com.milestone.milestone.models.MilestoneStatus;
import com.milestone.milestone.repositories.MilestoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MilestoneService {

    private final MilestoneRepository repo;

    public MilestoneResponse create(MilestoneRequest req) {
        Milestone m = Milestone.builder()
                .contractId(req.contractId())
                .title(req.title())
                .deliverable(req.deliverable())
                .amount(req.amount())
                .dueDate(req.dueDate())
                .status(MilestoneStatus.PENDING)
                .build();

        return toResponse(repo.save(m));
    }

    @Transactional(readOnly = true)
    public MilestoneResponse getById(Long id) {
        return toResponse(repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<MilestoneResponse> getByContractId(Long contractId) {
        return repo.findByContractId(contractId).stream().map(this::toResponse).toList();
    }

    public MilestoneResponse update(Long id, MilestoneRequest req) {
        Milestone m = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));

        m.setContractId(req.contractId());
        m.setTitle(req.title());
        m.setDeliverable(req.deliverable());
        m.setAmount(req.amount());
        m.setDueDate(req.dueDate());

        return toResponse(repo.save(m));
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) throw new NotFoundException("Milestone not found: " + id);
        repo.deleteById(id);
    }

    // Fast “workflow-ish” endpoints but still simple
    public MilestoneResponse approve(Long id) {
        Milestone m = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));
        m.setStatus(MilestoneStatus.APPROVED);
        m.setClientApprovedAt(LocalDateTime.now());
        return toResponse(repo.save(m));
    }

    public MilestoneResponse markPaid(Long id) {
        Milestone m = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id)) ;
        m.setStatus(MilestoneStatus.PAID);
        m.setPaidAt(LocalDateTime.now());
        return toResponse(repo.save(m));
    }
    public MilestoneResponse submit(Long id) {
        Milestone m = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Milestone not found: " + id));

        // simple workflow guard
        if (m.getStatus() == MilestoneStatus.PAID || m.getStatus() == MilestoneStatus.APPROVED) {
            throw new IllegalStateException("Cannot submit milestone in status: " + m.getStatus());
        }

        m.setStatus(MilestoneStatus.SUBMITTED);
        m.setSubmittedAt(LocalDateTime.now());

        return toResponse(repo.save(m));
    }
    private MilestoneResponse toResponse(Milestone m) {
        return new MilestoneResponse(
                m.getId(),
                m.getContractId(),
                m.getTitle(),
                m.getDeliverable(),
                m.getAmount(),
                m.getDueDate(),
                m.getStatus(),
                m.getSubmittedAt(),
                m.getClientApprovedAt(),
                m.getPaidAt(),
                m.getCreatedAt()
        );
    }
}