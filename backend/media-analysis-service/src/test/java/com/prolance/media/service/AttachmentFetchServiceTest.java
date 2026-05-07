package com.prolance.media.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AttachmentFetchServiceTest {

    @Test
    void extractFilename_stripsQueryAndPrefix() {
        assertEquals("abc.jpg", AttachmentFetchService.extractAttachmentFilename("/messages/attachments/abc.jpg?x=1"));
        assertEquals("uuid.png", AttachmentFetchService.extractAttachmentFilename("https://x/messages/attachments/uuid.png"));
    }
}
