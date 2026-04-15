package com.milestone.milestone.controllers;

import com.milestone.milestone.dto.TypingEvent;
import com.milestone.milestone.services.ContractChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ContractChatSocketController {

    private final ContractChatService service;

    @MessageMapping("/contracts/{contractId}/typing")
    public void typing(@DestinationVariable Long contractId, TypingEvent event) {
        service.typing(new TypingEvent(
                contractId,
                event.senderId(),
                event.senderRole(),
                event.senderName(),
                event.typing(),
                event.createdAt()
        ));
    }
}
