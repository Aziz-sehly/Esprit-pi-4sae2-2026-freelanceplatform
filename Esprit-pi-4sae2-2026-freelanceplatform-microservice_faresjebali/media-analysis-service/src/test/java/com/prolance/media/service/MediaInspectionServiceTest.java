package com.prolance.media.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MediaInspectionServiceTest {

    @Test
    void detectKind_basicSignatures() {
        assertEquals("PDF", MediaInspectionService.detectKind(new byte[]{'%', 'P', 'D', 'F', '-'}, "x.bin"));
        byte[] jpeg = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        assertEquals("IMAGE", MediaInspectionService.detectKind(jpeg, "a.jpg"));
        assertEquals("VIDEO", MediaInspectionService.detectKind(new byte[]{0, 0, 0}, "clip.mp4"));
        assertEquals("TEXT", MediaInspectionService.detectKind("hello world".getBytes(), "note.txt"));
    }
}
