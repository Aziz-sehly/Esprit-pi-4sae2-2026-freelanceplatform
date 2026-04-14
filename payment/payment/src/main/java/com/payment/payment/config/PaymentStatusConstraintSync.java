package com.payment.payment.config;

import com.payment.payment.model.PaymentStatus;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PaymentStatusConstraintSync {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @PostConstruct
    void syncConstraint() {
        if (!isPostgreSql()) {
            return;
        }

        String allowedStatuses = Arrays.stream(PaymentStatus.values())
                .map(status -> "'" + status.name() + "'")
                .collect(Collectors.joining(", "));

        jdbcTemplate.execute("ALTER TABLE payment DROP CONSTRAINT IF EXISTS payment_status_check");
        jdbcTemplate.execute(
                "ALTER TABLE payment ADD CONSTRAINT payment_status_check CHECK (status IN (" + allowedStatuses + "))"
        );
    }

    private boolean isPostgreSql() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            return metaData.getDatabaseProductName().toLowerCase().contains("postgresql");
        } catch (SQLException ex) {
            throw new IllegalStateException("Failed to detect database platform", ex);
        }
    }
}
