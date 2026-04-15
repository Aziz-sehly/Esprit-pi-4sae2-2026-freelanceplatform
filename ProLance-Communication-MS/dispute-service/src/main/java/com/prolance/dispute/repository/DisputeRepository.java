package com.prolance.dispute.repository;

import com.prolance.dispute.domain.Dispute;
import com.prolance.dispute.domain.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    List<Dispute> findByStatus(DisputeStatus status);

    List<Dispute> findByContractId(Long contractId);

    List<Dispute> findByRaisedByUserIdOrderByCreatedAtDesc(Long raisedByUserId);

    List<Dispute> findByRaisedByUserIdAndContractIdOrderByCreatedAtDesc(Long raisedByUserId, Long contractId);

    List<Dispute> findByRaisedByUserIdAndStatusOrderByCreatedAtDesc(Long raisedByUserId, DisputeStatus status);

    List<Dispute> findByRaisedByUserIdAndContractIdAndStatusOrderByCreatedAtDesc(
            Long raisedByUserId, Long contractId, DisputeStatus status);

    List<Dispute> findByStatusAndDeadlineAtIsNotNullAndDeadlineAtLessThanEqual(DisputeStatus status, java.time.LocalDateTime time);

    List<Dispute> findByStatusIn(List<DisputeStatus> statuses);
}
