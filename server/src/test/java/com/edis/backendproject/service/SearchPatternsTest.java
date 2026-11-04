package com.edis.backendproject.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SearchPatternsTest {

    @Test
    void blankQueryMatchesEverything() {
        assertThat(SearchPatterns.contains(null)).isEqualTo("%");
        assertThat(SearchPatterns.contains("   ")).isEqualTo("%");
    }

    @Test
    void queryIsTrimmedAndLowerCased() {
        assertThat(SearchPatterns.contains("  Ada ")).isEqualTo("%ada%");
    }

    @Test
    void wildcardsAreEscaped() {
        assertThat(SearchPatterns.contains("50%_a\\b")).isEqualTo("%50\\%\\_a\\\\b%");
    }
}
