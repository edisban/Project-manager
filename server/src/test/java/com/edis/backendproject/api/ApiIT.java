package com.edis.backendproject.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.Cookie;

/**
 * End-to-end API tests against real PostgreSQL and Redis containers, exercising the full
 * security filter chain, Flyway migrations, validation and error handling.
 */
@SpringBootTest(properties = {
        "jwt.secret=integration-test-secret-that-is-long-enough-1234567890",
        "app.admin.username=admin",
        "app.admin.password=admin-password-123",
        "app.auth.max-login-attempts=3"
})
@AutoConfigureMockMvc
class ApiIT {

    private static final String ADMIN = "admin";
    private static final String ADMIN_PASSWORD = "admin-password-123";
    private static final String PASSWORD = "correct-horse-battery";

    @DynamicPropertySource
    static void containerProperties(DynamicPropertyRegistry registry) {
        TestContainers.register(registry);
    }

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    // ---------------------------------------------------------------- authentication

    @Nested
    class Authentication {

        @Test
        void protectedEndpointsRequireAuthentication() throws Exception {
            mvc.perform(get("/api/projects"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Authentication required"));
        }

        @Test
        void registerLoginAndMe() throws Exception {
            String username = uniqueName();
            register(username, PASSWORD).andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.username").value(username))
                    .andExpect(jsonPath("$.data.role").value("USER"));

            MvcResult login = mvc.perform(post("/api/auth/login").with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body(Map.of("username", username, "password", PASSWORD))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.token").doesNotExist())
                    .andReturn();

            Cookie cookie = login.getResponse().getCookie("access_token");
            assertThat(cookie).isNotNull();
            assertThat(cookie.isHttpOnly()).isTrue();
            assertThat(cookie.getPath()).isEqualTo("/api");
            assertThat(login.getResponse().getHeader("Set-Cookie")).contains("SameSite=Strict");

            mvc.perform(get("/api/auth/me").cookie(cookie))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.username").value(username))
                    .andExpect(jsonPath("$.data.expiresAt").isNotEmpty());
        }

        @Test
        void duplicateUsernameIsConflictCaseInsensitively() throws Exception {
            String username = uniqueName();
            register(username, PASSWORD).andExpect(status().isCreated());
            register(username.toUpperCase(), PASSWORD)
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("This username is already taken"));
        }

        @Test
        void weakRegistrationIsRejectedWithFieldErrors() throws Exception {
            register("x", "short")
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.validationErrors.username").exists())
                    .andExpect(jsonPath("$.validationErrors.password").exists());
        }

        @Test
        void wrongPasswordIsUnauthorized() throws Exception {
            String username = uniqueName();
            register(username, PASSWORD);
            attemptLogin(username, "wrong-password")
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid username or password"));
        }

        @Test
        void repeatedFailuresAreRateLimited() throws Exception {
            String username = uniqueName();
            register(username, PASSWORD);
            for (int i = 0; i < 3; i++) {
                attemptLogin(username, "wrong-password").andExpect(status().isUnauthorized());
            }
            // Even the correct password is rejected while locked out.
            attemptLogin(username, PASSWORD)
                    .andExpect(status().isTooManyRequests())
                    .andExpect(header().exists("Retry-After"));
        }

        @Test
        void logoutRevokesTheToken() throws Exception {
            Cookie cookie = newUser();
            mvc.perform(post("/api/auth/logout").with(csrf()).cookie(cookie))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("Max-Age=0")));

            mvc.perform(get("/api/auth/me").cookie(cookie)).andExpect(status().isUnauthorized());
        }

        @Test
        void stateChangingRequestsWithoutCsrfTokenAreRejected() throws Exception {
            Cookie cookie = newUser();
            mvc.perform(post("/api/projects").cookie(cookie)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body(Map.of("name", "No CSRF"))))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.message").value("Invalid or missing CSRF token"));
        }
    }

    // ---------------------------------------------------------------- authorization / ownership

    @Nested
    class Ownership {

        @Test
        void usersOnlySeeTheirOwnProjectsAndAdminSeesAll() throws Exception {
            Cookie alice = newUser();
            Cookie bob = newUser();
            String name = "Secret " + UUID.randomUUID();
            long projectId = createProject(alice, name);

            mvc.perform(get("/api/projects/{id}", projectId).cookie(bob))
                    .andExpect(status().isNotFound());
            mvc.perform(get("/api/projects").param("q", name).cookie(bob))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalElements").value(0));
            mvc.perform(delete("/api/projects/{id}", projectId).with(csrf()).cookie(bob))
                    .andExpect(status().isNotFound());

            mvc.perform(get("/api/projects").param("q", name).cookie(login(ADMIN, ADMIN_PASSWORD)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalElements").value(1))
                    .andExpect(jsonPath("$.data.content[0].ownerUsername").isNotEmpty());
        }

        @Test
        void projectNamesAreUniquePerOwner() throws Exception {
            Cookie alice = newUser();
            Cookie bob = newUser();
            createProject(alice, "Apollo");

            send(post("/api/projects"), alice, Map.of("name", "apollo"))
                    .andExpect(status().isConflict());
            send(post("/api/projects"), bob, Map.of("name", "Apollo"))
                    .andExpect(status().isCreated())
                    .andExpect(header().exists("Location"));
        }

        @Test
        void deletingAccountRemovesProjectsAndRevokesToken() throws Exception {
            Cookie carol = newUser();
            long projectId = createProject(carol, "Doomed");

            mvc.perform(delete("/api/users/me").with(csrf()).cookie(carol))
                    .andExpect(status().isNoContent());

            mvc.perform(get("/api/auth/me").cookie(carol)).andExpect(status().isUnauthorized());
            mvc.perform(get("/api/projects/{id}", projectId).cookie(login(ADMIN, ADMIN_PASSWORD)))
                    .andExpect(status().isNotFound());
        }

        @Test
        void adminCannotDeleteOwnAccount() throws Exception {
            mvc.perform(delete("/api/users/me").with(csrf()).cookie(login(ADMIN, ADMIN_PASSWORD)))
                    .andExpect(status().isForbidden());
        }
    }

    // ---------------------------------------------------------------- students

    @Nested
    class Students {

        @Test
        void crudSearchPaginationAndMovingBetweenProjects() throws Exception {
            Cookie user = newUser();
            long apollo = createProject(user, "Apollo");
            long gemini = createProject(user, "Gemini");

            long adaId = createStudent(user, apollo, "100001", "Ada", "Lovelace");
            createStudent(user, apollo, "100002", "Alan", "Turing");
            createStudent(user, apollo, "100003", "Γιώργος", "Παπαδόπουλος");

            // Partial, case-insensitive search on names, full name and student ID.
            mvc.perform(get("/api/projects/{id}/students", apollo).param("q", "LOVE").cookie(user))
                    .andExpect(jsonPath("$.data.totalElements").value(1))
                    .andExpect(jsonPath("$.data.content[0].firstName").value("Ada"));
            mvc.perform(get("/api/projects/{id}/students", apollo).param("q", "ada love").cookie(user))
                    .andExpect(jsonPath("$.data.totalElements").value(1));
            mvc.perform(get("/api/projects/{id}/students", apollo).param("q", "10000").cookie(user))
                    .andExpect(jsonPath("$.data.totalElements").value(3));

            // Pagination.
            mvc.perform(get("/api/projects/{id}/students", apollo).param("size", "2").cookie(user))
                    .andExpect(jsonPath("$.data.content.length()").value(2))
                    .andExpect(jsonPath("$.data.totalPages").value(2));

            // The project list reports the student count.
            mvc.perform(get("/api/projects/{id}", apollo).cookie(user))
                    .andExpect(jsonPath("$.data.studentCount").value(3));

            // Duplicate student ID within the same project is a conflict.
            send(post("/api/students"), user, student(apollo, "100001", "Dup", "Licate"))
                    .andExpect(status().isConflict());

            // Moving a student to another project (this was silently ignored before).
            send(put("/api/students/{id}", adaId), user, student(gemini, "100001", "Ada", "Lovelace"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.projectId").value(gemini))
                    .andExpect(jsonPath("$.data.projectName").value("Gemini"));
            mvc.perform(get("/api/projects/{id}", apollo).cookie(user))
                    .andExpect(jsonPath("$.data.studentCount").value(2));

            // Deleting a project deletes its students.
            mvc.perform(delete("/api/projects/{id}", gemini).with(csrf()).cookie(user))
                    .andExpect(status().isNoContent());
            mvc.perform(get("/api/students/{id}", adaId).cookie(user))
                    .andExpect(status().isNotFound());
        }

        @Test
        void cannotAddStudentToSomeoneElsesProject() throws Exception {
            long project = createProject(newUser(), "Private");
            send(post("/api/students"), newUser(), student(project, "1", "Eve", "Spy"))
                    .andExpect(status().isNotFound());
        }

        @Test
        void invalidStudentIsRejected() throws Exception {
            Cookie user = newUser();
            long project = createProject(user, "Validation");
            send(post("/api/students"), user, student(project, "abc", "123", "Name"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.validationErrors.codeNumber").exists())
                    .andExpect(jsonPath("$.validationErrors.firstName").exists());
        }
    }

    // ---------------------------------------------------------------- error handling

    @Nested
    class ErrorHandling {

        @Test
        void malformedRequestsAreClientErrorsNotServerErrors() throws Exception {
            Cookie user = newUser();
            mvc.perform(get("/api/projects/not-a-number").cookie(user))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
            mvc.perform(get("/api/projects").param("sort", "owner.password").cookie(user))
                    .andExpect(status().isBadRequest());
            mvc.perform(post("/api/projects").with(csrf()).cookie(user)
                            .contentType(MediaType.APPLICATION_JSON).content("{not json"))
                    .andExpect(status().isBadRequest());
            mvc.perform(get("/api/does-not-exist").cookie(user))
                    .andExpect(status().isNotFound());
            mvc.perform(get("/api/projects/{id}", 999_999).cookie(user))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.message").value("Project not found"));
        }

        @Test
        void healthEndpointIsPublic() throws Exception {
            mvc.perform(get("/actuator/health"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("UP"));
        }

        @Test
        void securityHeadersArePresent() throws Exception {
            mvc.perform(get("/api/auth/csrf"))
                    .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                    .andExpect(header().stringValues("Cache-Control", hasItem(not(""))));
        }
    }

    // ---------------------------------------------------------------- dashboard

    @Nested
    class Dashboard {

        @Test
        void overviewIsScopedToTheCallerAndCountsTodaysActivity() throws Exception {
            Cookie user = newUser();
            long apollo = createProject(user, "Apollo");
            long gemini = createProject(user, "Gemini");
            createStudent(user, apollo, "1", "Ada", "Lovelace");
            createStudent(user, apollo, "2", "Alan", "Turing");
            createStudent(user, gemini, "3", "Grace", "Hopper");
            createProject(newUser(), "Someone else's");

            mvc.perform(get("/api/dashboard").cookie(user))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.projectCount").value(2))
                    .andExpect(jsonPath("$.data.studentCount").value(3))
                    .andExpect(jsonPath("$.data.studentsAddedLast7Days").value(3))
                    .andExpect(jsonPath("$.data.activity.length()").value(14))
                    .andExpect(jsonPath("$.data.activity[13].count").value(3))
                    .andExpect(jsonPath("$.data.topProjects[0].name").value("Apollo"))
                    .andExpect(jsonPath("$.data.topProjects.length()").value(2))
                    .andExpect(jsonPath("$.data.recentStudents[0].firstName").value("Grace"));
        }

        @Test
        void newUsersGetAnEmptyOverview() throws Exception {
            mvc.perform(get("/api/dashboard").cookie(newUser()))
                    .andExpect(jsonPath("$.data.projectCount").value(0))
                    .andExpect(jsonPath("$.data.activity.length()").value(14))
                    .andExpect(jsonPath("$.data.recentStudents.length()").value(0));
        }
    }

    // ---------------------------------------------------------------- helpers

    private static String uniqueName() {
        return "user_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String body(Object value) throws Exception {
        return json.writeValueAsString(value);
    }

    private org.springframework.test.web.servlet.ResultActions register(String username, String password)
            throws Exception {
        return mvc.perform(post("/api/auth/register").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("username", username, "password", password))));
    }

    private org.springframework.test.web.servlet.ResultActions attemptLogin(String username, String password)
            throws Exception {
        return mvc.perform(post("/api/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("username", username, "password", password))));
    }

    private Cookie login(String username, String password) throws Exception {
        Cookie cookie = attemptLogin(username, password)
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie("access_token");
        assertThat(cookie).isNotNull();
        return cookie;
    }

    private Cookie newUser() throws Exception {
        String username = uniqueName();
        register(username, PASSWORD).andExpect(status().isCreated());
        return login(username, PASSWORD);
    }

    private org.springframework.test.web.servlet.ResultActions send(MockHttpServletRequestBuilder request,
                                                                   Cookie cookie, Object payload) throws Exception {
        return mvc.perform(request.with(csrf()).cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(payload)));
    }

    private long createProject(Cookie cookie, String name) throws Exception {
        MvcResult result = send(post("/api/projects"), cookie, Map.of("name", name, "description", "Test project"))
                .andExpect(status().isCreated())
                .andReturn();
        return readId(result);
    }

    private long createStudent(Cookie cookie, long projectId, String code, String first, String last)
            throws Exception {
        MvcResult result = send(post("/api/students"), cookie, student(projectId, code, first, last))
                .andExpect(status().isCreated())
                .andReturn();
        return readId(result);
    }

    private static Map<String, Object> student(long projectId, String code, String first, String last) {
        return Map.of(
                "codeNumber", code,
                "firstName", first,
                "lastName", last,
                "dateOfBirth", "1995-05-17",
                "title", "Engineer",
                "projectId", projectId);
    }

    private long readId(MvcResult result) throws Exception {
        JsonNode node = json.readTree(result.getResponse().getContentAsString());
        return node.path("data").path("id").asLong();
    }
}
