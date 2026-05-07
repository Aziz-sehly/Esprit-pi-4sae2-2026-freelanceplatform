package com.example.microservice_contract.repository;

import com.example.microservice_contract.entity.ContractSignature;
import com.example.microservice_contract.Enum.SignatureStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IContractSignatureRepository extends JpaRepository<ContractSignature, Long> {

    List<ContractSignature> findByContractId(Long contractId);

    Optional<ContractSignature> findByContractIdAndSignerId(Long contractId, Long signerId);

    List<ContractSignature> findByContractIdAndStatus(Long contractId, SignatureStatus status);

    // Used when the signer clicks the link from their email
    Optional<ContractSignature> findByToken(String token);

    boolean existsByContractIdAndSignerIdAndStatus(Long contractId, Long signerId, SignatureStatus status);

    long countByContractIdAndStatus(Long contractId, SignatureStatus status);

    /**
     * Find signature by token and validate it belongs to specific email
     * Used for security check before allowing signature submission
     */
    @Query("SELECT s FROM ContractSignature s WHERE s.token = :token AND s.signerEmail = :email")
    Optional<ContractSignature> findByTokenAndSignerEmail(@Param("token") String token,
                                                          @Param("email") String email);

    /**
     * Check if a signature token exists and is valid (not expired, not signed)
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM ContractSignature s " +
            "WHERE s.token = :token AND s.status = 'PENDING' " +
            "AND (s.expiresAt IS NULL OR s.expiresAt > CURRENT_TIMESTAMP)")
    boolean isValidToken(@Param("token") String token);

    /**
     * Find all pending signatures for a contract that are about to expire
     * Useful for sending reminder emails
     */
    @Query("SELECT s FROM ContractSignature s WHERE s.contract.id = :contractId " +
            "AND s.status = 'PENDING' " +
            "AND s.expiresAt BETWEEN CURRENT_TIMESTAMP AND :reminderTime")
    List<ContractSignature> findPendingSignaturesNearExpiration(@Param("contractId") Long contractId,
                                                                @Param("reminderTime") java.time.LocalDateTime reminderTime);

    /**
     * Count how many parties have signed a contract
     */
    @Query("SELECT COUNT(s) FROM ContractSignature s WHERE s.contract.id = :contractId AND s.status = 'SIGNED'")
    long countSignedByContractId(@Param("contractId") Long contractId);

    /**
     * Check if specific user has already signed a contract
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM ContractSignature s " +
            "WHERE s.contract.id = :contractId AND s.signerId = :userId AND s.status = 'SIGNED'")
    boolean hasUserSignedContract(@Param("contractId") Long contractId,
                                  @Param("userId") Long userId);
}