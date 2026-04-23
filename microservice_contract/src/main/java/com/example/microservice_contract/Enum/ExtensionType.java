package com.example.microservice_contract.Enum;

// Values must exactly match the DB enum definition
public enum ExtensionType {
    COMPLEXITY_UNDERESTIMATED,
    FREELANCER_DELAY,
    CLIENT_DELAY,
    SCOPE_CHANGE,
    FORCE_MAJEURE,
    MUTUAL_AGREEMENT
    // Adjust to whatever your full DB enum list contains
}