package com.prolance.message.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CensorServiceTest {

    private CensorService censorService;

    @BeforeEach
    void setUp() {
        censorService = new CensorService();
        ReflectionTestUtils.setField(censorService, "enabled", true);
        ReflectionTestUtils.setField(censorService, "bannedWords", List.of("badword", "spam"));
        ReflectionTestUtils.setField(censorService, "replacement", "***");
    }

    @Test
    void returnsNullWhenInputNull() {
        assertNull(censorService.censor(null));
    }

    @Test
    void returnsBlankUnchanged() {
        assertEquals("   ", censorService.censor("   "));
    }

    @Test
    void replacesBannedWordsCaseInsensitive() {
        String result = censorService.censor("This is a BadWord and some SPAM here");
        assertEquals("This is a *** and some *** here", result);
    }

    @Test
    void leavesUnrelatedTextAlone() {
        String result = censorService.censor("Hello world, nothing wrong here");
        assertEquals("Hello world, nothing wrong here", result);
    }

    @Test
    void noopWhenDisabled() {
        ReflectionTestUtils.setField(censorService, "enabled", false);
        String result = censorService.censor("badword stays");
        assertEquals("badword stays", result);
    }

    @Test
    void noopWhenBannedListEmpty() {
        ReflectionTestUtils.setField(censorService, "bannedWords", List.of());
        String result = censorService.censor("anything goes");
        assertEquals("anything goes", result);
    }
}
