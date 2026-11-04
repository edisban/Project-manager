package com.edis.backendproject.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.extern.slf4j.Slf4j;

/**
 * Optional, one-off Flyway repair before migrating ({@code FLYWAY_REPAIR_ON_START=true}).
 * <p>
 * Databases created by earlier versions of this project may have checksums that no longer match
 * (an applied migration was edited). Repair realigns the history table; it never touches data.
 * Leave it disabled in normal operation so unexpected drift fails loudly.
 */
@Slf4j
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy(
            @Value("${app.flyway.repair-on-start:false}") boolean repairOnStart) {
        return flyway -> {
            if (repairOnStart) {
                log.warn("Running Flyway repair before migrating (app.flyway.repair-on-start=true)");
                flyway.repair();
            }
            flyway.migrate();
        };
    }
}
