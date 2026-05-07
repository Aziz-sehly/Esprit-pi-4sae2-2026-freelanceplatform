package com.payment.payment.dto;

public record CheckoutSessionResponse(
        Long paymentId,
        String checkoutSessionId,
        String checkoutUrl
) {
}
